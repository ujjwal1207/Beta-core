// Check if a person is a Super ListenLinker
export const isSuperLinker = (person) => {
  return (person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0;
};

// Format date helper
export const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
};

// Format number of ratings in ranges (100+, 200+, etc.)
export const formatRatingCount = (count) => {
  if (count === 0) return '0';
  if (count < 100) return count.toString();
  
  // Round down to nearest 100 and add +
  const base = Math.floor(count / 100) * 100;
  return `${base}+`;
};
