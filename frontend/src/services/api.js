import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Added /api to match backend routes

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

export default api;
