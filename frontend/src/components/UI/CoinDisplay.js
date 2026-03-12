import React from 'react';
import { FiDollarSign } from 'react-icons/fi';

const CoinDisplay = ({ balance = 0, size = 'md', showIcon = true, animate = true, premium = false }) => {
  const formatBalance = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

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

  const containerClasses = {
    xs: 'px-2 py-1',
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5',
    xl: 'px-6 py-3',
    '2xl': 'px-8 py-4'
  };

  const CoinContent = () => {
    if (premium) {
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-white font-semibold shadow-sm ${sizeClasses[size]}`} style={{ backgroundColor: '#C8A96A' }}>
          {showIcon && <FiDollarSign className={iconSizes[size]} />}
          <span>{formatBalance(balance)}</span>
          <span className="opacity-90">coins</span>
        </div>
      );
    }
    return (
      <div className={`coin-display ${containerClasses[size]}`}>
        {showIcon && (
          <FiDollarSign className={`coin-icon ${iconSizes[size]} mr-1`} />
        )}
        <span className={`coin-amount ${sizeClasses[size]}`}>
          {formatBalance(balance)}
        </span>
        <span className={`text-slate-500 font-medium ${sizeClasses[size]}`}>
          {' '}coins
        </span>
      </div>
    );
  };

  return <CoinContent />;
};

export default CoinDisplay;
