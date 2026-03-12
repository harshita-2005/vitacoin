import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

const WORD_BANK = {
  easy: [
    'CAT', 'DOG', 'SUN', 'MOON', 'STAR', 'TREE', 'BOOK', 'BALL', 'CAKE', 'FISH',
    'BIRD', 'RAIN', 'WIND', 'FROG', 'LION', 'BEAR', 'SHIP', 'BIKE', 'FIRE', 'SNOW',
    'MILK', 'RICE', 'NOTE', 'LAMP', 'RING', 'KING', 'TENT', 'SAND', 'ROAD', 'HOME'
  ],
  medium: [
    'APPLE', 'HOUSE', 'MUSIC', 'OCEAN', 'RIVER', 'TIGER', 'PAPER', 'CHAIR', 'LIGHT', 'STONE',
    'GARDEN', 'PLANET', 'MARKET', 'FRIEND', 'ORANGE', 'BUTTER', 'PUZZLE', 'CANDLE', 'MIRROR', 'SILVER',
    'BUTTON', 'BOTTLE', 'POCKET', 'SYSTEM', 'PURPLE', 'FUTURE', 'MONKEY', 'COFFEE', 'SHADOW', 'WINDOW'
  ],
  hard: [
    'ADVENTURE', 'BEAUTIFUL', 'CHALLENGE', 'DIFFICULT', 'ELEPHANT', 'FANTASTIC', 'GENERATOR', 'HAPPINESS', 'JOURNEY', 'KNOWLEDGE',
    'IMAGINATION', 'CELEBRATION', 'DEVELOPMENT', 'INSPIRATION', 'ENVIRONMENT', 'COMMUNICATION', 'INFORMATION', 'RECOGNITION', 'TECHNOLOGY', 'EDUCATION',
    'ENTERTAINMENT', 'CONFIDENCE', 'PERSPECTIVE', 'CREATIVITY', 'RESPONSIBILITY', 'OPPORTUNITY', 'UNDERSTANDING', 'COLLABORATION', 'AUTHENTICATION', 'TRANSACTION'
  ]
};

const WordScramble = ({
  onComplete,
  onPause,
  isPaused,
  timeLimit,
  difficulty = 'easy',
  onScoreUpdate,
  resetKey = 0,
  dailyChallengeTasks
}) => {
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [score, setScore] = useState(0); // Track score separately (like MathQuiz)
  const [timeRemaining, setTimeRemaining] = useState(null);
  const streakRef = useRef(0);
  const [level, setLevel] = useState(1); // Many levels inside the same difficulty
  const levelCorrectRef = useRef(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null

  const timerRef = useRef(null);
  const isInitializedRef = useRef(false);
  const lastResetKeyRef = useRef(resetKey);
  const shouldStartTimerRef = useRef(false);
  const prevPausedRef = useRef(isPaused);
  const scoreRef = useRef(0); // Track score in ref for callbacks

  const onCompleteRef = useRef(onComplete);
  const onScoreUpdateRef = useRef(onScoreUpdate);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onComplete, onScoreUpdate]);

  // ---------------- CONFIG ----------------
  const config = useMemo(() => {
    let totalWords = 18;
    switch (difficulty) {
      case 'easy':
        totalWords = 18;
        return {
          words: WORD_BANK.easy,
          totalWords: dailyChallengeTasks ?? totalWords,
          baseTimeLimit: 12,
          wordLength: '3-5 letters',
          levelWords: 3
        };
      case 'medium':
        totalWords = 24;
        return {
          words: WORD_BANK.medium,
          totalWords: dailyChallengeTasks ?? totalWords,
          baseTimeLimit: 14,
          wordLength: '5-7 letters',
          levelWords: 3
        };
      case 'hard':
        totalWords = 30;
        return {
          words: WORD_BANK.hard,
          totalWords: dailyChallengeTasks ?? totalWords,
          baseTimeLimit: 18,
          wordLength: '7-12 letters',
          levelWords: 3
        };
      default:
        return {
          words: ['CAT', 'DOG'],
          totalWords: dailyChallengeTasks ?? 5,
          baseTimeLimit: 10,
          wordLength: '3-4 letters',
          levelWords: 3
        };
    }
  }, [difficulty, dailyChallengeTasks]);

  // ---------------- HELPERS ----------------
  const scrambleWord = (word) => {
    if (!word) return '';
    const original = word.toUpperCase();
    let scrambled = original;
    // Avoid showing the same word unscrambled
    for (let i = 0; i < 6 && scrambled === original; i += 1) {
      scrambled = original
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
    }
    return scrambled;
  };

  const getTargetLengthRange = useCallback(() => {
    // Make "levels" feel real by changing word length as the player advances.
    // Higher level → slightly longer words, capped by available bank.
    if (difficulty === 'easy') {
      const min = 3;
      const max = Math.min(6, 4 + Math.floor((level - 1) / 2));
      return { min, max };
    }
    if (difficulty === 'medium') {
      const min = 5;
      const max = Math.min(9, 6 + Math.floor((level - 1) / 2));
      return { min, max };
    }
    const min = 7;
    const max = Math.min(14, 9 + Math.floor((level - 1) / 2));
    return { min, max };
  }, [difficulty, level]);

  const pickWordForLevel = useCallback(() => {
    const { min, max } = getTargetLengthRange();
    const pool = config.words.filter(w => w.length >= min && w.length <= max);
    const list = pool.length ? pool : config.words;
    return list[Math.floor(Math.random() * list.length)];
  }, [config.words, getTargetLengthRange]);

  const getEffectiveTimeLimit = useCallback(() => {
    const base = config.baseTimeLimit;
    if (!base) return null;
    // Reduce time gradually as level increases (but keep a minimum so it's playable).
    const reduction = Math.floor((level - 1) / 2);
    return Math.max(6, base - reduction);
  }, [config.baseTimeLimit, level]);

  const maskedWord = useMemo(() => {
    // Hide the word during pause to prevent "free thinking time"
    const len = scrambledWord?.length || 6;
    return '•'.repeat(Math.max(3, len));
  }, [scrambledWord]);

  // ---------------- TIMER LOGIC ----------------
  const startTimer = useCallback(() => {
    // Don't start if paused or no time limit
    if (isPaused || !config.baseTimeLimit) {
      return;
    }

    // Don't start if timer already running
    if (timerRef.current) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - clear timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Time up counts as a miss: reset streak/level progress slightly
          streakRef.current = 0;
          levelCorrectRef.current = 0;

          // Move to next word automatically
          setWordCount(count => {
            const next = count + 1;
            if (next < config.totalWords) {
              // Generate next word after a short delay
              setTimeout(() => {
                const word = pickWordForLevel();
                setCurrentWord(word);
                setScrambledWord(scrambleWord(word));
                setUserAnswer('');
                const nextTimeLimit = getEffectiveTimeLimit();
                setTimeRemaining(nextTimeLimit);
                shouldStartTimerRef.current = true; // Mark that timer should start
              }, 100);
            }
            return next;
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isPaused, config.baseTimeLimit, config.totalWords, getEffectiveTimeLimit, pickWordForLevel]);

  // ---------------- CORE GAME LOGIC ----------------
  const startNewWord = useCallback(() => {
    // Stop previous timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const word = pickWordForLevel();
    setCurrentWord(word);
    setScrambledWord(scrambleWord(word));
    setUserAnswer('');

    // Set timer value and mark that we should start timer
    if (config.baseTimeLimit) {
      const nextTimeLimit = getEffectiveTimeLimit();
      setTimeRemaining(nextTimeLimit);
      shouldStartTimerRef.current = true;
    } else {
      setTimeRemaining(null);
      shouldStartTimerRef.current = false;
    }
  }, [config.baseTimeLimit, getEffectiveTimeLimit, pickWordForLevel]);

  // ---------------- HANDLE PAUSE/RESUME ----------------
  useEffect(() => {
    const wasPaused = prevPausedRef.current;
    prevPausedRef.current = isPaused;

    if (isPaused) {
      // Pause: stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else if (wasPaused && !isPaused) {
      // Just resumed: restart timer if we have a word and time remaining
      if (currentWord && config.baseTimeLimit && wordCount < config.totalWords && !timerRef.current) {
        // Check timeRemaining and start timer
        setTimeRemaining(prev => {
          if (prev !== null && prev > 0 && !timerRef.current) {
            startTimer();
          }
          return prev;
        });
      }
    }
  }, [isPaused, currentWord, wordCount, config.totalWords, config.baseTimeLimit, startTimer]);

  // ---------------- START GAME ----------------
  useEffect(() => {
    // Check if this is a reset
    if (resetKey !== lastResetKeyRef.current) {
      // Reset all state
      setCurrentWord('');
      setScrambledWord('');
      setUserAnswer('');
      setWordCount(0);
      setCorrectAnswers(0);
      setScore(0); // Reset score
      scoreRef.current = 0; // Reset ref
      setTimeRemaining(null);
      streakRef.current = 0;
      setLevel(1);
      levelCorrectRef.current = 0;
      setFeedback(null);
      isInitializedRef.current = false;
      lastResetKeyRef.current = resetKey;
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Initialize game only once
    if (!isInitializedRef.current && !isPaused) {
      isInitializedRef.current = true;
      startNewWord();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetKey, startNewWord, isPaused]);

  // ---------------- START TIMER WHEN WORD IS READY ----------------
  useEffect(() => {
    // Start timer when we have a new word and should start timer, and not paused
    if (currentWord && shouldStartTimerRef.current && !isPaused && !timerRef.current && wordCount < config.totalWords) {
      shouldStartTimerRef.current = false; // Reset flag
      startTimer();
    }
  }, [currentWord, isPaused, wordCount, config.totalWords, startTimer]);

  // ---------------- GAME COMPLETE ----------------
  useEffect(() => {
    if (wordCount >= config.totalWords) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Calculate accuracy (percentage)
      const finalAccuracy = Math.round((correctAnswers / config.totalWords) * 100);

      onCompleteRef.current?.({
        score: score, // Use the current score state (like MathQuiz)
        accuracy: finalAccuracy,
        correctAnswers,
        levelReached: level
      });
    }
  }, [wordCount, correctAnswers, score, config.totalWords, level]);

  // ---------------- SUBMIT ----------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isPaused) return;
    if (!userAnswer || userAnswer.toString().trim() === '') {
      // Don't advance if no answer is entered
      return;
    }

    const isCorrect = userAnswer.toUpperCase() === currentWord;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      streakRef.current += 1;
      levelCorrectRef.current += 1;
      if (levelCorrectRef.current >= config.levelWords) {
        setLevel((lvl) => lvl + 1);
        levelCorrectRef.current = 0;
      }
    } else {
      streakRef.current = 0;
      setLevel((lvl) => Math.max(1, lvl - 1));
      levelCorrectRef.current = 0;
    }

    // Clear feedback after a short delay
    setTimeout(() => setFeedback(null), 500);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update word count and correct answers
    const newWordCount = wordCount + 1;
    const newCorrect = isCorrect ? correctAnswers + 1 : correctAnswers;
    
    setWordCount(newWordCount);
    setCorrectAnswers(newCorrect);

    // Update score: only add points for correct answers, wrong answers don't subtract
    // For 5 words: 20 points per correct answer, for 7 words: ~14.3 points, for 10 words: 10 points
    const pointsPerWord = 100 / config.totalWords;
    
    // Only increase score on correct answers
    setScore(prevScore => {
      if (isCorrect) {
        const newScore = prevScore + pointsPerWord;
        const finalScore = Math.round(newScore);
        scoreRef.current = finalScore; // Update ref
        const accuracy = Math.round((newCorrect / newWordCount) * 100);
        onScoreUpdateRef.current?.(finalScore, accuracy);
        return finalScore;
      }
      // Wrong answer → no change to score
      scoreRef.current = prevScore; // Update ref
      const accuracy = Math.round((newCorrect / newWordCount) * 100);
      onScoreUpdateRef.current?.(prevScore, accuracy);
      return prevScore;
    });

    // Move to next word if not done
    if (newWordCount < config.totalWords) {
      setTimeout(() => startNewWord(), 100);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className={`text-center ${isPaused ? 'opacity-50 pointer-events-none select-none' : ''}`}>
      {/* Same pattern as Puzzle Solver / Verbal IQ: only count + timer */}
      <div className="flex justify-center gap-10 mb-6">
        <div>
          <div className="text-2xl font-bold">{wordCount}/{config.totalWords}</div>
          <div className="text-xs text-gray-500">WORDS</div>
        </div>
        <div>
          <div
            className={`text-2xl font-bold ${
              timeRemaining !== null && timeRemaining <= 5 ? 'text-red-600 animate-pulse' : 'text-orange-600'
            }`}
          >
            {timeRemaining !== null ? `${timeRemaining}s` : '–'}
          </div>
          <div className="text-xs text-gray-500">TIME</div>
        </div>
      </div>

      <motion.div
        key={wordCount}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto"
      >
        {/* Pause: mask the word so user can't "think for free" */}
        {isPaused && (
          <div className="absolute inset-0 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-2">⏸️</div>
              <div className="text-lg font-bold text-gray-800">Paused</div>
              <div className="text-sm text-gray-600">Word hidden until you resume</div>
            </div>
          </div>
        )}

        <h3 className="text-2xl font-bold mb-4">Unscramble this word:</h3>

        <motion.div
          className="text-4xl font-bold text-primary-600 mb-6"
          animate={
            feedback === 'correct'
              ? { scale: [1, 1.1, 1] }
              : feedback === 'wrong'
              ? { x: [0, -8, 8, -8, 0] }
              : { scale: 1, x: 0 }
          }
          transition={{ duration: 0.3 }}
        >
          <span className={isPaused ? 'blur-sm select-none' : ''}>
            {isPaused ? maskedWord : scrambledWord}
          </span>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value.toUpperCase())}
            className="input input-lg text-center text-xl font-bold w-full"
            placeholder="Enter the word"
            autoFocus
            disabled={isPaused}
          />
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isPaused}>
            Submit Answer
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default WordScramble;
