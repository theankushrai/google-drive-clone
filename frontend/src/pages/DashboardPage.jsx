// src/pages/DashboardPage.jsx
import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Alert,
  Table,
  Spinner,
  Button,
  Image,
  Modal,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import FileUpload from "../components/FileUpload";
import { getUserFiles, deleteFile, getFileDownloadUrl } from "../services/api";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileAudio,
  FaFileVideo,
  FaFileArchive,
  FaFileCode,
  FaFileAlt,
  FaFile,
  FaTrash,
  FaDownload,
} from "react-icons/fa";

// Map file extensions to icons
const getFileIcon = (filename) => {
  // Handle undefined, null, or non-string filenames
  if (!filename || typeof filename !== "string") {
    return <FaFile className="text-secondary" />; // Default file icon
  }

  try {
    const parts = filename.split(".");
    // If no extension or filename starts with a dot
    if (parts.length < 2) {
      return <FaFile className="text-secondary" />;
    }

    const extension = parts.pop().toLowerCase();

    // Image files
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp"];
    if (imageExtensions.includes(extension)) {
      return <FaFileImage className="text-primary" />;
    }

    // Document files
    const docExtensions = ["doc", "docx", "txt", "rtf", "odt"];
    if (docExtensions.includes(extension)) {
      return <FaFileWord className="text-primary" />;
    }

    // PDF files
    if (extension === "pdf") {
      return <FaFilePdf className="text-danger" />;
    }

    // Spreadsheet files
    const excelExtensions = ["xls", "xlsx", "csv", "ods"];
    if (excelExtensions.includes(extension)) {
      return <FaFileExcel className="text-success" />;
    }

    // Presentation files
    const pptExtensions = ["ppt", "pptx", "odp"];
    if (pptExtensions.includes(extension)) {
      return <FaFilePowerpoint className="text-warning" />;
    }

    // Archive files
    const archiveExtensions = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];
    if (archiveExtensions.includes(extension)) {
      return <FaFileArchive className="text-secondary" />;
    }

    // Code files
    const codeExtensions = [
      "js",
      "jsx",
      "ts",
      "tsx",
      "py",
      "java",
      "c",
      "cpp",
      "h",
      "hpp",
      "html",
      "htm",
      "css",
      "scss",
      "sass",
      "less",
      "json",
      "xml",
      "yaml",
      "yml",
      "sh",
      "bash",
      "php",
      "rb",
      "go",
      "rs",
      "swift",
      "kt",
      "dart",
    ];
    if (codeExtensions.includes(extension)) {
      return <FaFileCode className="text-info" />;
    }

    // Audio files
    const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];
    if (audioExtensions.includes(extension)) {
      return <FaFileAudio className="text-primary" />;
    }

    // Video files
    const videoExtensions = ["mp4", "webm", "mov", "avi", "mkv", "flv", "wmv"];
    if (videoExtensions.includes(extension)) {
      return <FaFileVideo className="text-primary" />;
    }
  } catch (error) {
    console.error("Error determining file icon:", error);
  }

  // Default file icon
  return <FaFileAlt className="text-secondary" />;
};

// Format file size to human-readable format
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Get file extension for display
const getFileType = (filename) => {
  if (!filename) return "FILE";
  try {
    const parts = filename.toString().split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
  } catch (error) {
    console.error("Error getting file type:", error);
    return "FILE";
  }
};

// Error Boundary component for file rows
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in FileRow:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <tr className="bg-warning bg-opacity-10">
          <td colSpan="5" className="text-center text-warning">
            Error displaying file. Please refresh the page.
          </td>
        </tr>
      );
    }

    return this.props.children;
  }
}

const FileRow = ({ file, isDarkMode, onDelete }) => {
  // Add null checks for the file object and its properties
  if (!file || typeof file !== "object") {
    console.error("Invalid file object in FileRow:", file);
    return null;
  }

  // Map backend properties to frontend expected properties
  const safeFile = {
    // Backend properties
    fileId: file.fileId || "unknown",
    fileName: file.fileName || "Unnamed File",
    fileType: file.fileType || '',
    fileSize: file.fileSize || 0,
    uploadDate: file.uploadDate || new Date().toISOString(),
    fileKey: file.fileKey || '',
    downloadUrl: file.downloadUrl || '',
    
    // Frontend expected properties (for backward compatibility)
    filename: file.fileName || file.filename || "Unnamed File",
    size: file.fileSize || file.size || 0,
    uploadedAt: file.uploadDate || file.uploadedAt || new Date().toISOString(),
  };
  
  // Debug log to help diagnose any remaining issues
  console.log('Rendering file:', safeFile);

  const fileIcon = getFileIcon(safeFile.filename);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDeleteClick = () => setShowDeleteModal(true);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const handleDownload = async () => {
    if (!safeFile.fileId) {
      console.error("Cannot download: fileId is missing");
      return;
    }

    try {
      setIsDownloading(true);
      const { url, filename } = await getFileDownloadUrl(safeFile.fileId);

      if (!url) {
        throw new Error("No download URL received");
      }

      const a = document.createElement("a");
      a.href = url;
      a.download = filename || safeFile.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      // Consider adding a toast/notification here
    } finally {
      setIsDownloading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!safeFile.fileId) {
      console.error("Cannot delete: fileId is missing");
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(safeFile.fileId);
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format the upload date with error handling
  const formatUploadDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return "N/A";
    }
  };

  return (
    <ErrorBoundary>
      <tr>
        <td
          className={`d-flex align-items-center ${
            isDarkMode ? "text-light" : "text-dark"
          }`}
        >
          <span className="me-2" style={{ fontSize: "1.2rem" }}>
            {fileIcon}
          </span>
          {safeFile.filename}
        </td>
        <td className={isDarkMode ? "text-light" : "text-dark"}>
          {formatFileSize(safeFile.size)}
        </td>
        <td className={isDarkMode ? "text-light" : "text-dark"}>
          {getFileType(safeFile.filename)}
        </td>
        <td className={isDarkMode ? "text-light" : "text-dark"}>
          {formatUploadDate(safeFile.uploadedAt)}
        </td>
        <td className="text-end">
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              title="Download file"
              className="d-flex align-items-center"
            >
              {isDownloading ? (
                <Spinner
                  as="span"
                  size="sm"
                  animation="border"
                  role="status"
                  aria-hidden="true"
                  className="me-1"
                />
              ) : (
                <FaDownload />
              )}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              title="Delete file"
              className="d-flex align-items-center"
            >
              {isDeleting ? (
                <Spinner
                  as="span"
                  size="sm"
                  animation="border"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                <FaTrash />
              )}
            </Button>
          </div>
        </td>
      </tr>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header
          closeButton
          className={
            isDarkMode
              ? "bg-dark text-light border-secondary"
              : "bg-white text-dark"
          }
        >
          <Modal.Title>Delete File</Modal.Title>
        </Modal.Header>
        <Modal.Body
          className={isDarkMode ? "bg-dark text-light" : "bg-white text-dark"}
        >
          Are you sure you want to delete <strong>{file.filename}</strong>? This
          action cannot be undone.
        </Modal.Body>
        <Modal.Footer
          className={isDarkMode ? "bg-dark border-secondary" : "bg-white"}
        >
          <Button
            variant="secondary"
            onClick={handleCloseDeleteModal}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </Modal.Footer>
      </Modal>
    </ErrorBoundary>
  );
};

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

  // Handle file deletion
  const handleDeleteFile = async (fileId) => {
    try {
      await deleteFile(fileId);
      // Remove the deleted file from the list
      setUploadedFiles((prevFiles) =>
        prevFiles.filter((file) => file.fileId !== fileId)
      );
      setShowDeleteSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowDeleteSuccess(false), 3000);
    } catch (error) {
      console.error("Error deleting file:", error);
      setFetchError("Failed to delete the file. Please try again.");
    }
  };

  // Fetch user's files with retry logic
  const fetchUserFiles = async (retryCount = 0) => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setFetchError("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const files = await getUserFiles();

      if (Array.isArray(files)) {
        setUploadedFiles(files);
        // Only clear error if we got a valid response
        setFetchError("");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error(
        "Failed to fetch files (attempt " + (retryCount + 1) + "):",
        error
      );

      // Only show error if we've tried a few times
      if (retryCount >= 2) {
        // After 3 attempts
        // If we have files from before, don't show an error
        if (uploadedFiles.length === 0) {
          setFetchError(
            "No files found. Upload your first file to get started."
          );
        }
      } else {
        // Retry after a delay
        setTimeout(() => fetchUserFiles(retryCount + 1), 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch when component mounts
  useEffect(() => {
    fetchUserFiles();
  }, [currentUser]);

  // Retry function for the retry button
  const handleRetry = () => {
    fetchUserFiles();
  };

  // Update file list when a new file is uploaded
  const handleUploadSuccess = (fileData) => {
    setUploadedFiles((prevFiles) => [fileData, ...prevFiles]);
    setUploadSuccess("File uploaded successfully!");
    setUploadError("");

    // Clear success message after 3 seconds
    setTimeout(() => setUploadSuccess(""), 3000);
  };

  const handleUploadError = (error) => {
    setUploadError(error);
    setUploadSuccess("");

    // Clear error message after 3 seconds
    setTimeout(() => setUploadError(""), 3000);
  };

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className={isDarkMode ? "text-light" : "text-dark"}>Dashboard</h2>
          <p
            className={isDarkMode ? "text-light" : "text-muted"}
            style={{ opacity: 0.8 }}
          >
            Welcome back, {currentUser?.email || "User"}!
          </p>
        </Col>
      </Row>

      {uploadSuccess && (
        <Row className="mb-3">
          <Col>
            <Alert
              variant="success"
              onClose={() => setUploadSuccess("")}
              dismissible
            >
              {uploadSuccess}
            </Alert>
          </Col>
        </Row>
      )}

      {uploadError && (
        <Row className="mb-3">
          <Col>
            <Alert
              variant="danger"
              onClose={() => setUploadError("")}
              dismissible
              transition
            >
              {uploadError}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <FileUpload
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        </Col>
      </Row>

      <Row>
        <Col>
          <Card
            className={isDarkMode ? "bg-dark text-light" : "bg-white text-dark"}
          >
            <Card.Header
              className={isDarkMode ? "bg-dark border-secondary" : "bg-light"}
            >
              <h5 className="mb-0">Your Files</h5>
            </Card.Header>
            <Card.Body className={isDarkMode ? "bg-dark" : "bg-white"}>
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner
                    animation="border"
                    variant={isDarkMode ? "light" : "primary"}
                  />
                  <p
                    className={`mt-2 ${
                      isDarkMode ? "text-light" : "text-muted"
                    }`}
                  >
                    Loading your files...
                  </p>
                </div>
              ) : fetchError ? (
                <div className="text-center py-3">
                  <p className="text-danger">{fetchError}</p>
                  <Button
                    variant="primary"
                    onClick={handleRetry}
                    className="mt-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Loading...
                      </>
                    ) : (
                      "Retry"
                    )}
                  </Button>
                </div>
              ) : uploadedFiles.length === 0 ? (
                <p
                  className={`text-center py-3 mb-0 ${
                    isDarkMode ? "text-light" : "text-muted"
                  }`}
                >
                  No files uploaded yet. Upload your first file above.
                </p>
              ) : (
                <div className="table-responsive">
                  <Table
                    hover
                    variant={isDarkMode ? "dark" : "light"}
                    className="mb-0"
                  >
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Uploaded</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedFiles.map((file, index) => (
                        <FileRow
                          key={file.fileId || index}
                          file={file}
                          isDarkMode={isDarkMode}
                          onDelete={handleDeleteFile}
                        />
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardPage;
