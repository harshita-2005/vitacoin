import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import DifficultyIndicator from './DifficultyIndicator';

const ReactionTime = ({ onComplete, onPause, isPaused, timeLimit, difficulty = 'easy' }) => {
  const [gameState, setGameState] = useState('waiting'); // waiting, ready, clicked, fake
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState([]);
  const [score, setScore] = useState(0);

  // Difficulty-based configuration
  const getDifficultyConfig = () => {
    switch (difficulty) {
      case 'easy':
        return {
          minDelay: 2000, // 2-4 seconds
          maxDelay: 4000,
          totalRounds: 5,
          fakeFlashes: false // No fake flashes for easy
        };
      case 'medium':
        return {
          minDelay: 1000, // 1-3 seconds (faster)
          maxDelay: 3000,
          totalRounds: 7,
          fakeFlashes: false
        };
      case 'hard':
        return {
          minDelay: 500, // 0.5-2 seconds (very fast)
          maxDelay: 2000,
          totalRounds: 10,
          fakeFlashes: true // Fake flashes to trick player
        };
      default:
        return {
          minDelay: 2000,
          maxDelay: 4000,
          totalRounds: 5,
          fakeFlashes: false
        };
    }
  };

  const config = getDifficultyConfig();

  const startRound = useCallback(() => {
    setGameState('waiting');
    setReactionTime(null);
    
    // For hard mode, sometimes show fake flash
    if (config.fakeFlashes && Math.random() < 0.3) {
      const fakeDelay = Math.random() * 1000 + 500; // Quick fake flash
      setTimeout(() => {
        if (!isPaused) {
          setGameState('fake');
          // Return to waiting after fake flash
          setTimeout(() => {
            setGameState('waiting');
            // Then show real flash
            const realDelay = Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;
            setTimeout(() => {
              if (!isPaused) {
                setGameState('ready');
                setStartTime(Date.now());
              }
            }, realDelay);
          }, 200);
        }
      }, fakeDelay);
    } else {
      // Normal delay
      const delay = Math.random() * (config.maxDelay - config.minDelay) + config.minDelay;
      setTimeout(() => {
        if (!isPaused) {
          setGameState('ready');
          setStartTime(Date.now());
        }
      }, delay);
    }
  }, [config, isPaused]);

  useEffect(() => {
    if (round < config.totalRounds) {
      startRound();
    } else {
      const avgTime = times.length > 0 
        ? times.reduce((a, b) => a + b, 0) / times.length 
        : 0;
      const finalScore = Math.max(0, 100 - Math.floor(avgTime / 10));
      onComplete({ score: finalScore, accuracy: Math.round(Math.max(0, 100 - avgTime / 10)) });
    }
  }, [round, config.totalRounds, startRound, times, onComplete]);

  const handleClick = () => {
    if (gameState === 'ready') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setTimes(prev => [...prev, time]);
      setScore(prev => prev + Math.max(0, 20 - Math.floor(time / 10)));
      setGameState('clicked');
      
      setTimeout(() => {
        setRound(prev => prev + 1);
      }, 1000);
    } else if (gameState === 'waiting' || gameState === 'fake') {
      // Clicked too early (or on fake flash)
      setScore(prev => Math.max(0, prev - 10));
      setGameState('clicked');
      
      setTimeout(() => {
        setRound(prev => prev + 1);
      }, 1000);
    }
  };

  return (
    <div className={`text-center ${isPaused ? 'opacity-50 pointer-events-none select-none' : ''}`}>
      <DifficultyIndicator difficulty={difficulty} />

      {/* Compact stats row */}
      <div className="mb-6">
        <div className="flex justify-center gap-10 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{score}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">
              {round}/{config.totalRounds}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Rounds</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {reactionTime ? `${reactionTime}ms` : '-'}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Last Time</div>
          </div>
        </div>
      </div>

      <motion.div
        key={round}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white via-slate-50 to-indigo-50 rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-white/60"
      >
        <div className="text-center">
          {gameState === 'waiting' && (
            <div className="text-gray-600">
              <div className="text-2xl mb-4">⏳</div>
              <div className="text-lg">Wait for the color to change...</div>
              {difficulty === 'hard' && (
                <div className="text-sm text-orange-600 mt-2">
                  ⚠️ Watch out for fake flashes!
                </div>
              )}
            </div>
          )}
          
          {gameState === 'fake' && (
            <div className="text-red-600">
              <div className="text-2xl mb-4">❌</div>
              <div className="text-lg">Fake flash! Don't click!</div>
            </div>
          )}
          
          {gameState === 'ready' && (
            <div className="text-green-600">
              <div className="text-2xl mb-4">⚡</div>
              <div className="text-lg">Click now!</div>
            </div>
          )}
          
          {gameState === 'clicked' && (
            <div className="text-blue-600">
              <div className="text-2xl mb-4">🎯</div>
              <div className="text-lg">
                {reactionTime ? `Reaction time: ${reactionTime}ms` : 'Too early!'}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => !isPaused && handleClick()}
          className={`
            w-32 h-32 rounded-full mx-auto mt-6 transition-all duration-200 font-bold text-white
            ${gameState === 'ready' 
              ? 'bg-green-500 hover:bg-green-600 shadow-lg scale-110' 
              : gameState === 'fake'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-gray-300 hover:bg-gray-400'
            }
          `}
        >
          {gameState === 'ready' ? 'CLICK!' : 'Wait...'}
        </button>
      </motion.div>
    </div>
  );
};

export default ReactionTime;
