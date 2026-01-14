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
   * Upload a file and send a message with the attachment
   * @param {number} receiverId - The user to send message to
   * @param {string} content - The message content (caption)
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} The created message
   */
  async sendMessageWithFile(receiverId, content, file) {
    // First, upload the file
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadResponse = await api.post('/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const { attachment_url, attachment_type } = uploadResponse.data;
    
    // Then, send the message with attachment info
    const response = await api.post('/chat/messages', {
      receiver_id: receiverId,
      content: content || '', // Empty content is allowed if there's an attachment
      attachment_url,
      attachment_type
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
  },

  /**
   * Toggle pin status for a conversation
   * @param {number} conversationId - The conversation ID
   * @returns {Promise<Object>} Updated pin status
   */
  async togglePinConversation(conversationId) {
    const response = await api.post(`/chat/${conversationId}/pin`);
    return response.data;
  }
};

export default chatService;
