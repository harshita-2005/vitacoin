import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiLock, FiUnlock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const LevelSelector = ({ gameSlug, onLevelSelect, selectedLevel }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState({});

  // Tailwind-safe color styles (prevents dynamic class issues)
  const levelStyles = {
    easy: {
      border: 'border-green-500',
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: 'text-green-600',
      badge: 'bg-green-500'
    },
    medium: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      icon: 'text-yellow-600',
      badge: 'bg-yellow-500'
    },
    hard: {
      border: 'border-red-500',
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: 'text-red-600',
      badge: 'bg-red-500'
    }
  };

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/game/progress/${gameSlug}`);
      if (response.data.success) {
        setProgress(response.data.progress);
        setAttempts(response.data.attempts);
      }
    } catch (error) {
      console.error('Error fetching game progress:', error);
    } finally {
      setLoading(false);
    }
  }, [gameSlug]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const levels = [
    {
      key: 'easy',
      label: 'Easy',
      coins: 5,
      xp: 10,
      minScore: 30,
      color: 'green',
      description: 'Perfect for beginners',
      attempts: 'Unlimited'
    },
    {
      key: 'medium',
      label: 'Medium',
      coins: 10,
      xp: 20,
      minScore: 50,
      color: 'yellow',
      description: 'Moderate challenge',
      attempts: '5 per day'
    },
    {
      key: 'hard',
      label: 'Hard',
      coins: 20,
      xp: 30,
      minScore: 70,
      color: 'red',
      description: 'Expert level',
      attempts: '2 per day'
    }
  ];

  const isLevelUnlocked = (levelKey) => {
    if (!progress) return levelKey === 'easy';
    
    // Easy is always unlocked
    if (levelKey === 'easy') return true;
    
    // Get scores per difficulty (fallback to 0 if not present)
    const scores = progress.scores || {};
    const easyScore = scores.easy || 0;
    const mediumScore = scores.medium || 0;
    
    // Medium unlocked if Easy completed with 60%+ score
    if (levelKey === 'medium') {
      return easyScore >= 60;
    }
    
    // Hard unlocked if Medium completed with 50%+ score
    if (levelKey === 'hard') {
      return mediumScore >= 50;
    }
    
    return false;
  };

  const getRemainingAttempts = (levelKey) => {
    const attemptData = attempts[levelKey] || { remaining: -1, used: 0, limit: -1 };
    return attemptData.remaining;
  };

  const canPlayLevel = (levelKey) => {
    if (!isLevelUnlocked(levelKey)) return false;
    const remaining = getRemainingAttempts(levelKey);
    return remaining === -1 || remaining > 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Select Difficulty Level</h3>
        <p className="text-sm text-gray-600">
          Complete levels to unlock higher difficulties and earn more rewards!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {levels.map((level, index) => {
          const unlocked = isLevelUnlocked(level.key);
          const canPlay = canPlayLevel(level.key);
          const remaining = getRemainingAttempts(level.key);
          const isSelected = selectedLevel === level.key;
          const styles = levelStyles[level.key];

          return (
            <motion.div
              key={level.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={unlocked && canPlay ? { y: -6, scale: 1.04 } : {}}
              whileTap={canPlay && unlocked ? { scale: 0.97 } : {}}
              transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
              className={`relative rounded-xl p-6 border-2 transition-all ${
                isSelected
                  ? `${styles.border} ${styles.bg} scale-[1.05] shadow-lg`
                  : unlocked
                  ? `${styles.border} ${styles.bg} hover:shadow-md`
                  : 'border-gray-200 bg-gray-100 opacity-60'
              } ${canPlay && unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              title={
                !unlocked
                  ? level.key === 'medium'
                    ? 'Complete Easy level with 60%+ score to unlock Medium'
                    : 'Complete Medium level with 50%+ score to unlock Hard'
                  : !canPlay
                  ? 'No attempts remaining. Try again tomorrow!'
                  : `Select ${level.label} difficulty`
              }
              onClick={() => {
                if (canPlay && unlocked) {
                  onLevelSelect(level.key);
                }
              }}
            >
              {/* Lock/Unlock Icon */}
              <div className="absolute top-4 right-4">
                {unlocked ? (
                  <FiUnlock className={`w-5 h-5 ${styles.icon}`} />
                ) : (
                  <FiLock className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className={`absolute top-4 left-4 ${styles.badge} text-white rounded-full p-1`}>
                  <FiCheck className="w-4 h-4" />
                </div>
              )}

              {/* Level Info */}
              <div className="text-center">
                <h4 className={`text-lg font-bold ${styles.text} mb-2`}>
                  {level.label}
                </h4>
                <p className="text-xs text-gray-600 mb-4">{level.description}</p>

                {/* Rewards */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {level.coins} coins
                    </span>
                    <span className="text-xs text-gray-500">+</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {level.xp} XP
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {level.attempts}
                  </div>
                  <div className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Min: {level.minScore}% score
                  </div>
                </div>

                {/* Attempt Status */}
                {unlocked && (
                  <div className="mt-4">
                    {remaining === -1 ? (
                      <div className="text-xs text-green-600 font-semibold">
                        Unlimited attempts
                      </div>
                    ) : remaining > 0 ? (
                      <div className="text-xs text-yellow-600 font-semibold">
                        {remaining} attempt{remaining !== 1 ? 's' : ''} remaining
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-xs text-red-600 font-semibold">
                        <FiAlertCircle className="w-4 h-4" />
                        No attempts left
                      </div>
                    )}
                  </div>
                )}

                {/* Locked Message with Tooltip */}
                {!unlocked && (
                  <div 
                    className="mt-4 text-xs text-gray-500"
                    title={level.key === 'medium' 
                      ? 'Complete Easy level with 60%+ score to unlock Medium'
                      : 'Complete Medium level with 50%+ score to unlock Hard'
                    }
                  >
                    {level.key === 'medium'
                      ? 'Complete Easy to unlock'
                      : 'Complete Medium to unlock'}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Info */}
      {progress && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-700">Best Score (Overall):</span>
            <span className="font-bold text-primary-600">{progress.bestScore || 0}%</span>
          </div>
          {progress.scores && (
            <div className="grid grid-cols-3 gap-2 text-xs mt-3 pt-3 border-t border-blue-200">
              <div className="text-center">
                <div className="text-gray-600">Easy</div>
                <div className="font-bold text-green-600">{progress.scores.easy || 0}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Medium</div>
                <div className="font-bold text-yellow-600">{progress.scores.medium || 0}%</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600">Hard</div>
                <div className="font-bold text-red-600">{progress.scores.hard || 0}%</div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm mt-3 pt-3 border-t border-blue-200">
            <span className="text-gray-700">Times Played:</span>
            <span className="font-bold text-primary-600">{progress.timesPlayed || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelSelector;

