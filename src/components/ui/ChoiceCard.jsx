import React from 'react';

const ChoiceCard = ({ children, isSelected, onClick }) => (
  <button
    className={`flex items-center p-4 mb-3 text-left rounded-xl transition-all duration-200 w-full border ${
      isSelected 
        ? 'bg-white border-indigo-500 shadow-lg ring-4 ring-indigo-100' 
        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

export default ChoiceCard;
