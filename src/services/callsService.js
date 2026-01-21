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
   * @param {number} bookingId - Optional booking ID for scheduled calls
   * @returns {Promise<Object>} Invitation data
   */
  async sendCallInvitation(receiverId, callType = 'video', bookingId = null) {
    try {
      const payload = { 
        receiver_id: receiverId,
        call_type: callType
      };
      if (bookingId) {
        payload.booking_id = bookingId;
      }
      const response = await api.post('/calls/invitations', payload);
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
  async updateInvitation(invitationId, status, callEndTime = null) {
    try {
      const payload = { status };
      if (callEndTime) payload.call_end_time = callEndTime;
      const response = await api.put(`/calls/invitations/${invitationId}`, payload);
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

  // ===== CALL BOOKING FUNCTIONS =====

  /**
   * Create a new call booking request
   * @param {number} hostId - The user ID to book a call with
   * @param {Date} scheduledAt - When the call should happen
   * @param {string} callType - 'video' or 'voice' (default: 'video')
   * @param {string} note - Optional note for the booking
   * @param {number} price - Price for the call (default: 0)
   * @returns {Promise<Object>} Booking data
   */
  async createCallBooking(hostId, scheduledAt, callType = 'video', note = null, price = 0) {
    try {
      const response = await api.post('/calls/bookings', {
        host_id: hostId,
        scheduled_at: Math.floor(scheduledAt.getTime() / 1000), // Convert to Unix timestamp
        call_type: callType,
        note: note,
        price: price
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create call booking:', error);
      throw error;
    }
  },

  /**
   * Get pending call booking requests for the current user (as host)
   * @returns {Promise<Array>} List of pending booking requests
   */
  async getCallBookingRequests() {
    try {
      const response = await api.get('/calls/bookings/requests');
      return response.data;
    } catch (error) {
      console.error('Failed to get call booking requests:', error);
      throw error;
    }
  },

  /**
   * Accept a call booking request
   * @param {number} bookingId - The booking ID to accept
   * @returns {Promise<Object>} Success message
   */
  async acceptCallBooking(bookingId) {
    try {
      const response = await api.post(`/calls/bookings/${bookingId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Failed to accept call booking:', error);
      throw error;
    }
  },

  /**
   * Decline a call booking request
   * @param {number} bookingId - The booking ID to decline
   * @returns {Promise<Object>} Success message
   */
  async declineCallBooking(bookingId) {
    try {
      const response = await api.post(`/calls/bookings/${bookingId}/decline`);
      return response.data;
    } catch (error) {
      console.error('Failed to decline call booking:', error);
      throw error;
    }
  },

  /**
   * Update a call booking (reschedule)
   * @param {number} bookingId - The booking ID to update
   * @param {Object} updateData - The data to update (scheduled_at, call_type, note)
   * @returns {Promise<Object>} Updated booking data
   */
  async updateCallBooking(bookingId, updateData) {
    try {
      const response = await api.put(`/calls/bookings/${bookingId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update call booking:', error);
      throw error;
    }
  },

  /**
   * Create a reschedule request
   * @param {Object} requestData - The reschedule request data
   * @returns {Promise<Object>} Created reschedule request
   */
  async createRescheduleRequest(requestData) {
    try {
      const response = await api.post('/calls/reschedule-requests', requestData);
      return response.data;
    } catch (error) {
      console.error('Failed to create reschedule request:', error);
      throw error;
    }
  },

  /**
   * Get pending reschedule requests for the current user
   * @returns {Promise<Array>} List of pending reschedule requests
   */
  async getPendingRescheduleRequests() {
    try {
      const response = await api.get('/calls/reschedule-requests/pending');
      return response.data;
    } catch (error) {
      console.error('Failed to get pending reschedule requests:', error);
      throw error;
    }
  },

  /**
   * Accept a reschedule request
   * @param {number} requestId - The reschedule request ID
   * @returns {Promise<Object>} Success message
   */
  async acceptRescheduleRequest(requestId) {
    try {
      const response = await api.post(`/calls/reschedule-requests/${requestId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Failed to accept reschedule request:', error);
      throw error;
    }
  },

  /**
   * Reject a reschedule request
   * @param {number} requestId - The reschedule request ID
   * @returns {Promise<Object>} Success message
   */
  async rejectRescheduleRequest(requestId) {
    try {
      const response = await api.post(`/calls/reschedule-requests/${requestId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Failed to reject reschedule request:', error);
      throw error;
    }
  },

  /**
   * Get scheduled/accepted call bookings for the current user
   * @returns {Promise<Array>} List of scheduled bookings
   */
  async getScheduledCalls() {
    try {
      const response = await api.get('/calls/bookings/scheduled');
      return response.data;
    } catch (error) {
      console.error('Failed to get scheduled calls:', error);
      throw error;
    }
  },

  /**
   * Delete a call booking (only if pending or rejected)
   * @param {number} bookingId - The booking ID to delete
   * @returns {Promise<Object>} Success message
   */
  async deleteCallBooking(bookingId) {
    try {
      const response = await api.delete(`/calls/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete call booking:', error);
      throw error;
    }
  },

  /**
   * Check for scheduled calls that are starting soon (within 5 minutes)
   * @returns {Promise<Array>} List of calls starting soon
   */
  async getUpcomingScheduledCalls() {
    try {
      const response = await api.get('/calls/bookings/upcoming');
      return response.data;
    } catch (error) {
      console.error('Failed to get upcoming scheduled calls:', error);
      throw error;
    }
  },
};

export default callsService;
