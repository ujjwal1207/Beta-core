import api from './api';

export const chatService = {
  /**
   * Get all conversations for the current user
   * @returns {Promise<Array>} List of conversations with other_user details
   */
  async getConversations() {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  /**
   * Get message history for a specific conversation
   * @param {number} conversationId - The conversation ID
   * @returns {Promise<Array>} List of messages
   */
  async getMessages(conversationId) {
    const response = await api.get(`/chat/${conversationId}/messages`);
    return response.data;
  },

  /**
   * Send a message to a user
   * @param {number} receiverId - The user to send message to
   * @param {string} content - The message content
   * @returns {Promise<Object>} The created message
   */
  async sendMessage(receiverId, content) {
    const response = await api.post('/chat/messages', {
      receiver_id: receiverId,
      content
    });
    return response.data;
  },

  /**
   * Get or create a private conversation with a specific user
   * @param {number} otherUserId - The other user's ID
   * @returns {Promise<Object>} Conversation details
   */
  async getPrivateConversation(otherUserId) {
    const response = await api.get(`/chat/private/${otherUserId}`);
    return response.data;
  }
};

export default chatService;
