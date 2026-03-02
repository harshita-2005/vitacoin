import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlay, FiPause, FiRotateCcw, FiClock, FiTarget, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import MemoryGame from './MemoryGame';
import MathQuiz from './MathQuiz';
import WordScramble from './WordScramble';
import ReactionTime from './ReactionTime';
import PuzzleSolver from './PuzzleSolver';

const GamePlayer = ({ game, challenge, onComplete, onClose, difficulty = 'easy' }) => {
  // Determine mode: challenge = competitive, no challenge = practice
  const mode = challenge ? 'challenge' : 'practice';
  
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, completed
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [gameResult, setGameResult] = useState(null); // Store complete game result
  const [gameTimer, setGameTimer] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [gameResetKey, setGameResetKey] = useState(0); // Key to force game reset
  
  // Challenge timer state
  const [challengeTimeElapsed, setChallengeTimeElapsed] = useState(0);
  const [challengeTimer, setChallengeTimer] = useState(null);
  const [showChallengeTimer, setShowChallengeTimer] = useState(false);
  const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);
  const [challengeTimeLimit, setChallengeTimeLimit] = useState(0);

  useEffect(() => {
    return () => {
      if (gameTimer) clearInterval(gameTimer);
      if (challengeTimer) clearInterval(challengeTimer);
    };
  }, [gameTimer, challengeTimer]);

  const startChallengeTimer = useCallback(() => {
    if (!challenge) return;
    
    const timeLimit = challenge.requirements?.timeLimit || 300;
    setChallengeTimeLimit(timeLimit);
    setShowChallengeTimer(true);
    
    const timer = setInterval(() => {
      setChallengeTimeElapsed(prev => prev + 1);
    }, 1000);
    setChallengeTimer(timer);
  }, [challenge]);

  const handleSubmitScore = useCallback(() => {
    // Use gameResult if available (most accurate), otherwise use state values
    const result = {
      score: gameResult?.score ?? score,
      time,
      accuracy: gameResult?.accuracy ?? accuracy,
      correctAnswers: gameResult?.correctAnswers ?? correctAnswers, // Use gameResult first
      challengeTimeElapsed: challenge ? challengeTimeElapsed : null
    };
    
    onComplete(result);
  }, [score, time, accuracy, correctAnswers, gameResult, challenge, challengeTimeElapsed, onComplete]);

  const handleTimeUp = useCallback(() => {
    // Stop all timers
    if (gameTimer) clearInterval(gameTimer);
    if (challengeTimer) clearInterval(challengeTimer);
    
    setGameState('completed');
    setShowTimeUpPopup(true);
    // Score submission will be triggered when user clicks "Continue"
  }, [gameTimer, challengeTimer]);

  // Start challenge timer when challenge is active
  useEffect(() => {
    if (challenge && gameState === 'playing') {
      startChallengeTimer();
    }
  }, [challenge, gameState, startChallengeTimer]);

  // Check for time up
  useEffect(() => {
    if (challenge && challengeTimeElapsed >= challengeTimeLimit && challengeTimeLimit > 0) {
      handleTimeUp();
    }
  }, [challenge, challengeTimeElapsed, challengeTimeLimit, handleTimeUp]);

  const startGame = async () => {
    try {
      // Consume an attempt as soon as the user starts/restarts the game
      const payload = {
        game: game.slug || game._id,
        difficulty
      };
      const response = await axios.post('/api/game/start', payload);
      
      if (!response.data.success) {
        const msg = response.data.error || response.data.errors?.[0] || 'Unable to start game';
        toast.error(msg);
        return;
      }
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.errors?.[0] ||
        'Unable to start game. Please try again.';
      toast.error(msg);
      return;
    }

    // Increment reset key to force game component to reset
    setGameResetKey(prev => prev + 1);
    
    setGameState('playing');
    setScore(0);
    setTime(0);
    setAccuracy(0);
    setCorrectAnswers(0);
    setGameResult(null); // Reset game result
    setStartTime(Date.now());
    
    // Reset challenge timer
    setChallengeTimeElapsed(0);
    setShowTimeUpPopup(false);
    
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    setGameTimer(timer);
  };

  const pauseGame = () => {
    // In challenge mode, pause = end challenge (no resume allowed)
    if (mode === 'challenge') {
      // Auto-submit current progress
      handleSubmitScore();
      return;
    }
    
    // Practice mode: pause normally
    setGameState('paused');
    
    // Stop timers
    if (gameTimer) {
      clearInterval(gameTimer);
      setGameTimer(null);
    }
    if (challengeTimer) {
      clearInterval(challengeTimer);
      setChallengeTimer(null);
    }
  };

  const resumeGame = () => {
    // Resume only allowed in practice mode
    if (mode === 'challenge') {
      return; // Should never reach here, but safety check
    }
    
    setGameState('playing');
    
    // Resume game timer from where it left off (FIX: Don't reset)
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
    }, 1000);
    setGameTimer(timer);
    
    // Resume challenge timer if it was running (preserve elapsed time)
    if (challenge) {
      const challengeTimer = setInterval(() => {
        setChallengeTimeElapsed(prev => prev + 1);
      }, 1000);
      setChallengeTimer(challengeTimer);
    }
  };

  const endGame = (finalScore, finalAccuracy) => {
    if (gameTimer) clearInterval(gameTimer);
    if (challengeTimer) clearInterval(challengeTimer);
    
    setGameState('completed');
    setScore(finalScore);
    setAccuracy(finalAccuracy);
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    setTime(totalTime);
    return totalTime;
  };

  const handleGameComplete = (result) => {
    // Finish local timers / state and compute duration
    const totalTime = endGame(result.score, result.accuracy);

    // Store complete game result for local display
    const fullResult = {
      ...result,
      time: totalTime,
      challengeTimeElapsed: challenge ? challengeTimeElapsed : null
    };
    setGameResult(fullResult);

    if (result.correctAnswers !== undefined) {
      setCorrectAnswers(result.correctAnswers);
    }

    // Auto-submit score to parent (no manual submit button)
    onComplete(fullResult);
  };

  // Callback to update score in real-time
  const handleScoreUpdate = useCallback((newScore, newAccuracy) => {
    setScore(newScore);
    if (newAccuracy !== undefined) {
      setAccuracy(newAccuracy);
    }
  }, []);

  const renderGameComponent = () => {
    const gameProps = {
      onComplete: handleGameComplete,
      onPause: pauseGame,
      isPaused: gameState === 'paused',
      timeLimit: game.gameConfig?.timeLimit,
      difficulty: difficulty, // Pass difficulty to game components
      onScoreUpdate: handleScoreUpdate, // Pass score update callback
      resetKey: gameResetKey // Pass reset key to force reset when restart is clicked
    };

    switch (game.slug) {
      case 'memory-match':
        return <MemoryGame {...gameProps} />;
      case 'math-quiz':
        return <MathQuiz {...gameProps} />;
      case 'word-scramble':
        return <WordScramble {...gameProps} />;
      case 'reaction-time':
        return <ReactionTime {...gameProps} />;
      case 'puzzle-solver':
        return <PuzzleSolver {...gameProps} />;
      default:
        return <div className="text-center">Game not implemented yet</div>;
    }
  };

  const getGameInstructions = () => {
    let instructions = game.gameConfig?.instructions || 'Complete the game to earn coins!';
    
    if (challenge) {
      const timeLimit = challenge.requirements?.timeLimit || 300;
      const minScore = challenge.requirements?.minScore || 0;
      instructions = `Challenge: Score ${minScore}+ points within ${timeLimit} seconds!`;
    }
    
    return instructions;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    if (!challenge || !challengeTimeLimit) return 0;
    return Math.max(0, challengeTimeLimit - challengeTimeElapsed);
  };

  const getTimerColor = () => {
    const timeRemaining = getTimeRemaining();
    const percentage = (timeRemaining / challengeTimeLimit) * 100;
    
    if (percentage > 60) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    if (percentage > 10) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">{game.name}</h2>
          </div>
          
          {/* Challenge Timer */}
          {showChallengeTimer && challenge && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              getTimeRemaining() <= 30 ? 'bg-red-100' : 'bg-blue-50'
            }`}>
              <FiClock className={`w-4 h-4 ${getTimerColor()}`} />
              <span className={`font-semibold ${getTimerColor()}`}>
                {formatTime(getTimeRemaining())}
              </span>
              <span className="text-gray-500 text-sm">
                / {formatTime(challengeTimeLimit)}
              </span>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Game Content */}
        <div className="p-6">
          {gameState === 'menu' && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">{game.icon || '🎮'}</div>
              <h3 className="text-2xl font-bold text-gray-800">{game.name}</h3>
              <p className="text-gray-600 max-w-md mx-auto">{getGameInstructions()}</p>
              
              {challenge && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-800 mb-2">Challenge Requirements:</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div>• Minimum Score: {challenge.requirements?.minScore || 0}</div>
                    <div>• Time Limit: {challenge.requirements?.timeLimit || 300} seconds</div>
                    <div>• Reward: {challenge.rewards?.coins || 0} coins + {challenge.rewards?.experience || 0} XP</div>
                  </div>
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="btn-primary text-lg px-8 py-3"
              >
                <FiPlay className="w-5 h-5 mr-2" />
                Start {challenge ? 'Challenge' : 'Game'}
              </motion.button>
            </div>
          )}

          {(gameState === 'playing' || gameState === 'paused') && (
            <div className="space-y-4">
              {/* Game Stats - Different for Practice vs Challenge */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                {mode === 'challenge' ? (
                  // Challenge Mode: Show Score and Challenge Timer
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{score}</div>
                      <div className="text-sm text-gray-500">Score</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getTimerColor()}`}>
                        {formatTime(getTimeRemaining())}
                      </div>
                      <div className="text-sm text-gray-500">Time Left</div>
                    </div>
                  </div>
                ) : (
                  // Practice Mode: Show Score only (no game timer)
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">{score}</div>
                      <div className="text-sm text-gray-500">Score</div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {mode === 'challenge' ? (
                    <button
                      onClick={pauseGame}
                      className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                      title="Exit Challenge (Attempt will be counted)"
                    >
                      <FiAlertCircle className="w-4 h-4 mr-2" />
                      Exit Challenge
                    </button>
                  ) : (
                    gameState === 'playing' ? (
                      <button
                        onClick={pauseGame}
                        className="btn-outline"
                      >
                        <FiPause className="w-4 h-4 mr-2" />
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={resumeGame}
                        className="btn-primary"
                      >
                        <FiPlay className="w-4 h-4 mr-2" />
                        Resume
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Game Component - Always render to preserve state */}
              <div className="relative min-h-[400px] flex items-center justify-center">
                {renderGameComponent()}
                
                {/* Pause Overlay - Only show when paused in practice mode */}
                {gameState === 'paused' && mode === 'practice' && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg z-10">
                    <div className="text-center space-y-4">
                      <div className="text-6xl mb-4">⏸️</div>
                      <h3 className="text-2xl font-bold text-white">Game Paused</h3>
                      <p className="text-gray-200">
                        Take a break or resume when ready
                      </p>
                      <div className="flex justify-center space-x-4 mt-6">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={resumeGame}
                          className="btn-primary"
                        >
                          <FiPlay className="w-4 h-4 mr-2" />
                          Resume
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={startGame}
                          className="btn-outline bg-white"
                        >
                          <FiRotateCcw className="w-4 h-4 mr-2" />
                          Restart
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState === 'completed' && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-800">Game Complete!</h3>
              
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">{score}</div>
                  <div className="text-sm text-gray-500">Final Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{formatTime(time)}</div>
                  <div className="text-sm text-gray-500">Game Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                  <div className="text-sm text-gray-500">Accuracy</div>
                </div>
              </div>
              
              {challenge && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-semibold text-blue-800 mb-2">Challenge Results:</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <div>• Challenge Time: {formatTime(challengeTimeElapsed)}</div>
                    <div>• Time Limit: {formatTime(challengeTimeLimit)}</div>
                    <div>• Score Required: {challenge.requirements?.minScore || 0}</div>
                    <div>• Your Score: {score}</div>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="btn-primary text-lg px-8 py-3"
              >
                Close
              </motion.button>
            </div>
          )}
        </div>

        {/* Time Up Popup */}
        <AnimatePresence>
          {showTimeUpPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-xl p-8 max-w-md mx-4 text-center"
              >
                <div className="text-6xl mb-4">⏰</div>
                <h3 className="text-2xl font-bold text-red-600 mb-4">Time's Up!</h3>
                <p className="text-gray-600 mb-6">
                  Challenge time limit exceeded. Your score will be submitted but may not qualify for rewards.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-sm text-red-700">
                    <div>• Time Elapsed: {formatTime(challengeTimeElapsed)}</div>
                    <div>• Time Limit: {formatTime(challengeTimeLimit)}</div>
                    <div>• Final Score: {score}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTimeUpPopup(false);
                    handleSubmitScore();
                  }}
                  className="btn-primary w-full"
                >
                  Continue
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default GamePlayer;
