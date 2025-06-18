import React, { useCallback, useState, useContext } from "react";
import { Button, ProgressBar, Alert, Card } from "react-bootstrap";
import { Upload, FileEarmarkArrowUp } from "react-bootstrap-icons";
import { uploadFile } from "../services/api";
import { ThemeContext } from "../contexts/ThemeContext";

// Define the FileUpload component
const FileUpload = ({ onUploadSuccess, onUploadError }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Set up the event handler for when the user drags a file over the component
  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault(); // Prevent the default browser behavior (e.g. opening the file in a new tab)
      e.stopPropagation(); // Prevent the event from bubbling up to parent elements
      if (!isDragging) setIsDragging(true); // Set the isDragging state variable to true if it was false
    },
    [isDragging] // This dependency array ensures that the useCallback hook will only re-run the function if the isDragging state variable changes
  );

  // Set up the event handler for when the user stops dragging a file over the component
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // Set the isDragging state variable to false
  }, []);

  // Set up the event handler for when the user drops a file on the component
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false); // Set the isDragging state variable to false

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files); // Call the handleFiles function with the dropped file(s)
    }
  }, []);

  // Set up the event handler for when the user selects a file using the file input
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files); // Call the handleFiles function with the selected file(s)
    }
  };

  // Programmatically trigger the file input click
  const handleButtonClick = () => {
    document.getElementById("file-upload").click();
  };

  // Set up the function to handle the file upload
  const handleFiles = async (files) => {
    const file = files[0]; // For now, handle single file upload
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      };

      const response = await uploadFile(file, onUploadProgress);
      onUploadSuccess?.(response);
    } catch (err) {
      console.error("Upload failed:", err);
      const errorMessage = err.response?.data?.message || "Failed to upload file";
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Render the FileUpload component
  return (
    <Card className="mb-4">
      <Card.Body>
        <div
          className={`text-center p-5 border-2 border-dashed rounded-3 ${
            isDragging 
              ? isDarkMode ? 'bg-dark bg-opacity-75' : 'bg-light'
              : isDarkMode ? 'bg-dark' : 'bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging 
              ? '2px dashed var(--bs-primary)' 
              : `2px dashed ${isDarkMode ? '#495057' : '#dee2e6'}`,
            cursor: 'default',
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <div className="mb-3">
            <FileEarmarkArrowUp 
              size={48} 
              className={isDarkMode ? 'text-light' : 'text-muted'}
            />
          </div>
          <h5 className={isDarkMode ? 'text-light' : 'text-dark'}>
            Drag & drop files here
          </h5>
          <p className={isDarkMode ? 'text-light' : 'text-muted'} style={{ opacity: 0.7 }}>
            or
          </p>
          <Button
            variant={isDarkMode ? 'outline-light' : 'primary'}
            disabled={isUploading}
            onClick={handleButtonClick}
            className="mt-2"
            type="button"
            style={{ cursor: 'pointer' }}
          >
            <Upload className="me-2" />
            Select File
          </Button>
          <input
            id="file-upload"
            type="file"
            className="d-none"
            onChange={handleFileSelect}
            disabled={isUploading}
          />

          {isUploading && (
            <div className="mt-3">
              <ProgressBar
                now={uploadProgress}
                label={`${uploadProgress}%`}
                className="mb-2"
                animated
              />
              <small className="text-muted">
                Uploading... {uploadProgress}%
              </small>
            </div>
          )}


        </div>
      </Card.Body>
    </Card>
  );
};

export default FileUpload;
