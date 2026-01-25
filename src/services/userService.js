import api from './api';

/**
 * User Service
 * Handles user profile operations
 */

const userService = {
  /**
   * Get current user's profile
   * @returns {Promise<Object>} User profile data
   */
  getProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update current user's profile
   * @param {Object} profileData - Profile update data
   * @returns {Promise<Object>} Updated user profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/users/me', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update user's mood
   * @param {number} mood - Mood value (0-3 scale)
   * @returns {Promise<Object>} Update response
   */
  updateMood: async (mood) => {
    try {
      const response = await api.patch(`/users/me/mood?mood=${mood}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Set user as online
   * @returns {Promise<Object>} Status update response
   */
  setOnline: async () => {
    try {
      const response = await api.post('/users/me/online');
      return response.data;
    } catch (error) {
      console.error('Failed to set online status:', error);
      throw error;
    }
  },

  /**
   * Set user as offline
   * @returns {Promise<Object>} Status update response
   */
  setOffline: async () => {
    try {
      const response = await api.post('/users/me/offline');
      return response.data;
    } catch (error) {
      console.error('Failed to set offline status:', error);
      throw error;
    }
  },

  /**
   * Get a user's online status
   * @param {number} userId - The user ID
   * @returns {Promise<Object>} Online status data
   */
  getUserOnlineStatus: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get user status:', error);
      throw error;
    }
  },

  /**
   * Upload profile photo to S3
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Updated user profile with new photo URL
   */
  uploadProfilePhoto: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/users/me/upload-profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to upload profile photo:', error);
      throw error;
    }
  },
};

export default userService;
