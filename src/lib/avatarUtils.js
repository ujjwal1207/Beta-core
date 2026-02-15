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
  if (!user) return generateLocalAvatar('User', 150);
  
  // Use profile_photo if available
  if (user.profile_photo) {
    return user.profile_photo;
  }
  
  // Try UI Avatars first, but have local fallback
  const name = user.full_name || user.name || 'User';
  return generateAvatarWithFallback(name, 150);
};

/**
 * Get avatar URL with specific size
 * @param {Object} user - User object
 * @param {number} size - Desired size in pixels
 * @returns {string} Avatar URL
 */
export const getAvatarUrlWithSize = (user, size = 150) => {
  if (!user) return generateLocalAvatar('User', size);
  
  if (user.profile_photo) {
    return user.profile_photo;
  }
  
  // Try UI Avatars first, but have local fallback
  const name = user.full_name || user.name || 'User';
  return generateAvatarWithFallback(name, size);
};

/**
 * Generate avatar URL with fallback to local generation if external service fails
 * @param {string} name - User name
 * @param {number} size - Avatar size
 * @returns {string} Avatar URL
 */
const generateAvatarWithFallback = (name, size) => {
  // Try UI Avatars service first
  const encodedName = encodeURIComponent(name);
  const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodedName}&background=6366f1&color=fff&size=${size}&rounded=true&bold=true`;
  
  // Note: In a production app, you might want to test if the service is reachable
  // For now, we'll return the UI Avatars URL and let the browser handle failures
  return uiAvatarUrl;
};

/**
 * Generate a local avatar fallback using CSS/Canvas (for when external service fails)
 * @param {string} name - User name
 * @param {number} size - Avatar size
 * @returns {string} Data URL for avatar
 */
const generateLocalAvatar = (name, size) => {
  // Create a simple colored circle with initials using canvas
  if (typeof window === 'undefined') return ''; // SSR safety
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  
  // Background circle
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
  ctx.fill();
  
  // Text (initials)
  const initials = getUserInitials({ full_name: name });
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);
  
  return canvas.toDataURL();
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
