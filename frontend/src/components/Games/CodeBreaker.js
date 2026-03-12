import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { generateCodeBreakerBatch } from "../../utils/codeBreakerEngine";

const CodeBreaker = ({
  onComplete,
  isPaused,
  difficulty = "easy",
  onScoreUpdate,
  resetKey = 0,
  dailyChallengeTasks
}) => {
  const configMap = {
    easy: { count: 8, timePerQuestion: 25 },
    medium: { count: 12, timePerQuestion: 30 },
    hard: { count: 18, timePerQuestion: 35 }
  };
  const base = configMap[difficulty] || configMap.easy;
  const count = dailyChallengeTasks ?? base.count;
  const puzzleTime = base.timePerQuestion;

  const puzzles = useMemo(() => {
    return generateCodeBreakerBatch(count, { difficulty, resetKey });
  }, [difficulty, count, resetKey]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [time, setTime] = useState(puzzleTime);
  const [gameActive, setGameActive] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIndex(0);
    setSelected(null);
    setScore(0);
    setCorrect(0);
    setTime(puzzleTime);
    setGameActive(true);
  }, [resetKey, puzzleTime, difficulty]);

  useEffect(() => {
    if (!gameActive) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIndex((i) => i + 1);
          return puzzleTime;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [index, isPaused, gameActive, puzzleTime]);

  useEffect(() => {
    if (index >= count && gameActive) {
      const accuracy = count > 0 ? Math.round((correct / count) * 100) : 0;
      onComplete?.({
        score: Math.round(score),
        accuracy,
        correctAnswers: correct
      });
    }
  }, [index, count, correct, score, gameActive, onComplete]);

  if (!gameActive) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 mt-4">Preparing puzzles...</div>
      </div>
    );
  }

  if (index >= count) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 mt-4">Loading results...</div>
      </div>
    );
  }

  const puzzle = puzzles[index];
  const norm = (v) => (typeof v === "number" ? String(v) : String(v));

  const handleClick = (i) => {
    if (selected !== null) return;

    setSelected(i);
    const choice = puzzle.options[i];
    const isCorrect = norm(choice) === norm(puzzle.answer);

    if (isCorrect) setCorrect((c) => c + 1);

    const points = Math.floor(100 / count);
    setScore((prev) => {
      const next = isCorrect ? prev + points : prev;
      onScoreUpdate?.(Math.round(next));
      return next;
    });

    setTimeout(() => {
      setIndex((idx) => idx + 1);
      setSelected(null);
      setTime(puzzleTime);
    }, 500);
  };

  return (
    <div className="text-center relative">
      {isPaused && (
        <div className="absolute inset-0 z-10 rounded-xl bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-2">⏸️</div>
            <div className="text-lg font-bold text-gray-800">Paused</div>
            <div className="text-sm text-gray-600">Question hidden until you resume</div>
          </div>
        </div>
      )}
      <div
        className={
          isPaused ? "opacity-50 pointer-events-none select-none" : ""
        }
      >
      <div className="flex justify-center gap-10 mb-6">
        <div>
          <div className="text-2xl font-bold">
            {index + 1}/{count}
          </div>
          <div className="text-xs text-gray-500">PUZZLES</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">{time}s</div>
          <div className="text-xs text-gray-500">TIME</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch"
        >
          {/* Question + options – more width for question to sit nicely */}
          <div className="flex-1 min-w-0 lg:min-w-[28rem] bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <p className="text-left text-gray-800 text-xl sm:text-2xl font-medium mb-6 leading-relaxed">
              {puzzle.question}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {puzzle.options.map((opt, i) => {
                const isSelected = selected === i;
                const isCorrect = norm(opt) === norm(puzzle.answer);
                let border = "border-gray-200";
                if (selected !== null) {
                  if (isSelected && isCorrect) border = "border-green-500";
                  else if (isSelected && !isCorrect) border = "border-red-500";
                  else if (isCorrect) border = "border-green-400";
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleClick(i)}
                    className={`border-2 ${border} rounded-lg py-3 sm:py-4 text-lg font-bold transition-colors`}
                  >
                    {typeof opt === "number" ? opt : opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rough work area – right side on large screens, slightly narrower so question has more room */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 h-full min-h-[200px] lg:min-h-[280px]">
              <p className="text-left text-sm font-medium text-gray-500 mb-2">
                Rough work
              </p>
              <textarea
                placeholder="Use this space for calculations (e.g. A=1, B=2 … letter sums, shifts)"
                className="w-full h-[180px] lg:h-[240px] resize-none bg-transparent border-0 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-0 text-sm leading-relaxed"
                readOnly={false}
                spellCheck={false}
              />
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default CodeBreaker;
