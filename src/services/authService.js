import api from './api';

/**
 * Authentication Service
 * Handles user authentication with cookie-based sessions
 */

const authService = {
  /**
   * Sign up a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data
   */
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Step 1 of OTP signup: request email verification code.
   * @param {{ email, password, full_name }} userData
   */
  requestSignupOtp: async (userData) => {
    const response = await api.post('/auth/request-signup-otp', userData);
    return response.data;
  },

  /**
   * Step 2 of OTP signup: verify code and create account.
   * @param {{ email, otp_code, password, full_name }} data
   */
  verifySignupOtp: async (data) => {
    const response = await api.post('/auth/verify-signup-otp', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Login response with user data
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },

  /**
   * Step 1 of forgot password: send OTP to email.
   * @param {string} email
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Step 2 of forgot password: verify OTP and set new password.
   * @param {{ email, otp_code, new_password }} data
   */
  resetPassword: async (data) => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  /**
   * Logout user (clears authentication cookie and localStorage)
   */
  logout: async () => {
    localStorage.removeItem('access_token');
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Get Google OAuth login URL
   */
  getGoogleLoginUrl: async () => {
    const response = await api.get('/auth/google/login');
    return response.data;
  },
};

export default authService;
