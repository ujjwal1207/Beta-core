import api from './api';

/**
 * Connections Service
 * Handles connection requests, discovery, and search
 */

const connectionsService = {
  /**
   * Get users for swipe/discovery mode
   * Filtered by Vibe Match based on current mood
   * @param {number} [limit=20] - Maximum users to return
   * @returns {Promise<Array>} Array of discovery profiles
   */
  discover: async (limit = 20) => {
    try {
      const response = await api.get('/connections/discover', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Search for users by name, role, or industry with optional filters
   * @param {string} query - Search query
   * @param {number} [limit=20] - Maximum results to return
   * @param {Object} [filters={}] - Optional filters (role, company, school, expertise, location, industry)
   * @returns {Promise<Array>} Array of matching users
   */
  search: async (query, limit = 20, filters = {}) => {
    try {
      const params = { q: query, limit };
      
      // Add filters if provided
      if (filters.role) params.role = filters.role;
      if (filters.company) params.company = filters.company;
      if (filters.school) params.school = filters.school;
      if (filters.expertise) params.expertise = filters.expertise;
      if (filters.location) params.location = filters.location;
      if (filters.industry) params.industry = filters.industry;
      
      const response = await api.get('/connections/search', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get list of Super ListenLinkers for booking calls
   * @param {number} [limit=20] - Maximum users to return
   * @returns {Promise<Array>} Array of super linkers
   */
  getSuperLinkers: async (limit = 20) => {
    try {
      const response = await api.get('/connections/super-linkers', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get alumni who attended the same schools as current user
   * @param {number} [limit=50] - Maximum users to return
   * @returns {Promise<Array>} Array of alumni
   */
  getAlumni: async (limit = 50) => {
    try {
      const response = await api.get('/connections/alumni', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Send a connection request (swipe right)
   * @param {number} receiverId - ID of user to connect with
   * @returns {Promise<Object>} Connection response
   */
  sendRequest: async (receiverId) => {
    try {
      const response = await api.post('/connections/request', {
        receiver_id: receiverId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get incoming connection requests
   * @returns {Promise<Array>} Array of pending requests
   */
  getReceivedRequests: async () => {
    try {
      const response = await api.get('/connections/requests/received');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Respond to a connection request (accept/reject)
   * @param {number} connectionId - Connection ID
   * @param {string} status - 'accepted' or 'rejected'
   * @returns {Promise<Object>} Updated connection
   */
  respondToRequest: async (connectionId, status) => {
    try {
      const response = await api.patch(`/connections/${connectionId}`, {
        status
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get sent connection requests (pending)
   * @returns {Promise<Array>} Array of pending requests you sent
   */
  getSentRequests: async () => {
    try {
      const response = await api.get('/connections/requests/sent');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get accepted connections (your network)
   * @returns {Promise<Array>} Array of your connections
   */
  getMyConnections: async () => {
    try {
      const response = await api.get('/connections/accepted');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Remove a connection
   * @param {number} connectionId - Connection ID to remove
   * @returns {Promise<Object>} Response
   */
  removeConnection: async (connectionId) => {
    try {
      const response = await api.delete(`/connections/${connectionId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Block a user
   * @param {number} userId - User ID to block
   * @returns {Promise<Object>} Response
   */
  blockUser: async (userId) => {
    try {
      const response = await api.post('/connections/block', {
        blocked_user_id: userId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get blocked users
   * @returns {Promise<Array>} Array of blocked users
   */
  getBlockedUsers: async () => {
    try {
      const response = await api.get('/connections/blocked');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Unblock a user
   * @param {number} userId - User ID to unblock
   * @returns {Promise<Object>} Response
   */
  unblockUser: async (userId) => {
    try {
      const response = await api.delete(`/connections/block/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default connectionsService;
