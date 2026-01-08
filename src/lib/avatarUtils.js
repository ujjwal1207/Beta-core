/**
 * Utility functions for handling user avatars
 */

/**
 * Get the appropriate avatar URL for a user
 * Falls back to UI Avatars with empathy-oriented styling if no profile photo is available
 * @param {Object} user - User object with optional profile_photo field
 * @returns {string} Avatar URL
 */
export const getAvatarUrl = (user) => {
  if (!user) return `https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=150&rounded=true&bold=true`;
  
  // Use profile_photo if available
  if (user.profile_photo) {
    return user.profile_photo;
  }
  
  // Fallback to UI Avatars with user's initials and warm, empathetic colors
  const name = encodeURIComponent(user.full_name || user.name || 'User');
  return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&size=150&rounded=true&bold=true`;
};

/**
 * Get avatar URL with specific size
 * @param {Object} user - User object
 * @param {number} size - Desired size in pixels
 * @returns {string} Avatar URL
 */
export const getAvatarUrlWithSize = (user, size = 150) => {
  if (!user) return `https://ui-avatars.com/api/?name=User&background=6366f1&color=fff&size=${size}&rounded=true&bold=true`;
  
  if (user.profile_photo) {
    return user.profile_photo;
  }
  
  // Fallback to UI Avatars with user's initials and warm, empathetic colors
  const name = encodeURIComponent(user.full_name || user.name || 'User');
  return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&size=${size}&rounded=true&bold=true`;
};

/**
 * Get user initials for fallback display
 * @param {Object} user - User object with full_name
 * @returns {string} User initials (e.g., "JS" for "John Smith")
 */
export const getUserInitials = (user) => {
  if (!user || !user.full_name) return '?';
  
  const names = user.full_name.trim().split(' ');
  if (names.length === 1) {
    return names[0][0].toUpperCase();
  }
  
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

/**
 * Get a consistent color for a user based on their ID
 * @param {number} userId - User ID
 * @returns {string} Hex color code
 */
export const getAvatarColor = (userId) => {
  const colors = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#06b6d4', // Cyan
  ];
  
  return colors[userId % colors.length];
};
