import api from './api';

/**
 * Calls Service - Manages Agora video/voice calling
 */
const callsService = {
  /**
   * Get Agora RTC token for joining a call channel
   * @param {string} channelName - The channel to join (e.g., call_user1_user2)
   * @returns {Promise<Object>} Token data with app_id, token, channel_name, uid
   */
  async getAgoraToken(channelName) {
    try {
      const response = await api.get(`/calls/token/${channelName}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Agora token:', error);
      throw error;
    }
  },

  /**
   * Send a call invitation to a user
   * @param {number} receiverId - The user ID to call
   * @param {string} callType - 'video' or 'voice' (default: 'video')
   * @returns {Promise<Object>} Invitation data
   */
  async sendCallInvitation(receiverId, callType = 'video') {
    try {
      const response = await api.post('/calls/invitations', { 
        receiver_id: receiverId,
        call_type: callType
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send call invitation:', error);
      throw error;
    }
  },

  /**
   * Get pending call invitations for the current user
   * @returns {Promise<Array>} List of pending invitations
   */
  async getPendingInvitations() {
    try {
      const response = await api.get('/calls/invitations/pending');
      return response.data;
    } catch (error) {
      console.error('Failed to get pending invitations:', error);
      throw error;
    }
  },

  /**
   * Accept, reject, or cancel a call invitation
   * @param {number} invitationId - The invitation ID
   * @param {string} status - "accepted", "rejected", or "cancelled"
   * @returns {Promise<Object>} Updated invitation data
   */
  async updateInvitation(invitationId, status) {
    try {
      const response = await api.put(`/calls/invitations/${invitationId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Failed to update invitation:', error);
      throw error;
    }
  },

  /**
   * Get a specific call invitation by ID (for checking status)
   * @param {number} invitationId - The invitation ID
   * @returns {Promise<Object>} Invitation data with current status
   */
  async getInvitation(invitationId) {
    try {
      const response = await api.get(`/calls/invitations/${invitationId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get invitation:', error);
      throw error;
    }
  },

  /**
   * Get call history for the current user
   * @returns {Promise<Array>} List of past call invitations
   */
  async getCallHistory() {
    try {
      const response = await api.get('/calls/history');
      return response.data;
    } catch (error) {
      console.error('Failed to get call history:', error);
      throw error;
    }
  },

  /**
   * Delete a call log
   * @param {number} invitationId - The call log ID
   */
  async deleteCallLog(invitationId) {
    try {
      await api.delete(`/calls/invitations/${invitationId}`);
    } catch (error) {
      console.error('Failed to delete call log:', error);
      throw error;
    }
  },

  /**
   * Generate a unique channel name for a call between two users
   * @param {number} userId1 - First user ID
   * @param {number} userId2 - Second user ID
   * @returns {string} Channel name
   */
  generateChannelName(userId1, userId2) {
    // Sort IDs to ensure consistent channel names regardless of who initiates
    const sortedIds = [userId1, userId2].sort((a, b) => a - b);
    return `call_${sortedIds[0]}_${sortedIds[1]}`;
  },
};

export default callsService;
