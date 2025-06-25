import axios from 'axios';

// API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Skip adding auth header for OPTIONS requests (CORS preflight)
    if (config.method === 'options') {
      return config;
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);

      // Handle specific error statuses
      if (error.response.status === 401) {
        // Handle unauthorized (token expired, etc.)
        console.error('Authentication error:', error.response.data);
      } else if (error.response.status === 403) {
        // Handle forbidden
        console.error('Forbidden:', error.response.data);
      } else if (error.response.status === 404) {
        // Handle not found
        console.error('Not found:', error.response.data);
      } else if (error.response.status >= 500) {
        // Handle server errors
        console.error('Server error:', error.response.data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
    }

    // Return a rejected promise with the error
    return Promise.reject(error);
  }
);

/**
 * Upload a file to the server
 * @param {File} file - The file to upload
 * @param {Function} onUploadProgress - Callback for upload progress
 * @returns {Promise} - The upload response
 */
export const uploadFile = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        // Don't override the Authorization header here, let the interceptor handle it
      },
      onUploadProgress,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get a pre-signed URL for file upload
 * @param {string} fileName - The name of the file
 * @param {string} fileType - The MIME type of the file
 * @returns {Promise} - The pre-signed URL response
 */
export const getPresignedUrl = async (fileName, fileType) => {
  try {
    const response = await api.post('/files/presigned-url', {
      fileName,
      fileType,
    });
    return response.data;
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    throw error;
  }
};

/**
 * Get all files for the current user
 * @returns {Promise<Array>} - Array of file objects
 */
export const getUserFiles = async () => {
  try {
    const response = await api.get('/files');
    // The backend returns the files array directly, not in a 'files' property
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching user files:', error);
    throw error;
  }
};

/**
 * Delete a file
 * @param {string} fileId - The ID of the file to delete
 * @returns {Promise<Object>} - The delete response
 */
/**
 * Get a pre-signed URL for downloading a file
 * @param {string} fileId - The ID of the file to download
 * @returns {Promise<Object>} - The download URL and file info
 */
export const getFileDownloadUrl = async (fileId) => {
  try {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

/**
 * Delete a file
 * @param {string} fileId - The ID of the file to delete
 * @returns {Promise<Object>} - The delete response
 */
export const deleteFile = async (fileId) => {
  try {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export default api;
