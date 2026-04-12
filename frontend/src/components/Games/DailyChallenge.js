import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiAward, FiCheck, FiLock, FiZap, FiTrendingUp } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  getDailyChallengeStreak,
  isDailyChallengeCompletedToday,
  setDailyChallengeCompleted,
  getDailyChallengeProgress,
} from '../../utils/dailyChallengeStorage';

const TOTAL_TASKS = 7;
const FALLBACK = { baseCoins: 5, baseXp: 10, bonusCoinsMax: 10, bonusXpMax: 15 };

const DailyChallenge = ({ onStart }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setStreak(getDailyChallengeStreak());
    setCompletedToday(isDailyChallengeCompletedToday());
    setProgress(getDailyChallengeProgress());
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(updateCountdown, 60000);
    updateCountdown();
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/daily-challenge/status');
      if (response.data.success) {
        setStatus(response.data);
        setCompletedToday(response.data.isCompleted || isDailyChallengeCompletedToday());
      }
    } catch (error) {
      console.error('Error fetching daily challenge status:', error);
      setCompletedToday(isDailyChallengeCompletedToday());
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    setTimeUntilReset(`${hours}h ${minutes}m`);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-warm-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  const canPlay = !completedToday && (status?.canPlay !== false);
  const hasProgress = progress && progress.tasksCompleted > 0 && progress.tasksCompleted < TOTAL_TASKS;

  const handleStart = () => {
    if (!canPlay) {
      toast.error('Daily challenge already completed. Try again tomorrow!');
      return;
    }
    if (onStart) onStart();
  };

  const rr = status?.rewardRules;
  const baseCoins = rr?.baseCoins ?? FALLBACK.baseCoins;
  const baseXp = rr?.baseXp ?? FALLBACK.baseXp;
  const maxBonusCoins = rr?.bonusCoinsMax ?? FALLBACK.bonusCoinsMax;
  const maxBonusXp = rr?.bonusXpMax ?? FALLBACK.bonusXpMax;
  const rewardCoinsMax = rr?.maxCoinsIfCompleted ?? baseCoins + maxBonusCoins;
  const rewardXpMax = rr?.maxXpIfCompleted ?? baseXp + maxBonusXp;

  const coinsAwarded = status?.coinsAwarded ?? 0;
  const xpAwarded = status?.xpAwarded ?? 0;
  const correctAnswers = status?.correctAnswers ?? 0;
  const bonusCoins = Math.max(0, coinsAwarded - baseCoins);
  const bonusXp = Math.max(0, xpAwarded - baseXp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden shadow-lg bg-warm-container border-2 border-warm-border hover:shadow-xl transition-shadow duration-300"
    >
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md">
              🔥
            </div>
            <div>
              <h3 className="text-xl font-bold text-warm-text">Daily Challenge</h3>
              <p className="text-sm text-warm-textSecondary mt-0.5">
                Complete today&apos;s <strong>{TOTAL_TASKS} tasks</strong> in 3 rounds. Rewards use admin settings (base + bonus for correct answers).
              </p>
            </div>
          </div>
          {completedToday ? (
            <div className="bg-orange-100 text-orange-700 rounded-xl p-2.5 shadow-sm">
              <FiCheck className="w-6 h-6" />
            </div>
          ) : (
            <div className="bg-amber-100 text-amber-700 rounded-xl p-2.5 shadow-sm">
              <FiLock className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Progress + Streak side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-4 border border-purple-100 shadow-sm">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-semibold text-warm-text flex items-center gap-1">
                  <FiTrendingUp className="w-4 h-4 text-warm-primary" /> Progress
                </span>
                <span className="text-sm font-bold text-warm-primary">
                  {completedToday ? TOTAL_TASKS : (progress?.tasksCompleted ?? 0)} / {TOTAL_TASKS} tasks
                </span>
              </div>
              <div className="w-full h-2.5 bg-warm-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-warm-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: completedToday ? '100%' : `${Math.min(100, ((progress?.tasksCompleted ?? 0) / TOTAL_TASKS) * 100)}%`
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
            {streak > 0 && (
              <div className="flex items-center justify-center sm:justify-end gap-2 text-amber-600 font-semibold bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-200 shrink-0">
                <span className="text-lg">{'🔥'.repeat(Math.min(streak, 7))}</span>
                <span>{streak} day streak</span>
              </div>
            )}
          </div>

          {/* Rewards + Status in one row on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Rewards */}
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 text-warm-text mb-2">
                <FiAward className="w-5 h-5 text-amber-500" />
                <span className="font-semibold">Rewards</span>
              </div>
              {completedToday && (coinsAwarded > 0 || xpAwarded > 0) ? (
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center text-warm-textSecondary">
                    <span>Completion (base)</span>
                    <span className="font-medium">{baseCoins} coins + {baseXp} XP</span>
                  </div>
                  <div className="flex justify-between items-center text-warm-textSecondary">
                    <span>Correct ({correctAnswers}/{TOTAL_TASKS})</span>
                    <span className="font-medium">+{bonusCoins} coins + {bonusXp} XP</span>
                  </div>
                  <div className="pt-1.5 mt-1.5 border-t border-warm-border flex justify-between items-center">
                    <span className="font-semibold text-warm-text">Total</span>
                    <span className="font-bold text-warm-primary">+{coinsAwarded} coins · +{xpAwarded} XP</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-center sm:text-left">
                  <div>
                    <div className="text-lg font-bold text-primary-600">Up to +{rewardCoinsMax} coins</div>
                    <div className="text-xs text-warm-textSecondary">
                      {baseCoins} base for finishing all tasks + up to {maxBonusCoins} extra for correct answers
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">Up to +{rewardXpMax} XP</div>
                    <div className="text-xs text-warm-textSecondary">
                      {baseXp} base + up to {maxBonusXp} from correct answers
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status: Completed today / Available now */}
            {completedToday ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 text-orange-800 mb-1">
                  <FiCheck className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">Completed today!</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-orange-700">
                  {status?.score != null && status.score > 0 && (
                    <span>Score: <span className="font-bold">{status.score}%</span></span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiClock className="w-3.5 h-3.5" /> Resets in: <span className="font-medium">{timeUntilReset}</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-2 text-blue-800 mb-1">
                  <FiZap className="w-5 h-5 shrink-0" />
                  <span className="font-semibold">Available now</span>
                </div>
                <p className="text-sm text-blue-700">
                  3 rounds · 7 tasks · Hard difficulty
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            disabled={!canPlay}
            className={`w-full btn py-3 rounded-xl font-semibold ${
              canPlay ? 'btn-primary shadow-md hover:shadow-lg' : 'btn-disabled bg-warm-secondary text-warm-textSecondary cursor-not-allowed'
            }`}
          >
            {completedToday ? (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                Completed
              </>
            ) : hasProgress ? (
              <>
                <FiClock className="w-4 h-4 mr-2" />
                Resume Daily Challenge
              </>
            ) : (
              <>
                <FiAward className="w-4 h-4 mr-2" />
                Start Daily Challenge
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default DailyChallenge;
export { setDailyChallengeCompleted };
