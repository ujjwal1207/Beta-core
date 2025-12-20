import api from './api';

/**
 * Feed Service
 * Handles posts and feed operations with Vibe Engine support
 */

const feedService = {
  /**
   * Create a new post or story
   * @param {Object} postData - Post data
   * @param {string} postData.content - Post content
   * @param {string} postData.type - Post type ('moment' or 'reflection')
   * @param {string} [postData.image_url] - Optional image URL
   * @param {string} [postData.video_url] - Optional video URL
   * @returns {Promise<Object>} Created post
   */
  createPost: async (postData) => {
    try {
      const response = await api.post('/feed/', postData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get personalized feed with Vibe Engine filtering
   * @param {Object} options - Feed options
   * @param {number} [options.limit=20] - Maximum posts to return
   * @param {number} [options.skip=0] - Posts to skip (pagination)
   * @param {boolean} [options.useVibe=true] - Enable mood-based filtering
   * @returns {Promise<Array>} Array of posts with user info
   */
  getFeed: async ({ limit = 20, skip = 0, useVibe = true } = {}) => {
    try {
      const response = await api.get('/feed/feed', {
        params: { limit, skip, use_vibe: useVibe }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all posts without mood filtering
   * @param {number} [limit=100] - Maximum posts to return
   * @returns {Promise<Array>} Array of all posts
   */
  getAllPosts: async (limit = 100) => {
    try {
      const response = await api.get('/feed/', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default feedService;
