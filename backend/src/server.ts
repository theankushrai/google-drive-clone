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

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

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
          userId: "demo-user", // <-- Required partition key (must match table definition)
          fileId, // <-- Can be your sort key if needed
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

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
