import React, { useState, useEffect } from "react";
import axios from "axios";

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      const response = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setFileUrl(response.data.fileUrl);
      alert("Upload successful!");
      fetchFiles(); // Refresh list
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/files");
      setFiles(res.data.files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/delete/${fileId}`
      );
      alert("File deleted successfully!");
      fetchFiles(); // Refresh list
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file.");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const getIcon = (ext: string) => {
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "🖼️";
    if (ext === "pdf") return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    if (["ppt", "pptx"].includes(ext)) return "📽️";
    if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
    if (["mp4", "avi", "mkv"].includes(ext)) return "🎥";
    if (["mp3", "wav", "aac"].includes(ext)) return "🎵";
    return "📁";
  };

  return (
    <div className="container mt-5">
      <h1>Upload Files</h1>
      <input type="file" onChange={handleFileChange} />
      <button
        className="btn btn-primary mt-3"
        onClick={handleUpload}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {fileUrl && (
        <div className="mt-3">
          <p>Last uploaded file:</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {fileUrl}
          </a>
        </div>
      )}

      <div className="mt-5">
        <h2>Uploaded Files</h2>
        <ul>
          {files.map((file) => {
            const ext = file.originalName.split(".").pop().toLowerCase();
            return (
              <li key={file.fileId}>
                <span style={{ marginRight: "8px" }}>{getIcon(ext)}</span>
                <a href={file.s3Url} target="_blank" rel="noopener noreferrer">
                  {file.originalName}
                </a>{" "}
                ({Math.round(file.size / 1024)} KB)
                <button
                  className="btn btn-danger ml-3"
                  onClick={() => handleDelete(file.fileId)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;
