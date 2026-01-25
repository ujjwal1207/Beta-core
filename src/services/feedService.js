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
   * @param {number} postData.mood_at_time - Mood at time of posting
   * @param {File} [postData.file] - Optional file to upload
   * @returns {Promise<Object>} Created post
   */
  createPost: async (postData) => {
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('content', postData.content);
      formData.append('type', postData.type);
      formData.append('mood_at_time', postData.mood_at_time);

      // Add file if present
      if (postData.file) {
        formData.append('file', postData.file);
      }

      // Use axios directly with FormData (no Content-Type header needed)
      const response = await api.post('/feed/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
   * Get user stories (reflections)
   * @returns {Promise<Array>} Array of story posts
   */
  getStories: async () => {
    try {
      const response = await api.get('/feed/', {
        params: {
          limit: 100
        }
      });
      // Filter for stories only
      return response.data.filter(post => post.type === 'story');
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

  /**
   * Get all posts by a specific user
   * @param {number} userId - User ID
   * @param {number} [limit=50] - Maximum posts to return
   * @returns {Promise<Array>} Array of user's posts
   */
  getUserPosts: async (userId, limit = 50) => {
    try {
      const response = await api.get(`/feed/user/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a post
   * @param {number} postId - Post ID to delete
   * @returns {Promise<Object>} Deletion result
   */
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/feed/${postId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a post
   * @param {number} postId - Post ID to update
   * @param {Object} postData - Updated post data
   * @param {string} [postData.content] - Updated content
   * @returns {Promise<Object>} Updated post
   */
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/feed/${postId}`, postData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get saved posts for the current user
   * @param {number} [limit=50] - Maximum posts to return
   * @returns {Promise<Array>} Array of saved posts
   */
  getSavedPosts: async (limit = 50) => {
    try {
      const response = await api.get('/feed/saved', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle save/bookmark on a post
   * @param {number} postId - Post ID to save/unsave
   * @returns {Promise<Object>} Save status { is_saved: boolean, message: string }
   */
  toggleSavePost: async (postId) => {
    try {
      const response = await api.post(`/feed/${postId}/save`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark a story as viewed
   * @param {number} storyId - Story ID to mark as viewed
   * @returns {Promise<Object>} View confirmation
   */
  markStoryViewed: async (storyId) => {
    try {
      const response = await api.post(`/feed/${storyId}/view`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all viewed story IDs for the current user
   * @returns {Promise<Array>} Array of viewed story IDs
   */
  getViewedStoryIds: async () => {
    try {
      const response = await api.get('/feed/stories/viewed');
      return response.data.viewed_story_ids;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get viewers of a story (only for story owner)
   * @param {number} storyId - Story ID
   * @returns {Promise<Object>} Viewers data { viewers: Array, total_views: number }
   */
  getStoryViewers: async (storyId) => {
    try {
      const response = await api.get(`/feed/${storyId}/viewers`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Repost a post to your own feed
   * @param {number} postId - Post ID to repost
   * @returns {Promise<Object>} Created repost with original post reference
   */
  repostPost: async (postId) => {
    try {
      const response = await api.post(`/feed/${postId}/repost`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a specific post by ID
   * @param {number} postId - Post ID to fetch
   * @returns {Promise<Object>} Post with user info
   */
  getPostById: async (postId) => {
    try {
      const response = await api.get(`/feed/${postId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default feedService;
