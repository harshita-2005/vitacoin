import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import GamePlayer from "./GamePlayer";
import { getDailyChallengeRecipe } from "../../utils/dailyChallengeRecipe";
import { setDailyChallengeProgress, clearDailyChallengeProgress } from "../../utils/dailyChallengeStorage";

const DailyChallengeSession = ({ onComplete, onClose, initialProgress }) => {
  const { rounds, totalTasks } = useMemo(() => getDailyChallengeRecipe(), []);

  const [roundIndex, setRoundIndex] = useState(() => {
    if (initialProgress && Array.isArray(rounds) && initialProgress.roundIndex >= 0 && initialProgress.roundIndex < rounds.length) {
      return initialProgress.roundIndex;
    }
    return 0;
  });
  const [tasksCompleted, setTasksCompleted] = useState(() => initialProgress?.tasksCompleted ?? 0);
  const [roundScores, setRoundScores] = useState(() => initialProgress?.roundScores ?? []);
  const [totalCorrect, setTotalCorrect] = useState(() => initialProgress?.totalCorrect ?? 0);

  const currentRound = rounds[roundIndex];
  const progress = tasksCompleted;

  const game = currentRound
    ? { slug: currentRound.slug, name: currentRound.name, _id: `daily-${currentRound.slug}-${roundIndex}` }
    : null;

  const persistProgress = useCallback((roundIdx, tasks, scores, correct) => {
    setDailyChallengeProgress({
      roundIndex: roundIdx,
      tasksCompleted: tasks,
      roundScores: scores,
      totalCorrect: correct ?? 0,
    });
  }, []);

  useEffect(() => {
    persistProgress(roundIndex, tasksCompleted, roundScores, totalCorrect);
  }, [roundIndex, tasksCompleted, roundScores, totalCorrect, persistProgress]);

  const handleClose = useCallback(() => {
    persistProgress(roundIndex, tasksCompleted, roundScores, totalCorrect);
    onClose?.();
  }, [roundIndex, tasksCompleted, roundScores, totalCorrect, persistProgress, onClose]);

  const handleRoundComplete = (result) => {
    const add = currentRound?.count ?? 1;
    const newTasks = tasksCompleted + add;
    const newScores = [...roundScores, result?.score ?? 0];
    const correctThisRound = Math.max(0, parseInt(result?.correctAnswers, 10) || 0);
    const newTotalCorrect = totalCorrect + correctThisRound;

    if (roundIndex + 1 >= rounds.length) {
      clearDailyChallengeProgress();
      const avgScore = newScores.length ? Math.round(newScores.reduce((a, b) => a + b, 0) / newScores.length) : 0;
      onComplete({
        score: avgScore,
        time: result?.time ?? 0,
        accuracy: result?.accuracy ?? 0,
        roundScores: newScores,
        correctAnswers: newTotalCorrect,
      });
      return;
    }

    setTotalCorrect(newTotalCorrect);
    setRoundScores(newScores);
    setRoundIndex((prev) => prev + 1);
    setTasksCompleted(newTasks);
  };

  if (!currentRound || !game) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daily Challenge</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Round {roundIndex + 1} of {rounds.length} — {currentRound.name} ({currentRound.count} {currentRound.count === 1 ? "task" : "tasks"})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{progress}/{totalTasks}</div>
              <div className="text-xs text-gray-500">completed</div>
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${(progress / totalTasks) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e?.preventDefault?.();
                handleClose();
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <GamePlayer
            key={`${roundIndex}-${currentRound.slug}`}
            game={game}
            difficulty="hard"
            onComplete={handleRoundComplete}
            onClose={handleClose}
            isDailyChallenge
            dailyChallengeTasks={currentRound.count}
            skipMenu
          />
        </div>
      </motion.div>
    </div>
  );
};

export default DailyChallengeSession;
