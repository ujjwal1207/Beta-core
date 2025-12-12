import React from 'react';
import { Star } from 'lucide-react';

const StarBadge = ({ score, isSuper }) => {
  if (!isSuper) return null;
  
  return (
    <div className="absolute -top-3 -right-3 flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full shadow-lg border-2 border-white">
      <Star className="w-6 h-6 text-white fill-white" />
    </div>
  );
};

export default StarBadge;
