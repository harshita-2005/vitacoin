import React from 'react';
import { getRewardBaseForDifficulty, formatRewardSummary } from '../../utils/gameRewardPreview';

/**
 * Visual Difficulty Indicator Component
 * Displays current difficulty level with color coding and reward info
 * @param {object|null} [game] - Optional game doc (same shape as API); matches server base rewards when set
 */
const DifficultyIndicator = ({ difficulty = 'easy', game = null }) => {
  const difficultyConfig = {
    easy: {
      label: 'Easy',
      color: 'green',
      icon: '🟢',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      textColor: 'text-green-700'
    },
    medium: {
      label: 'Medium',
      color: 'yellow',
      icon: '🟡',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      textColor: 'text-yellow-700'
    },
    hard: {
      label: 'Hard',
      color: 'red',
      icon: '🔴',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      textColor: 'text-red-700'
    }
  };

  const preset = difficultyConfig[difficulty] || difficultyConfig.easy;
  const base = getRewardBaseForDifficulty(difficulty, game);
  const config = {
    ...preset,
    reward: formatRewardSummary(base.coins, base.xp)
  };

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

