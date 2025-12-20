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
};

export default engagementService;
