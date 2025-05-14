import express, { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import fs from "fs";
import cors from "cors";

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

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

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  region: process.env.AWS_REGION!,
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).send("No file uploaded.");
      return;
    }

    const fileId = uuidv4();
    const fileKey = fileId + "-" + req.file.originalname;
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
          userId: "demo-user",
          fileId,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          s3Key: fileKey,
          s3Url: s3Data.Location,
          uploadedAt: new Date().toISOString(),
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

app.get("/files", async (req: Request, res: Response) => {
  const dbParams = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: {
      ":uid": "demo-user",
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
  async (
    req: express.Request<{ fileId: string }>,
    res: express.Response
  ): Promise<void> => {
    const { fileId } = req.params;
    if (!fileId) {
      res.status(400).send("File ID is required");
      return;
    }

    try {
      const dbParams = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME!,
        Key: {
          userId: "demo-user",
          fileId,
        },
      };

      const fileData = await dynamoDb.get(dbParams).promise();
      if (!fileData.Item) {
        res.status(404).send("File not found");
        return;
      }

      const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileData.Item.s3Key,
      };
      await s3.deleteObject(s3Params).promise();
      await dynamoDb.delete(dbParams).promise();

      res.status(200).send("File deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).send("Failed to delete file.");
    }
  }
);
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
