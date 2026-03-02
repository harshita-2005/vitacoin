import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import DifficultyIndicator from './DifficultyIndicator';

const MemoryGame = ({ onComplete, onPause, isPaused, timeLimit, difficulty = 'easy', onScoreUpdate }) => {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Use refs to track timer and prevent multiple timers
  const timerRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // Store callbacks in refs to prevent timer restarts when they change
  const onCompleteRef = useRef(onComplete);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  
  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onComplete, onScoreUpdate]);

  // Difficulty-based configuration
  const getDifficultyConfig = () => {
    switch (difficulty) {
      case 'easy':
        return {
          emojis: ['🐶', '🐱', '🐭', '🐹'],
          flipDelay: 1500,
          timeLimit: null
        };
      case 'medium':
        return {
          emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
          flipDelay: 1000,
          timeLimit: 120 // 2 minutes
        };
      case 'hard':
        return {
          emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
          flipDelay: 800,
          timeLimit: 120
        };
      default:
        return {
          emojis: ['🐶', '🐱', '🐭', '🐹'],
          flipDelay: 1500,
          timeLimit: null
        };
    }
  };

  const config = getDifficultyConfig();
  const totalPairs = config.emojis.length;

  // Initialize timer only once when game starts
  useEffect(() => {
    if (config.timeLimit && gameStarted && !isInitializedRef.current) {
      setTimeRemaining(config.timeLimit);
      isInitializedRef.current = true;
    }
  }, [gameStarted, config.timeLimit]);

  // Timer countdown - FIX: Use ref to prevent multiple timers and preserve state on pause/resume
  useEffect(() => {
    // Cleanup: stop timer if paused or game stopped
    if (isPaused || !gameStarted) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Only start if conditions are met and timer hasn't started
    if (config.timeLimit && timeRemaining !== null && timeRemaining > 0 && !timerRef.current) {
      // Start the timer with optimized interval
      timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Use functional updates to get current values
          setMoves(currentMoves => {
            setMatched(currentMatched => {
              const finalScore = Math.max(0, 100 - currentMoves * 5);
              // Use ref to avoid dependency issues
              if (onCompleteRef.current) {
                onCompleteRef.current({ 
                  score: finalScore, 
                  accuracy: Math.round((currentMatched.length / (totalPairs * 2)) * 100),
                  correctAnswers: currentMatched.length / 2
                });
              }
              return currentMatched;
            });
            return currentMoves;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    }

    // Cleanup on unmount
    return () => {
      // Only cleanup if actually paused/stopped, not on every render
      if (isPaused || !gameStarted) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted, isPaused, config.timeLimit, timeRemaining, totalPairs]); // Include timeRemaining to detect when it's set, but timerRef check prevents restart

  const initializeGame = useCallback(() => {
    const gameCards = [...config.emojis, ...config.emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
    setCards(gameCards);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setGameStarted(false);
    setTimeRemaining(config.timeLimit);
  }, [config.emojis, config.timeLimit]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  useEffect(() => {
    if (matched.length === totalPairs * 2) {
      const finalScore = Math.max(0, 100 - moves * 5);
      onComplete({ 
        score: finalScore, 
        accuracy: Math.round((matched.length / (totalPairs * 2)) * 100),
        correctAnswers: matched.length / 2
      });
    }
  }, [matched, moves, totalPairs, onComplete]);

  const handleCardClick = (cardId) => {
    if (isPaused) return;
    
    const card = cards.find(c => c.id === cardId);
    if (card.isFlipped || card.isMatched || flipped.length >= 2) return;

    if (!gameStarted) setGameStarted(true);

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        setMatched(prev => {
          const newMatched = [...prev, firstId, secondId];
          // Update score in real-time
          if (onScoreUpdateRef.current) {
            const currentScore = Math.max(0, 100 - moves * 5);
            const currentAccuracy = Math.round((newMatched.length / (totalPairs * 2)) * 100);
            onScoreUpdateRef.current(currentScore, currentAccuracy);
          }
          return newMatched;
        });
        setFlipped([]);
      } else {
        // No match - use difficulty-based delay
        setTimeout(() => {
          setFlipped([]);
        }, config.flipDelay);
      }
    }
  };

  const getCardDisplay = (card) => {
    if (card.isMatched || flipped.includes(card.id)) {
      return card.emoji;
    }
    return '❓';
  };

  return (
    <div className={`text-center ${isPaused ? 'opacity-50 pointer-events-none select-none' : ''}`}>
      <DifficultyIndicator difficulty={difficulty} />

      {/* Compact stats row (aligned with other games) */}
      <div className="mb-6">
        <div className="flex justify-center gap-10 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{moves}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Moves</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {matched.length / 2}/{totalPairs}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Matches</div>
          </div>
          {timeRemaining !== null && (
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  timeRemaining <= 30 ? 'text-red-600 animate-pulse' : 'text-orange-600'
                }`}
              >
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Time Left</div>
            </div>
          )}
        </div>
      </div>

      <motion.div
        key={moves + matched.length}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white via-slate-50 to-indigo-50 rounded-2xl shadow-xl p-6 max-w-md mx-auto border border-white/60"
      >
        <div className={`grid gap-4 max-w-md mx-auto grid-cols-4`}>
          {cards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ scale: isPaused ? 1 : 1.05 }}
              whileTap={{ scale: isPaused ? 1 : 0.95 }}
              className={`
                w-16 h-16 rounded-xl border-2 cursor-pointer flex items-center justify-center text-2xl font-bold transition-all duration-300
                ${card.isMatched || flipped.includes(card.id)
                  ? 'bg-white border-primary-300 shadow-md'
                  : 'bg-primary-100 border-primary-200 hover:bg-primary-200'
                }
                ${card.isMatched ? 'opacity-50' : ''}
              `}
              onClick={() => !isPaused && handleCardClick(card.id)}
            >
              {getCardDisplay(card)}
            </motion.div>
          ))}
        </div>

        <div className="mt-6">
          <button
            onClick={initializeGame}
            className="btn btn-secondary"
            disabled={isPaused}
          >
            Restart Game
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default MemoryGame;

