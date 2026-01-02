// Theme configuration and color utilities

export const MOOD_LABELS = ['Calm', 'Happy', 'Anxious', 'Overwhelmed'];
export const MOOD_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#f43f5e']; // Green, Blue, Amber, Rose

export const getMoodColor = (moodIndex) => MOOD_COLORS[moodIndex] || MOOD_COLORS[1];

export const getMoodGradient = () => 
  `linear-gradient(to right, ${MOOD_COLORS.map((c, i) => `${c} ${(i / (MOOD_COLORS.length - 1)) * 100}%`).join(', ')})`;
