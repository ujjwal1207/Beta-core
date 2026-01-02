import React from 'react';
import { MOOD_LABELS, getMoodColor } from '../../config/theme';

const MoodDisplay = ({ moodIndex }) => {
  // Default to 1 (Just... okay) if mood is undefined/null
  const mood = moodIndex ?? 1;
  
  return (
    <span 
      className="inline-flex items-center px-2 py-0.5 ml-2 rounded-full text-xs font-bold" 
      style={{ backgroundColor: getMoodColor(mood), color: 'white' }}
    >
      {MOOD_LABELS[mood]}
    </span>
  );
};

export default MoodDisplay;
