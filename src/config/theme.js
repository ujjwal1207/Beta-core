// Theme configuration and color utilities

export const ACCENT_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#f43f5e'];

export const getAccentColor = (index) => ACCENT_COLORS[index] || ACCENT_COLORS[1];

export const getAccentGradient = () =>
  `linear-gradient(to right, ${ACCENT_COLORS.map((c, i) => `${c} ${(i / (ACCENT_COLORS.length - 1)) * 100}%`).join(', ')})`;
