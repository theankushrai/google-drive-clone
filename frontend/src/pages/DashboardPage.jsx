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
  Button 
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import FileUpload from "../components/FileUpload";
import { getUserFiles } from "../services/api";

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

const FileRow = ({ file, isDarkMode }) => (
  <tr>
    <td className={isDarkMode ? "text-light" : "text-dark"}>{file.filename}</td>
    <td className={isDarkMode ? "text-light" : "text-dark"}>
      {formatFileSize(file.size)}
    </td>
    <td className={isDarkMode ? "text-light" : "text-dark"}>
      {getFileType(file.filename)}
    </td>
    <td className={isDarkMode ? "text-light" : "text-dark"}>
      {new Date(file.uploadedAt).toLocaleString()}
    </td>
  </tr>
);

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [fetchError, setFetchError] = useState("");

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
                        <th>File Name</th>
                        <th>Size</th>
                        <th>Type</th>
                        <th>Uploaded At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploadedFiles.map((file, index) => (
                        <FileRow
                          key={index}
                          file={file}
                          isDarkMode={isDarkMode}
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
