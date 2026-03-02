 import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import DifficultyIndicator from './DifficultyIndicator';

// New aptitude-style pattern matrix game (replaces old sliding puzzle)
const PuzzleSolver = ({ onComplete, onPause, isPaused, timeLimit, difficulty = 'easy', onScoreUpdate }) => {
  const config = useMemo(() => {
    const base = {
      easy: { levelTarget: 3 },
      medium: { levelTarget: 3 },
      hard: { levelTarget: 3 }
    };
    return base[difficulty] || base.easy;
  }, [difficulty]);

  const renderShape = (shape) => {
    switch (shape) {
      case 'square':
        return '■';
      case 'circle':
        return '●';
      case 'triangle':
        return '▲';
      case 'plus':
        return '✚';
      default:
        return '';
    }
  };

  const puzzles = useMemo(() => {
    // EASY: 2x2 and 3x3 from your examples (1–10)
    const easy = [
      // 1
      {
        size: 3,
        grid: [
          ['square', 'circle', 'square'],
          ['triangle', 'circle', 'triangle'],
          ['square', 'question', 'square']
        ],
        options: ['circle', 'triangle', 'square', 'plus'],
        correctIndex: 0
      },
      // 2
      {
        size: 3,
        grid: [
          ['circle', 'circle', 'circle'],
          ['triangle', 'triangle', 'triangle'],
          ['plus', 'question', 'plus']
        ],
        options: ['square', 'triangle', 'circle', 'plus'],
        correctIndex: 3
      },
      // 3
      {
        size: 3,
        grid: [
          ['square', 'circle', 'triangle'],
          ['square', 'circle', 'triangle'],
          ['square', 'question', 'triangle']
        ],
        options: ['circle', 'square', 'triangle', 'plus'],
        correctIndex: 0
      },
      // 4
      {
        size: 3,
        grid: [
          ['square', 'circle', 'square'],
          ['circle', 'square', 'circle'],
          ['square', 'circle', 'question']
        ],
        options: ['square', 'triangle', 'circle', 'plus'],
        correctIndex: 0
      },
      // 5
      {
        size: 3,
        grid: [
          ['triangle', 'circle', 'square'],
          ['plus', 'triangle', 'circle'],
          ['square', 'plus', 'question']
        ],
        options: ['triangle', 'circle', 'square', 'plus'],
        correctIndex: 0
      },
      // 6 (2x2)
      {
        size: 2,
        grid: [
          ['square', 'triangle'],
          ['square', 'question']
        ],
        options: ['triangle', 'square', 'circle', 'plus'],
        correctIndex: 0
      },
      // 7
      {
        size: 3,
        grid: [
          ['square', 'circle', 'square'],
          ['triangle', 'plus', 'triangle'],
          ['square', 'circle', 'question']
        ],
        options: ['triangle', 'square', 'circle', 'plus'],
        correctIndex: 1
      },
      // 8
      {
        size: 3,
        grid: [
          ['plus', 'square', 'circle'],
          ['plus', 'triangle', 'circle'],
          ['plus', 'square', 'question']
        ],
        options: ['triangle', 'circle', 'square', 'plus'],
        correctIndex: 1
      },
      // 9
      {
        size: 3,
        grid: [
          ['circle', 'triangle', 'circle'],
          ['square', 'plus', 'square'],
          ['circle', 'triangle', 'question']
        ],
        options: ['circle', 'triangle', 'square', 'plus'],
        correctIndex: 0
      },
      // 10
      {
        size: 3,
        grid: [
          ['square', 'circle', 'square'],
          ['triangle', 'plus', 'triangle'],
          ['square', 'circle', 'question']
        ],
        options: ['square', 'triangle', 'circle', 'plus'],
        correctIndex: 0
      }
    ];

    // MEDIUM: 3x3 and 4x4 from 16–20, 36–40 where appropriate
    const medium = [
      // 16
      {
        size: 3,
        grid: [
          ['square', 'circle', 'triangle'],
          ['plus', 'triangle', 'circle'],
          ['square', 'circle', 'question']
        ],
        options: ['triangle', 'circle', 'square', 'plus'],
        correctIndex: 0
      },
      // 17
      {
        size: 3,
        grid: [
          ['square', 'circle', 'triangle'],
          ['triangle', 'square', 'circle'],
          ['circle', 'triangle', 'question']
        ],
        options: ['square', 'circle', 'triangle', 'plus'],
        correctIndex: 0
      },
      // 18
      {
        size: 3,
        grid: [
          ['square', 'circle', 'triangle'],
          ['circle', 'triangle', 'square'],
          ['triangle', 'square', 'question']
        ],
        options: ['square', 'circle', 'triangle', 'plus'],
        correctIndex: 1
      },
      // 19
      {
        size: 3,
        grid: [
          ['square', 'plus', 'triangle'],
          ['circle', 'plus', 'circle'],
          ['triangle', 'plus', 'question']
        ],
        options: ['circle', 'triangle', 'square', 'plus'],
        correctIndex: 1
      },
      // 20
      {
        size: 3,
        grid: [
          ['circle', 'square', 'triangle'],
          ['plus', 'circle', 'plus'],
          ['triangle', 'square', 'question']
        ],
        options: ['circle', 'triangle', 'square', 'plus'],
        correctIndex: 0
      },
      // 36 (4x4)
      {
        size: 4,
        grid: [
          ['square', 'circle', 'triangle', 'plus'],
          ['circle', 'triangle', 'plus', 'square'],
          ['triangle', 'plus', 'square', 'circle'],
          ['plus', 'square', 'circle', 'question']
        ],
        options: ['square', 'circle', 'triangle', 'plus'],
        correctIndex: 2
      },
      // 37 (4x4)
      {
        size: 4,
        grid: [
          ['square', 'circle', 'triangle', 'plus'],
          ['circle', 'square', 'plus', 'triangle'],
          ['triangle', 'plus', 'square', 'circle'],
          ['plus', 'triangle', 'circle', 'question']
        ],
        options: ['square', 'circle', 'triangle', 'plus'],
        correctIndex: 0
      }
    ];

    // HARD: more complex 3x3 / 4x4 from 38–40 and a couple of mixes
    const hard = [
      // 38
      {
        size: 3,
        grid: [
          ['circle', 'triangle', 'circle'],
          ['triangle', 'square', 'triangle'],
          ['circle', 'triangle', 'question']
        ],
        options: ['square', 'triangle', 'circle', 'plus'],
        correctIndex: 2
      },
      // 39
      {
        size: 4,
        grid: [
          ['square', 'circle', 'circle', 'square'],
          ['triangle', 'plus', 'plus', 'triangle'],
          ['triangle', 'plus', 'plus', 'triangle'],
          ['square', 'circle', 'circle', 'question']
        ],
        options: ['square', 'triangle', 'circle', 'plus'],
        correctIndex: 0
      },
      // 40
      {
        size: 4,
        grid: [
          ['square', 'circle', 'triangle', 'plus'],
          ['circle', 'triangle', 'plus', 'square'],
          ['triangle', 'plus', 'square', 'circle'],
          ['plus', 'square', 'circle', 'question']
        ],
        options: ['square', 'circle', 'triangle', 'plus'],
        correctIndex: 2
      }
    ];

    if (difficulty === 'easy') return easy;
    if (difficulty === 'medium') return medium;
    return hard;
  }, [difficulty]);

  const totalPuzzles = puzzles.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelCorrect, setLevelCorrect] = useState(0);

  const onCompleteRef = useRef(onComplete);
  const onScoreUpdateRef = useRef(onScoreUpdate);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onComplete, onScoreUpdate]);

  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setScore(0);
    setLevel(1);
    setLevelCorrect(0);
  }, [difficulty]);

  useEffect(() => {
    if (currentIndex >= totalPuzzles) {
      const accuracy = totalPuzzles > 0 ? Math.round((correctCount / totalPuzzles) * 100) : 0;
      onCompleteRef.current?.({
        score,
        accuracy,
        correctAnswers: correctCount
      });
    }
  }, [currentIndex, totalPuzzles, correctCount, score]);

  if (currentIndex >= totalPuzzles) {
    return (
      <div className="text-center p-8">
        <DifficultyIndicator difficulty={difficulty} />
        <div className="text-gray-600 mt-4">Loading results...</div>
      </div>
    );
  }

  const currentPuzzle = puzzles[currentIndex];

  const handleOptionClick = (index) => {
    if (isPaused || currentIndex >= totalPuzzles) return;
    if (selectedOption !== null) return;

    setSelectedOption(index);
    const isCorrect = index === currentPuzzle.correctIndex;

    setCorrectCount(prev => prev + (isCorrect ? 1 : 0));

    const pointsPerPuzzle = 100 / totalPuzzles;
    setScore(prev => {
      const nextScore = isCorrect ? prev + pointsPerPuzzle : prev;
      const rounded = Math.round(nextScore);
      const accuracy = Math.round(((correctCount + (isCorrect ? 1 : 0)) / (currentIndex + 1)) * 100);
      onScoreUpdateRef.current?.(rounded, accuracy);
      return rounded;
    });

    if (isCorrect) {
      setLevelCorrect(prev => {
        const next = prev + 1;
        if (next >= config.levelTarget) {
          setLevel(lvl => lvl + 1);
          return 0;
        }
        return next;
      });
    } else {
      setLevelCorrect(0);
      setLevel(lvl => Math.max(1, lvl - 1));
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    }, 600);
  };

  return (
    <div className={`text-center ${isPaused ? 'opacity-50 pointer-events-none select-none' : ''}`}>
      <DifficultyIndicator difficulty={difficulty} />

      <div className="mb-6">
        <div className="flex justify-center gap-10 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">
              {currentIndex + 1}/{totalPuzzles}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Puzzles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{level}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Level</div>
          </div>
        </div>

        <div className="max-w-xs mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all"
              style={{
                width: `${Math.min(100, (levelCorrect / config.levelTarget) * 100)}%`
              }}
            />
          </div>
          <div className="mt-1 text-[11px] text-gray-500 text-center">
            Next level in {Math.max(0, config.levelTarget - levelCorrect)} correct puzzle
            {config.levelTarget - levelCorrect === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <motion.div
        key={`${currentIndex}-${difficulty}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white via-slate-50 to-indigo-50 rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-white/60"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Choose the shape that correctly fills the question mark.
        </h3>

        {/* Visible grid with strong lines */}
        <div className="inline-block mb-6">
          <div
            className="grid bg-gray-200"
            style={{
              gridTemplateColumns: `repeat(${currentPuzzle.size}, 52px)`,
              gridTemplateRows: `repeat(${currentPuzzle.size}, 52px)`
            }}
          >
            {currentPuzzle.grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="bg-white flex items-center justify-center"
                  style={{
                    borderRight:
                      colIndex === currentPuzzle.size - 1 ? 'none' : '1px solid #E5E7EB',
                    borderBottom:
                      rowIndex === currentPuzzle.size - 1 ? 'none' : '1px solid #E5E7EB'
                  }}
                >
                  {cell === 'question' ? (
                    <span className="text-xl font-bold text-gray-500">?</span>
                  ) : cell ? (
                    <span className="text-2xl text-gray-800">{renderShape(cell)}</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {currentPuzzle.options.map((opt, index) => {
            const isCorrectOption = index === currentPuzzle.correctIndex;
            const isSelected = selectedOption === index;

            let borderClass = 'border-gray-200';
            if (selectedOption !== null) {
              if (isSelected && isCorrectOption) borderClass = 'border-green-500';
              else if (isSelected && !isCorrectOption) borderClass = 'border-red-500';
              else if (isCorrectOption) borderClass = 'border-green-400';
            }

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleOptionClick(index)}
                className={`
                  bg-white rounded-xl border-2 ${borderClass}
                  flex items-center justify-center py-3 text-2xl
                  transition-all duration-200
                  ${isPaused ? 'cursor-not-allowed opacity-60' : 'hover:shadow-md cursor-pointer'}
                `}
              >
                {renderShape(opt)}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default PuzzleSolver;


