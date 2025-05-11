import express, { Request, Response } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import cors from "cors";

// Load .env variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    methods: ["GET", "POST"],
    credentials: true, // Optional: if you plan to send cookies/auth tokens
  })
);

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Multer for handling file uploads
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  (async () => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    const fileStream = fs.createReadStream(req.file.path);
    const key = uuidv4() + "-" + req.file.originalname;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: fileStream,
      ContentType: req.file.mimetype,
    };

    try {
      const data = await s3.upload(params).promise();
      fs.unlinkSync(req.file.path); // clean up local file
      res.json({ message: "File uploaded!", fileUrl: data.Location });
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to upload to S3.");
    }
  })();
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
