/**
 * Timestamp utility functions for frontend
 * Convert Unix timestamps to local timezone for display
 */

class TimestampUtils {
    /**
     * Convert Unix timestamp to Date object
     * @param {number} unixTimestamp - Unix timestamp in seconds
     * @returns {Date} - JavaScript Date object
     */
    static unixToDate(unixTimestamp) {
        return new Date(unixTimestamp * 1000); // Convert to milliseconds
    }

    /**
     * Format Unix timestamp as local date/time string
     * @param {number} unixTimestamp - Unix timestamp in seconds
     * @param {object} options - Intl.DateTimeFormat options
     * @returns {string} - Formatted date/time string
     */
    static formatLocal(unixTimestamp, options = {}) {
        const date = this.unixToDate(unixTimestamp);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleString(undefined, { ...defaultOptions, ...options });
    }

    /**
     * Format as relative time (e.g., "2 hours ago")
     * @param {number} unixTimestamp - Unix timestamp in seconds
     * @returns {string} - Relative time string
     */
    static timeAgo(unixTimestamp) {
        const now = Math.floor(Date.now() / 1000);
        const diffSeconds = now - unixTimestamp;

        if (diffSeconds < 60) return 'just now';
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} minute${Math.floor(diffSeconds / 60) !== 1 ? 's' : ''} ago`;
        if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hour${Math.floor(diffSeconds / 3600) !== 1 ? 's' : ''} ago`;
        if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)} day${Math.floor(diffSeconds / 86400) !== 1 ? 's' : ''} ago`;

        // For older dates, show actual date
        return this.unixToDate(unixTimestamp).toLocaleDateString();
    }

    /**
     * Check if timestamp is from today
     * @param {number} unixTimestamp - Unix timestamp in seconds
     * @returns {boolean} - True if today
     */
    static isToday(unixTimestamp) {
        const date = this.unixToDate(unixTimestamp);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    /**
     * Check if timestamp is from yesterday
     * @param {number} unixTimestamp - Unix timestamp in seconds
     * @returns {boolean} - True if yesterday
     */
    static isYesterday(unixTimestamp) {
        const date = this.unixToDate(unixTimestamp);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.toDateString() === yesterday.toDateString();
    }

    /**
     * Get current Unix timestamp
     * @returns {number} - Current Unix timestamp in seconds
     */
    static now() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Format for chat/message timestamps
     * @param {number} unixTimestamp - Unix timestamp in seconds
     * @returns {string} - Formatted string
     */
    static formatMessageTime(unixTimestamp) {
        if (this.isToday(unixTimestamp)) {
            return this.formatLocal(unixTimestamp, {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (this.isYesterday(unixTimestamp)) {
            return 'Yesterday ' + this.formatLocal(unixTimestamp, {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return this.formatLocal(unixTimestamp, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimestampUtils;
}