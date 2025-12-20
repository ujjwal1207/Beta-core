import api from './api';

/**
 * Authentication Service
 * Handles user authentication with cookie-based sessions
 */

const authService = {
  /**
   * Sign up a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.email - User email
   * @param {string} userData.password - User password
   * @param {string} userData.full_name - User full name
   * @returns {Promise<Object>} User data
   */
  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      // Store token in localStorage for iPhone/Safari compatibility
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Login response with user data
   */
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      // Store token in localStorage for iPhone/Safari compatibility
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Logout user (clears authentication cookie and localStorage)
   * @returns {Promise<Object>} Logout response
   */
  logout: async () => {
    try {
      // Clear localStorage token
      localStorage.removeItem('access_token');
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get current authenticated user
   * Uses the /users/me endpoint
   * @returns {Promise<Object>} Current user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default authService;
