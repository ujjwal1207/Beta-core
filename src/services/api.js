import axios from 'axios';

// API Base URL - adjust this based on your environment
const API_BASE_URL = import.meta.env.VITE_API_URL;
if (!API_BASE_URL) {
  throw new Error('VITE_API_URL environment variable is required');
}

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for cookie-based authentication
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok browser warning
  },
});

// Request interceptor - Add Authorization header from localStorage
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (for iPhone/Safari compatibility)
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      let errorMessage = 'An error occurred';
      
      // Extract error message from various formats
      if (typeof data?.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data?.detail)) {
        // FastAPI validation errors come as array of objects
        errorMessage = data.detail.map(err => err.msg || err.message).join(', ');
      } else if (data?.message) {
        errorMessage = data.message;
      }
      
      switch (status) {
        case 401:
          // Log 401 errors for debugging
          console.warn('Authentication error (401):', errorMessage);
          // Check if this is a critical auth failure that should redirect to login
          if (error.config?.url?.includes('/users/me') && !error.config?.url?.includes('retry')) {
            // If the main user profile fetch fails, it might indicate session expiry
            // Let the auth context handle this appropriately
            console.warn('User session may have expired - check authentication');
          }
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('university verification required')) {
            window.dispatchEvent(new CustomEvent('verificationRequired', {
              detail: {
                message: errorMessage,
                path: error.config?.url || ''
              }
            }));
          }
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 422:
          console.error('Validation error:', errorMessage);
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API error:', errorMessage);
      }
      
      // Return error with detail message
      return Promise.reject({
        status,
        message: errorMessage,
        data
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('Network error - no response from server');
      return Promise.reject({
        message: 'Network error - please check your connection',
      });
    } else {
      // Error in request setup
      console.error('Request error:', error.message);
      return Promise.reject({
        message: error.message,
      });
    }
  }
);

export default api;
