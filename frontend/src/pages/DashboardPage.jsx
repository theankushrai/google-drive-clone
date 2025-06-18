// src/pages/DashboardPage.jsx
import React, { useState, useContext } from "react";
import { Container, Row, Col, Card, Alert, Table } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import FileUpload from "../components/FileUpload";

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useContext(ThemeContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

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
          <h2 className={isDarkMode ? 'text-light' : 'text-dark'}>Dashboard</h2>
          <p className={isDarkMode ? 'text-light' : 'text-muted'} style={{ opacity: 0.8 }}>
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
          <Card className={isDarkMode ? 'bg-dark text-light' : 'bg-white text-dark'}>
            <Card.Header className={isDarkMode ? 'bg-dark border-secondary' : 'bg-light'}>
              <h5 className="mb-0">Your Files</h5>
            </Card.Header>
            <Card.Body className={isDarkMode ? 'bg-dark' : 'bg-white'}>
              {uploadedFiles.length === 0 ? (
                <p className={`text-center py-3 mb-0 ${isDarkMode ? 'text-light' : 'text-muted'}`}>
                  No files uploaded yet. Upload your first file above.
                </p>
              ) : (
                <div className="table-responsive">
                  <Table hover variant={isDarkMode ? 'dark' : 'light'} className="mb-0">
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
                        <tr key={index}>
                          <td className={isDarkMode ? 'text-light' : 'text-dark'}>{file.fileName}</td>
                          <td className={isDarkMode ? 'text-light' : 'text-dark'}>{(file.size / 1024).toFixed(2)} KB</td>
                          <td className={isDarkMode ? 'text-light' : 'text-dark'}>{file.fileType}</td>
                          <td className={isDarkMode ? 'text-light' : 'text-dark'}>{new Date(file.uploadedAt).toLocaleString()}</td>
                        </tr>
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
