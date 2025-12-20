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
   * Search for users by name, role, or industry
   * @param {string} query - Search query
   * @param {number} [limit=20] - Maximum results to return
   * @returns {Promise<Array>} Array of matching users
   */
  search: async (query, limit = 20) => {
    try {
      const response = await api.get('/connections/search', {
        params: { q: query, limit }
      });
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
};

export default connectionsService;
