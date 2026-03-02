import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import DifficultyIndicator from './DifficultyIndicator';

const MathQuiz = ({ onComplete, onPause, isPaused, timeLimit, difficulty = 'easy', onScoreUpdate, resetKey = 0 }) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [score, setScore] = useState(0); // Track score separately
  const [gameActive, setGameActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [level, setLevel] = useState(1);
  const [levelCorrect, setLevelCorrect] = useState(0); // Correct answers towards next level
  
  // Refs to prevent resets and track state
  const timerRef = useRef(null);
  const initializedRef = useRef(false);
  const lastResetKeyRef = useRef(resetKey);
  const scoreRef = useRef(0); // Track score in ref for timer callback
  
  // Initialize config immediately to prevent null access - memoized to prevent re-renders
  const config = useMemo(() => {
    const configs = {
      // Per-question timers (seconds) similar to WordScramble behaviour
      easy: { maxNumber: 20, operators: ['+', '-'], totalQuestions: 10, perQuestionTime: 15 },
      medium: { maxNumber: 50, operators: ['+', '-', '*'], totalQuestions: 15, perQuestionTime: 12 },
      hard: { maxNumber: 100, operators: ['+', '-', '*', '/'], totalQuestions: 20, perQuestionTime: 10 }
    };
    return configs[difficulty] || configs.easy;
  }, [difficulty]);
  
  const onCompleteRef = useRef(onComplete);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  
  // Update callback refs
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onComplete, onScoreUpdate]);

  // Initialize game ONCE - only when first starting (not on resume)
  // Reset when resetKey changes (restart button clicked)
  useEffect(() => {
    // Check if reset key changed (restart was clicked)
    if (resetKey !== lastResetKeyRef.current) {
      lastResetKeyRef.current = resetKey;
      // Reset all game state
      setGameActive(true);
      setQuestionCount(0);
      setCorrectAnswers(0);
      setScore(0); // Reset score
      scoreRef.current = 0; // Reset ref
      setUserAnswer('');
      setCurrentQuestion(null); // Will generate new question
      setLevel(1);
      setLevelCorrect(0);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      initializedRef.current = true;
    } else if (!initializedRef.current) {
      // First time initialization
      setGameActive(true);
      setQuestionCount(0);
      setCorrectAnswers(0);
      setScore(0); // Initialize score
      setUserAnswer('');
      setLevel(1);
      setLevelCorrect(0);
      
      initializedRef.current = true;
    }
  }, [resetKey]);

  // Generate new question
  const generateQuestion = useCallback(() => {
    const num1 = Math.floor(Math.random() * config.maxNumber) + 1;
    const num2 = Math.floor(Math.random() * config.maxNumber) + 1;
    const operator = config.operators[Math.floor(Math.random() * config.operators.length)];
    
    let answer, question;
    switch (operator) {
      case '+': 
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
        break;
      case '-': 
        answer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
        break;
      case '*': 
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
        break;
      case '/':
        const product = num1 * num2;
        answer = num2;
        question = `${product} ÷ ${num1} = ?`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
    }

    setCurrentQuestion({ question, answer });
  }, [config]);

  // Generate first question after init
  useEffect(() => {
    if (gameActive && !currentQuestion && initializedRef.current) {
      generateQuestion();
      setTimeRemaining(config.perQuestionTime);
    }
  }, [gameActive, currentQuestion, generateQuestion, config.perQuestionTime]);


  // Per-question timer effect - similar to WordScramble
  useEffect(() => {
    // Stop timer when paused or game inactive
    if (isPaused || !gameActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start timer for current question
    if (timeRemaining !== null && timeRemaining > 0 && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            // Time's up for this question → count as incorrect and move on
            setQuestionCount(prevCount => {
              const newCount = prevCount + 1;

              // Missed question → reset level progress and drop one level (but never below 1)
              setLevelCorrect(0);
              setLevel(prev => Math.max(1, prev - 1));

              // Update accuracy with same score (no extra points)
              const accuracy = newCount > 0
                ? Math.round((correctAnswers / newCount) * 100)
                : 0;
              onScoreUpdateRef.current?.(scoreRef.current, accuracy);

              // Generate next question if game not finished
              if (newCount < config.totalQuestions) {
                setTimeout(() => {
                  generateQuestion();
                  setTimeRemaining(config.perQuestionTime);
                }, 100);
              }

              return newCount;
            });

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, gameActive, timeRemaining, correctAnswers, config.totalQuestions, config.perQuestionTime, generateQuestion]);

  // Check game completion
  useEffect(() => {
    if (questionCount >= config.totalQuestions && questionCount > 0) {
      // Score is already calculated correctly (only correct answers add points)
      const finalAccuracy = Math.round((correctAnswers / config.totalQuestions) * 100);
      onCompleteRef.current?.({ 
        score: score, // Use the current score state
        accuracy: finalAccuracy,
        correctAnswers: correctAnswers
      });
    }
  }, [questionCount, correctAnswers, score, config]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPaused || !currentQuestion) return;
    if (!userAnswer || userAnswer.toString().trim() === '') {
      // Don't advance if no answer is entered
      return;
    }

    const answer = parseInt(userAnswer);
    let newCorrect = correctAnswers;
    if (answer === currentQuestion.answer) {
      newCorrect = correctAnswers + 1;

      // Update level progression: every 3 correct answers = +1 level
      setLevelCorrect(prev => {
        const next = prev + 1;
        const TARGET = 3;
        if (next >= TARGET) {
          setLevel(lvl => lvl + 1);
          return 0;
        }
        return next;
      });
    } else {
      // Wrong answer → reset level progress and drop one level (but never below 1)
      setLevelCorrect(0);
      setLevel(prev => Math.max(1, prev - 1));
    }

    const newQuestionCount = questionCount + 1;
    setCorrectAnswers(newCorrect);
    setQuestionCount(newQuestionCount);
    setUserAnswer('');

    // Stop existing timer so next question starts with a fresh countdown
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update score: only add points for correct answers, wrong answers don't subtract
    // For 10 questions: 10 points per correct answer
    const pointsPerQuestion = 100 / config.totalQuestions;
    
    // Only increase score on correct answers
    setScore(prevScore => {
      if (answer === currentQuestion.answer) {
        const newScore = prevScore + pointsPerQuestion;
        const finalScore = Math.round(newScore);
        scoreRef.current = finalScore; // Update ref
        onScoreUpdateRef.current?.(finalScore, Math.round((newCorrect / newQuestionCount) * 100));
        return finalScore;
      }
      // Wrong answer → no change to score
      scoreRef.current = prevScore; // Update ref
      onScoreUpdateRef.current?.(prevScore, Math.round((newCorrect / newQuestionCount) * 100));
      return prevScore;
    });

    // Generate next question and reset per-question timer
    if (newQuestionCount < config.totalQuestions) {
      generateQuestion();
      setTimeRemaining(config.perQuestionTime);
    } else {
      // No more questions → stop timer
      setTimeRemaining(null);
    }
  };

  // Don't render until initialized (GamePlayer handles start screen)
  if (!gameActive || !initializedRef.current) {
    return (
      <div className="text-center p-12">
        <DifficultyIndicator difficulty={difficulty} />
        <div className="text-gray-600 mt-4">Preparing game...</div>
      </div>
    );
  }

  return (
    <div className={isPaused ? 'opacity-50 pointer-events-none select-none' : ''}>
      <DifficultyIndicator difficulty={difficulty} />

      {/* Compact stats row aligned with Word Scramble */}
      <div className="mb-6">
        <div className="flex justify-center gap-10 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">{questionCount}/{config.totalQuestions}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{level}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Level</div>
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

        {/* Level progress bar: only correct answers move this */}
        <div className="max-w-xs mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all"
              style={{
                width: `${Math.min(100, (levelCorrect / 3) * 100)}%`
              }}
            />
          </div>
          <div className="mt-1 text-[11px] text-gray-500 text-center">
            Next level in {Math.max(0, 3 - levelCorrect)} correct answer
            {3 - levelCorrect === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Question */}
      <motion.div
        key={`${questionCount}-${currentQuestion?.question}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-white via-slate-50 to-indigo-50 rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-white/60"
      >
        {/* Pause overlay: hide the question while paused */}
        {isPaused && (
          <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="text-5xl mb-2">⏸️</div>
              <div className="text-lg font-bold text-gray-800">Paused</div>
              <div className="text-sm text-gray-600">Question hidden until you resume</div>
            </div>
          </div>
        )}

        <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          {currentQuestion?.question || 'Loading...'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="input input-lg text-center text-2xl font-bold w-full"
            placeholder="Enter your answer"
            autoFocus
            disabled={isPaused}
          />
          <button
            type="submit"
            disabled={isPaused || !currentQuestion}
            className="btn btn-primary btn-lg w-full disabled:opacity-50"
          >
            Submit Answer
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default MathQuiz;
