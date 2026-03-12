import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { generateVerbalBatch } from "../../utils/verbalEngine";

const VerbalIQ = ({
  onComplete,
  isPaused,
  difficulty = "easy",
  onScoreUpdate,
  resetKey = 0,
  dailyChallengeTasks
}) => {
  const configMap = {
    easy: { totalQuestions: 10, timePerQuestion: 10 },
    medium: { totalQuestions: 20, timePerQuestion: 15 },
    hard: { totalQuestions: 25, timePerQuestion: 18 }
  };
  const base = configMap[difficulty] || configMap.easy;
  const totalQuestions = dailyChallengeTasks ?? base.totalQuestions;
  const timePerQuestion = base.timePerQuestion;

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [time, setTime] = useState(timePerQuestion);
  const [gameActive, setGameActive] = useState(false);

  const timerRef = useRef(null);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  useEffect(() => {
    onScoreUpdateRef.current = onScoreUpdate;
  }, [onScoreUpdate]);

  // Initialize / reset game when difficulty or resetKey changes
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const batch = generateVerbalBatch(totalQuestions, { difficulty, resetKey });

    setQuestions(Array.isArray(batch) ? batch : []);
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setTime(timePerQuestion);
    setGameActive(true);
  }, [difficulty, totalQuestions, timePerQuestion, resetKey]);

  // Per-question countdown timer (pause when isPaused)
  useEffect(() => {
    if (!gameActive || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTime((t) => {
        if (t <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Time's up: advance to next (count as wrong), keep score in sync
          setIndex((prev) => {
            const next = prev + 1;
            setCorrectCount((c) => {
              const total = next;
              const pct = total > 0 ? Math.round((c / total) * 100) : 0;
              onScoreUpdateRef.current?.(pct, pct);
              return c;
            });
            return next;
          });
          return timePerQuestion;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- onScoreUpdate via ref to avoid effect churn
  }, [index, isPaused, gameActive, timePerQuestion]);

  // Reset timer when moving to next question (after user answer)
  useEffect(() => {
    if (gameActive && questions.length && index < questions.length) {
      setTime(timePerQuestion);
    }
  }, [index, gameActive, questions.length, timePerQuestion]);

  // Complete game when all questions answered
  useEffect(() => {
    if (!gameActive || !questions.length) return;
    if (index >= questions.length) {
      const total = questions.length;
      const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      const accuracy = finalScore;

      onComplete?.({
        score: finalScore,
        accuracy,
        correctAnswers: correctCount
      });
      setGameActive(false);
    }
    // totalQuestions omitted: completion is driven by questions.length (actual batch size)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, questions.length, correctCount, gameActive, onComplete]);

  if (!gameActive || !questions.length || index >= questions.length) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 mt-4">
          {index >= questions.length ? "Finalising results..." : "Preparing questions..."}
        </div>
      </div>
    );
  }

  const current = questions[index];

  const handleSelect = (opt) => {
    if (isPaused || selected !== null) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSelected(opt);

    const isCorrect = opt === current.answer;
    const newCorrect = isCorrect ? correctCount + 1 : correctCount;
    const newIndex = index + 1;

    setCorrectCount(newCorrect);

    const rawScore = newIndex > 0 ? (newCorrect / newIndex) * 100 : 0;
    const roundedScore = Math.round(rawScore);

    onScoreUpdateRef.current?.(roundedScore, roundedScore);

    setTimeout(() => {
      setSelected(null);
      setIndex((prev) => prev + 1);
      setTime(timePerQuestion);
    }, 600);
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
          <div className="text-2xl font-bold">{index + 1}/{questions.length}</div>
          <div className="text-xs text-gray-500">QUESTIONS</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-600">{time}s</div>
          <div className="text-xs text-gray-500">TIME</div>
        </div>
      </div>

      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto"
      >
        <h3 className="text-lg font-bold mb-4">
          {current.question}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {current.options.map((opt) => {
            const isSelectedOption = selected === opt;
            const isCorrect = opt === current.answer;

            let border = "border-gray-200";
            let bg = "bg-white hover:bg-indigo-50";

            if (selected !== null) {
              if (isSelectedOption && isCorrect) {
                border = "border-green-500";
                bg = "bg-green-50";
              } else if (isSelectedOption && !isCorrect) {
                border = "border-red-500";
                bg = "bg-red-50";
              } else if (isCorrect) {
                border = "border-green-400";
                bg = "bg-green-50";
              }
            }

            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`border-2 ${border} ${bg} rounded-lg py-3 px-4 text-sm sm:text-base font-semibold transition-colors`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default VerbalIQ;

