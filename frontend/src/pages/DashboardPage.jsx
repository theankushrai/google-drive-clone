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
  Modal
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
  FaTrash,
  FaDownload,
} from 'react-icons/fa';

// Map file extensions to icons
const getFileIcon = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  
  // Image files
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  if (imageExtensions.includes(extension)) {
    return <FaFileImage className="text-primary" />;
  }
  
  // Document files
  const docExtensions = ['doc', 'docx'];
  if (docExtensions.includes(extension)) {
    return <FaFileWord className="text-primary" />;
  }
  
  // PDF files
  if (extension === 'pdf') {
    return <FaFilePdf className="text-danger" />;
  }
  
  // Spreadsheet files
  const excelExtensions = ['xls', 'xlsx', 'csv'];
  if (excelExtensions.includes(extension)) {
    return <FaFileExcel className="text-success" />;
  }
  
  // Presentation files
  const pptExtensions = ['ppt', 'pptx'];
  if (pptExtensions.includes(extension)) {
    return <FaFilePowerpoint className="text-warning" />;
  }
  
  // Archive files
  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
  if (archiveExtensions.includes(extension)) {
    return <FaFileArchive className="text-secondary" />;
  }
  
  // Code files
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'html', 'css', 'scss', 'json'];
  if (codeExtensions.includes(extension)) {
    return <FaFileCode className="text-info" />;
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
  return filename.split(".").pop().toUpperCase();
};

const FileRow = ({ file, isDarkMode, onDelete }) => {
  const fileIcon = getFileIcon(file.filename);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDeleteClick = () => setShowDeleteModal(true);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      // Get a fresh pre-signed URL for the file
      const { url, filename } = await getFileDownloadUrl(file.fileId);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      // You might want to show an error toast/notification here
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(file.fileId);
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <>
      <tr>
        <td className={`d-flex align-items-center ${isDarkMode ? 'text-light' : 'text-dark'}`}>
          <span className="me-2" style={{ fontSize: '1.2rem' }}>
            {fileIcon}
          </span>
          {file.filename}
        </td>
        <td className={isDarkMode ? "text-light" : "text-dark"}>
          {formatFileSize(file.size)}
        </td>
        <td className={isDarkMode ? "text-light" : "text-dark"}>
          {getFileType(file.filename).toUpperCase()}
        </td>
        <td className={isDarkMode ? "text-light" : "text-dark"}>
          {new Date(file.uploadedAt).toLocaleString()}
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
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
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
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : (
                <FaTrash />
              )}
            </Button>
          </div>
        </td>
      </tr>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton className={isDarkMode ? 'bg-dark text-light border-secondary' : 'bg-white text-dark'}>
          <Modal.Title>Delete File</Modal.Title>
        </Modal.Header>
        <Modal.Body className={isDarkMode ? 'bg-dark text-light' : 'bg-white text-dark'}>
          Are you sure you want to delete <strong>{file.filename}</strong>? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer className={isDarkMode ? 'bg-dark border-secondary' : 'bg-white'}>
          <Button variant="secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
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
      setUploadedFiles(prevFiles => prevFiles.filter(file => file.fileId !== fileId));
      setShowDeleteSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowDeleteSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting file:', error);
      setFetchError('Failed to delete the file. Please try again.');
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
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const files = await getUserFiles();
      
      if (Array.isArray(files)) {
        setUploadedFiles(files);
        // Only clear error if we got a valid response
        setFetchError("");
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error('Failed to fetch files (attempt ' + (retryCount + 1) + '):', error);
      
      // Only show error if we've tried a few times
      if (retryCount >= 2) { // After 3 attempts
        // If we have files from before, don't show an error
        if (uploadedFiles.length === 0) {
          setFetchError("No files found. Upload your first file to get started.");
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
                  <Spinner animation="border" variant={isDarkMode ? 'light' : 'primary'} />
                  <p className={`mt-2 ${isDarkMode ? 'text-light' : 'text-muted'}`}>Loading your files...</p>
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
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                      </>
                    ) : 'Retry'}
                  </Button>
                </div>
              ) : uploadedFiles.length === 0 ? (
                <p className={`text-center py-3 mb-0 ${isDarkMode ? 'text-light' : 'text-muted'}`}>
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
