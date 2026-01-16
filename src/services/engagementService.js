import api from './api';

/**
 * Engagement Service
 * Handles likes and comments on posts
 */

const engagementService = {
  /**
   * Toggle like on a post
   * @param {number} postId - ID of the post to like/unlike
   * @returns {Promise<Object>} Like response with new counts
   */
  toggleLike: async (postId) => {
    try {
      const response = await api.post(`/feed/${postId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Add a comment to a post
   * @param {number} postId - ID of the post to comment on
   * @param {string} content - Comment content
   * @returns {Promise<Object>} Created comment with user info
   */
  addComment: async (postId, content) => {
    try {
      const response = await api.post(`/feed/${postId}/comment`, { content });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all comments for a post
   * @param {number} postId - ID of the post
   * @returns {Promise<Array>} Array of comments with user info
   */
  getComments: async (postId) => {
    try {
      const response = await api.get(`/feed/${postId}/comments`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a comment
   * @param {number} postId - ID of the post
   * @param {number} commentId - ID of the comment to update
   * @param {string} content - New comment content
   * @returns {Promise<Object>} Updated comment with user info
   */
  updateComment: async (postId, commentId, content) => {
    try {
      const response = await api.put(`/feed/${postId}/comment/${commentId}`, { content });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a comment
   * @param {number} postId - ID of the post
   * @param {number} commentId - ID of the comment to delete
   * @returns {Promise<Object>} Success message
   */
  deleteComment: async (postId, commentId) => {
    try {
      const response = await api.delete(`/feed/${postId}/comment/${commentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default engagementService;
