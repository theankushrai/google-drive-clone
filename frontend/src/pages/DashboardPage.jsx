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

  // Fetch user's files when component mounts
  useEffect(() => {
    const fetchUserFiles = async () => {
      try {
        setIsLoading(true);
        const files = await getUserFiles();
        setUploadedFiles(files);
        setFetchError("");
      } catch (error) {
        console.error('Failed to fetch files:', error);
        setFetchError("Failed to load your files. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) {
      fetchUserFiles();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

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
                    onClick={() => window.location.reload()}
                    className="mt-2"
                  >
                    Retry
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
