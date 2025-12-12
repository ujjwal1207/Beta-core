import React from 'react';
import { MOOD_LABELS, getMoodColor } from '../../config/theme';

const MoodDisplay = ({ moodIndex }) => (
  <span 
    className="inline-flex items-center px-2 py-0.5 ml-2 rounded-full text-xs font-bold" 
    style={{ backgroundColor: getMoodColor(moodIndex), color: 'white' }}
  >
    {MOOD_LABELS[moodIndex]}
  </span>
);

export default MoodDisplay;
