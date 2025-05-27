import React, { useState, useEffect } from "react";
import { uploadFile, getFiles, deleteFile } from "../services/api";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";

interface FileItem {
  fileId: string;
  originalName: string;
  s3Url: string;
  uploadedAt: string;
  mimeType: string;
  size: number;
}

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    if (!auth.currentUser) {
      setError("You must be logged in to upload files");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      await uploadFile(selectedFile);
      alert("File uploaded successfully!");
      await fetchFiles(); // Refresh file list
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const filesData = await getFiles();
      setFiles(filesData);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError("Failed to load files. Please try again.");
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      await deleteFile(fileId);
      alert("File deleted successfully!");
      await fetchFiles(); // Refresh file list
    } catch (err) {
      console.error("Error deleting file:", err);
      setError("Failed to delete file. Please try again.");
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out. Please try again.");
    }
  };

  return (
    <div className="container mt-4">
      {/* User Profile Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Welcome, {currentUser?.email || 'User'}</h2>
          <p className="text-muted mb-0">User ID: {currentUser?.uid.substring(0, 8)}...</p>
        </div>
        <Button 
          variant="outline-danger" 
          onClick={handleSignOut}
          className="d-flex align-items-center"
        >
          <i className="bi bi-box-arrow-right me-2"></i>
          Sign Out
        </Button>
      </div>

      <div className="card">
        <div className="card-body">
          <h1 className="card-title">Upload Files</h1>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <div className="mb-3">
            <input 
              id="file-upload"
              type="file" 
              className="form-control"
              onChange={handleFileChange} 
            />
          </div>
          
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
              </>
            ) : 'Upload'}
          </button>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-body">
          <h2 className="card-title">Your Files</h2>
          
          {files.length === 0 ? (
            <p className="text-muted">No files uploaded yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const fileExt = file.originalName.split('.').pop()?.toLowerCase() || '';
                    return (
                      <tr key={file.fileId}>
                        <td>
                          <a 
                            href={file.s3Url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-decoration-none"
                          >
                            {getIcon(fileExt)} {file.originalName}
                          </a>
                        </td>
                        <td className="text-muted">{file.mimeType}</td>
                        <td className="text-muted">{formatFileSize(file.size)}</td>
                        <td className="text-muted">
                          {new Date(file.uploadedAt).toLocaleString()}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(file.fileId)}
                            aria-label={`Delete ${file.originalName}`}
                          >
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
