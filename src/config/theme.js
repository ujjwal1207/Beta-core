// Theme configuration and color utilities

export const MOOD_LABELS = ['Overwhelmed', 'Just... okay', 'Feeling Good', 'Great!'];
export const MOOD_COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6']; // Rose, Amber, Green, Blue

export const getMoodColor = (moodIndex) => MOOD_COLORS[moodIndex] || MOOD_COLORS[1];

export const getMoodGradient = () => 
  `linear-gradient(to right, ${MOOD_COLORS.map((c, i) => `${c} ${(i / (MOOD_COLORS.length - 1)) * 100}%`).join(', ')})`;
