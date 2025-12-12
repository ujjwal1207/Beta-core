import React from 'react';
import { X } from 'lucide-react';

const StoryViewerModal = ({ person, onClose }) => {
  if (!person) return null;

  // Use a relevant piece of text for the story
  const storyText = person.sharerInsights?.youngerSelf || person.bio || "Welcome to my story!";

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex justify-center items-center p-2" 
      onClick={onClose}
    >
      <div 
        className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-2xl w-full max-w-md h-full sm:h-[90vh] sm:max-h-[700px] overflow-hidden flex flex-col p-4" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simulated Progress Bar */}
        <div className="absolute top-2 left-2 right-2 h-1 bg-white/30 rounded-full">
          <div className="h-1 bg-white rounded-full w-1/3"></div>
        </div>
        
        {/* Header */}
        <div className="flex items-center pt-4 z-10">
          <img 
            src={person.image.replace('/400/500','/100/100')} 
            alt={person.name} 
            className="w-10 h-10 rounded-full border-2 border-white" 
          />
          <span className="ml-3 text-sm font-bold text-white">{person.name}</span>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 ml-auto">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow flex flex-col justify-center items-center text-center p-6">
          <p className="text-2xl font-bold text-white leading-tight shadow-text">
            "{storyText}"
          </p>
        </div>

        {/* Footer */}
        <div className="w-full p-2 z-10">
          <input 
            type="text" 
            placeholder="Send a message..." 
            className="w-full p-3 bg-white/20 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white" 
          />
        </div>
      </div>
    </div>
  );
};

export default StoryViewerModal;
