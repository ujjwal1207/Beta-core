import React from 'react';

const Button = ({ children, primary, onClick, disabled, skip, className = '', size, variant }) => {
  let sizeClasses = 'py-3 px-6';
  if (size === 'lg') sizeClasses = 'py-4 px-8';
  if (size === 'sm') sizeClasses = 'py-2 px-4';
  
  let variantClasses = primary 
    ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 disabled:opacity-50'
    : skip 
    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50'
    : 'bg-rose-500 text-white shadow-md hover:bg-rose-600 disabled:opacity-50';
  
  if (variant === 'light') variantClasses = 'bg-white text-indigo-600 shadow-md hover:bg-slate-50 disabled:opacity-50';
  
  return (
    <button
      className={`w-full ${sizeClasses} rounded-xl font-bold transition-all duration-200 text-center active:scale-[0.98] text-base ${variantClasses} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
export { Button };
