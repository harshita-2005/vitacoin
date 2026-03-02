import React from 'react';

/**
 * Visual Difficulty Indicator Component
 * Displays current difficulty level with color coding and reward info
 */
const DifficultyIndicator = ({ difficulty = 'easy' }) => {
  const difficultyConfig = {
    easy: {
      label: 'Easy',
      color: 'green',
      icon: '🟢',
      reward: '5 coins + 10 XP',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-green-700'
    },
    medium: {
      label: 'Medium',
      color: 'yellow',
      icon: '🟡',
      reward: '10 coins + 20 XP',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-700'
    },
    hard: {
      label: 'Hard',
      color: 'red',
      icon: '🔴',
      reward: '20 coins + 30 XP',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-700'
    }
  };

  const config = difficultyConfig[difficulty] || difficultyConfig.easy;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-3 mb-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <span className={`font-bold ${config.textColor}`}>
            Difficulty: {config.label}
          </span>
        </div>
        <div className={`text-sm ${config.textColor} font-semibold`}>
          Reward: {config.reward}
        </div>
      </div>
    </div>
  );
};

export default DifficultyIndicator;

