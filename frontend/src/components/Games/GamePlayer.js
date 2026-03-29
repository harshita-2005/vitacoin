import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { FiX, FiPlay, FiPause } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";

import MathQuiz from "./MathQuiz";
import WordScramble from "./WordScramble";
import CodeBreaker from "./CodeBreaker";
import PuzzleSolver from "./PuzzleSolver";
import VerbalIQ from "./VerbalIQ";
import { getDifficultyBarEntries } from "../../utils/gameRewardPreview";

const GamePlayer = ({
  game,
  challenge,
  onComplete,
  onClose,
  difficulty = "easy",
  isDailyChallenge = false,
  dailyChallengeTasks,
  skipMenu = false,
}) => {
  const effectiveDifficulty = isDailyChallenge ? "hard" : difficulty;
  const [gameState, setGameState] = useState(skipMenu ? "playing" : "menu");
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [gameTimer, setGameTimer] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [gameResetKey, setGameResetKey] = useState(0);
  const completionSentRef = useRef(false);

  const difficultyBar = useMemo(() => getDifficultyBarEntries(game), [game]);

  /* ---------------- CLEANUP ---------------- */
  useEffect(() => {
    return () => {
      if (gameTimer) clearInterval(gameTimer);
    };
  }, [gameTimer]);

  /* ---------------- AUTO-START FOR DAILY CHALLENGE ---------------- */
  useEffect(() => {
    if (!skipMenu) return;
    setGameResetKey((prev) => prev + 1);
    setStartTime(Date.now());
    const timer = setInterval(() => setTime((prev) => prev + 1), 1000);
    setGameTimer(timer);
    axios
      .post("/api/game/start", { game: game.slug || game._id, difficulty: effectiveDifficulty })
      .catch(() => {});
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when skipMenu
  }, []);

  /* ---------------- START GAME ---------------- */
  const startGame = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    // Immediately switch UI into playing mode for snappy feedback
    if (gameTimer) clearInterval(gameTimer);

    completionSentRef.current = false;
    setGameResetKey((prev) => prev + 1);
    setGameState("playing");
    setScore(0);
    setTime(0);
    setAccuracy(0);
    setStartTime(Date.now());

    // Start overall session timer
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    setGameTimer(timer);

    // Fire-and-forget backend start call so UI never gets stuck
    const payload = {
      game: game.slug || game._id,
      difficulty,
    };

    axios
      .post("/api/game/start", payload)
      .then(() => {
        // no-op on success
      })
      .catch((error) => {
        const msg =
          error.response?.data?.error ||
          error.response?.data?.errors?.[0] ||
          "Unable to start game.";
        toast.error(msg);
        console.error("Game start error:", error);
      });
  };

  /* ---------------- RESTART ---------------- */
  const restartGame = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    // Restart the current game locally without creating a new backend "start" record.
    if (gameTimer) {
      clearInterval(gameTimer);
    }

    completionSentRef.current = false;
    setGameResetKey((prev) => prev + 1);
    setGameState("playing");
    setScore(0);
    setTime(0);
    setAccuracy(0);
    setStartTime(Date.now());

    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    setGameTimer(timer);
  };

  /* ---------------- PAUSE ---------------- */
  const pauseGame = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setGameState("paused");
    if (gameTimer) {
      clearInterval(gameTimer);
      setGameTimer(null);
    }
  };

  /* ---------------- RESUME ---------------- */
  const resumeGame = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (gameTimer) clearInterval(gameTimer);

    setGameState("playing");
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    setGameTimer(timer);
  };

  /* ---------------- END GAME ---------------- */
  const endGame = (finalScore, finalAccuracy) => {
    if (gameTimer) {
      clearInterval(gameTimer);
      setGameTimer(null);
    }

    setGameState("completed");
    setScore(finalScore);
    setAccuracy(finalAccuracy);

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    setTime(totalTime);

    return totalTime;
  };

  /* ---------------- GAME COMPLETE ---------------- */
  const handleGameComplete = async (result) => {
    if (completionSentRef.current) return;
    completionSentRef.current = true;

    const totalTime = endGame(result.score, result.accuracy);
    const finalResult = { ...result, time: totalTime };

    if (isDailyChallenge) {
      onComplete?.(finalResult);
      return;
    }

    // Submission to /api/game/play is done by the parent (e.g. PlayGames) to avoid double posts.
    onComplete?.(finalResult);
  };

  /* ---------------- SCORE UPDATE ---------------- */
  const handleScoreUpdate = useCallback((newScore, newAccuracy) => {
    setScore(newScore);
    if (newAccuracy !== undefined) {
      setAccuracy(newAccuracy);
    }
  }, []);

  /* ---------------- RENDER GAME ---------------- */
  const renderGameComponent = () => {
    const adminQuestionCount =
      typeof game?.gameConfig?.questionCount === "number" && game.gameConfig.questionCount > 0
        ? game.gameConfig.questionCount
        : undefined;

    const gameProps = {
      onComplete: handleGameComplete,
      onPause: pauseGame,
      isPaused: gameState === "paused",
      difficulty: effectiveDifficulty,
      onScoreUpdate: handleScoreUpdate,
      resetKey: gameResetKey,
      isDailyChallenge,
      dailyChallengeTasks,
      /** Admin-tuned length when not in daily challenge */
      questionCountOverride: !dailyChallengeTasks && !isDailyChallenge ? adminQuestionCount : undefined,
    };

    switch (game.slug) {
      case "memory-game":
      case "verbal-iq":
        // Use the Verbal IQ game for the old memory-game slot
        return <VerbalIQ key={gameResetKey} {...gameProps} />;
      case "math-quiz":
        return <MathQuiz key={gameResetKey} {...gameProps} />;
      case "word-scramble":
        return <WordScramble key={gameResetKey} {...gameProps} />;
      case "reaction-time":
        return <CodeBreaker key={gameResetKey} {...gameProps} />;
      case "puzzle-solver":
        return <PuzzleSolver key={gameResetKey} {...gameProps} />;
      default:
        return <div className="text-center">Game not implemented</div>;
    }
  };

  /* ---------------- TIME FORMAT ---------------- */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayName =
    game.slug === "memory-game" || game.slug === "verbal-iq"
      ? "Verbal IQ"
      : game.slug === "reaction-time"
        ? "Code Breaker"
        : game.slug === "puzzle-solver"
          ? "Pattern IQ"
          : game.slug === "word-scramble"
            ? "Word Shuffle"
            : game.name;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
          <button
            type="button"
            onClick={(e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              onClose?.();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {gameState === "menu" && !skipMenu && (
            <div className="text-center space-y-6">
              <div className="text-6xl">{game.icon || "🎮"}</div>
              <h3 className="text-2xl font-bold">{displayName}</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={startGame}
                className="btn-primary text-lg px-8 py-3"
              >
                <FiPlay className="w-5 h-5 mr-2" />
                Start Game
              </motion.button>
            </div>
          )}

          {(gameState === "playing" || gameState === "paused") && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-warm-primary">{score}</div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
                {(() => {
                  const d =
                    difficultyBar[effectiveDifficulty] || difficultyBar.easy;
                  return (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${d.bg} ${d.border} ${d.text}`}>
                      <span className="font-semibold text-sm">Difficulty: {d.label}</span>
                      <span className="text-xs opacity-90">• {d.reward}</span>
                      <span className="text-xs opacity-80">(min {d.minScore}%)</span>
                    </div>
                  );
                })()}
                <div className="flex space-x-2">
                  {gameState === "playing" && (
                    <button type="button" onClick={pauseGame} className="btn-outline">
                      <FiPause className="w-4 h-4 mr-2" />
                      Pause
                    </button>
                  )}
                  {gameState === "paused" && (
                    <>
                      <button type="button" onClick={resumeGame} className="btn-primary">
                        <FiPlay className="w-4 h-4 mr-2" />
                        Resume
                      </button>
                      {!isDailyChallenge && (
                        <button type="button" onClick={restartGame} className="btn-outline">
                          Restart
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="relative min-h-[400px] flex items-center justify-center">
                {renderGameComponent()}
              </div>
            </div>
          )}

          {gameState === "completed" && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <h3 className="text-2xl font-bold">Game Complete!</h3>
              <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                <div>
                  <div className="text-3xl font-bold text-warm-primary">{score}</div>
                  <div className="text-sm text-gray-500">Score</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{formatTime(time)}</div>
                  <div className="text-sm text-gray-500">Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{accuracy}%</div>
                  <div className="text-sm text-gray-500">Accuracy</div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={onClose}
                className="btn-primary text-lg px-8 py-3"
              >
                Close
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GamePlayer;