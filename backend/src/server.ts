import express, { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import fs from "fs";
import cors from "cors";
import admin from 'firebase-admin';
import path from 'path';

dotenv.config();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

// Initialize Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Body parser middleware
app.use(express.json());

// Authentication middleware
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    (req as any).user = { 
      uid: decodedToken.uid, 
      email: decodedToken.email || undefined 
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Manually handle OPTIONS requests (CORS preflight)
app.options("*", cors());

const upload = multer({ dest: "uploads/" });

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.post(
  "/upload",
  authenticate,
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    if (!req.user?.uid) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const fileId = uuidv4();
    const fileKey = `${req.user.uid}/${fileId}-${req.file.originalname}`;
    const fileStream = fs.createReadStream(req.file.path);

    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileKey,
      Body: fileStream,
      ContentType: req.file.mimetype,
    };

    try {
      const s3Data = await s3.upload(s3Params).promise();
      fs.unlinkSync(req.file.path);

      const dbParams = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
        Item: {
          userId: req.user.uid,
          fileId,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          s3Key: fileKey,
          s3Url: s3Data.Location,
          uploadedAt: new Date().toISOString(),
          ownerEmail: req.user.email,
          isPublic: false,
          lastModified: new Date().toISOString()
        },
      };

      await dynamoDb.put(dbParams).promise();
      res.json({ message: "File uploaded!", fileUrl: s3Data.Location });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).send("Failed to upload file.");
    }
  }
);

app.get("/files", authenticate, async (req: Request, res: Response) => {
  if (!req.user?.uid) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const dbParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
    IndexName: "UserIdIndex",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": req.user.uid,
    },
  };

  try {
    const data = await dynamoDb.query(dbParams).promise();
    res.json({ files: data.Items });
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).send("Failed to fetch files.");
  }
});

app.delete(
  "/delete/:fileId",
  authenticate,
  async (req: Request, res: Response) => {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: "File ID is required" });
    }

    if (!req.user?.uid) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    try {
      // First get the file to verify ownership
      const getParams = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
        Key: {
          userId: req.user.uid,
          fileId,
        },
      };

      const fileData = await dynamoDb.get(getParams).promise();
      
      if (!fileData.Item) {
        return res.status(404).json({ error: "File not found or access denied" });
      }

      // Delete from S3
      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileData.Item.s3Key,
      };
      
      await s3.deleteObject(s3Params).promise();
      
      // Delete from DynamoDB
      await dynamoDb.delete({
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
        Key: {
          userId: req.user.uid,
          fileId,
        },
      }).promise();

      // Delete the temporary file
      if (fileData.Item.s3Key) {
        const filePath = path.join(uploadsDir, fileData.Item.s3Key.split('/').pop() || '');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ error: "Failed to delete file" });
    }
  }
);

// Start the server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
