import React from 'react';
import { FiZap } from 'react-icons/fi';

/** Compact XP total — matches CoinDisplay “premium” pill style, indigo accent. */
const XpDisplay = ({ points = 0, size = 'md', showIcon = true, premium = true }) => {
  const format = (value) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

  const sizeClasses = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
    '2xl': 'text-3xl'
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
    '2xl': 'w-8 h-8'
  };

  if (premium) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-white font-semibold shadow-sm ${sizeClasses[size]}`}
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}
        title="Total experience points"
      >
        {showIcon && <FiZap className={`${iconSizes[size]} shrink-0 opacity-95`} aria-hidden />}
        <span>{format(points)}</span>
        <span className="opacity-90">XP</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 text-indigo-600 font-semibold ${sizeClasses[size]}`}>
      {showIcon && <FiZap className={iconSizes[size]} />}
      <span>{format(points)} XP</span>
    </div>
  );
};

export default XpDisplay;
