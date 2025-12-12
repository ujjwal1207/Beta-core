import React, { useState } from 'react';
import { MOOD_LABELS, MOOD_COLORS, getMoodGradient } from '../../../config/theme';

const ProfileProgress = () => {
  const [mood, setMood] = useState(1);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-slate-100 w-full"> 
      <div className="flex flex-col"> 
        <h4 className="text-sm font-semibold text-slate-700 mb-2">
          How are you feeling today? <span className="font-bold" style={{color: MOOD_COLORS[mood]}}>{MOOD_LABELS[mood]}</span>
        </h4>
        <input 
          type="range" 
          min="0" 
          max="3" 
          step="1" 
          value={mood} 
          onChange={(e) => setMood(parseInt(e.target.value))} 
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-slider-fix" 
          style={{ background: getMoodGradient() }}
        />
      </div>
    </div>
  );
};

export default ProfileProgress;
