import api from './api';

/**
 * Notification Service
 * Handles fetching and managing user notifications (likes, comments, etc.)
 */

const notificationService = {
    /**
     * Get all notifications for the current user
     * @param {number} limit - Max notifications to fetch
     * @param {number} skip - Number to skip (pagination)
     * @returns {Promise<Array>} Array of notification objects
     */
    getNotifications: async (limit = 50, skip = 0) => {
        try {
            const response = await api.get(`/notifications?limit=${limit}&skip=${skip}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Mark a single notification as read
     * @param {number} notificationId - ID of the notification
     * @returns {Promise<Object>} Success message
     */
    markAsRead: async (notificationId) => {
        try {
            const response = await api.post(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Mark all notifications as read
     * @returns {Promise<Object>} Success message with count
     */
    markAllAsRead: async () => {
        try {
            const response = await api.post('/notifications/read-all');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get count of unread notifications
     * @returns {Promise<Object>} Object with count property
     */
    getUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default notificationService;
