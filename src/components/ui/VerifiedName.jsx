import React from 'react';
import { BadgeCheck } from 'lucide-react';

const VerifiedName = ({
  name,
  isVerified = false,
  className = 'font-semibold text-slate-800',
  wrapperClassName = 'inline-flex items-center gap-1',
  badgeClassName = 'w-4 h-4 text-white fill-blue-500',
  fallback = 'Unknown User'
}) => {
  const displayName = typeof name === 'string' && name.trim() ? name.trim() : fallback;

  return (
    <span className={wrapperClassName}>
      <span className={className}>{displayName}</span>
      {isVerified && <BadgeCheck className={badgeClassName} aria-label="Verified user" />}
    </span>
  );
};

export default VerifiedName;