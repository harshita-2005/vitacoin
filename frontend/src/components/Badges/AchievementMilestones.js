import React from 'react';
import { FiAward, FiTrendingUp } from 'react-icons/fi';

const COIN_GOAL = 100;
const TX_GOAL = 10;

/**
 * Optional quick milestones (First Steps / Active Trader) for dashboard-style previews,
 * optional header action, and optional `children` (e.g. full catalog on Badges page).
 * Set `showMilestones={false}` when children replace the milestones (avoids duplicating catalog badges).
 */
const AchievementMilestones = ({
  user,
  totalTransactions = 0,
  showMilestones = true,
  footer = null,
  headerRight = null,
  children = null
}) => {
  const coins = user?.coinBalance ?? 0;
  const txs = typeof totalTransactions === 'number' ? totalTransactions : 0;

  const coinProgress = Math.min(coins, COIN_GOAL);
  const coinPct = Math.min((coins / COIN_GOAL) * 100, 100);

  const txProgress = Math.min(txs, TX_GOAL);
  const txPct = Math.min((txs / TX_GOAL) * 100, 100);

  return (
    <div className="rounded-xl border shadow-sm transition-all duration-200 bg-warm-container border-warm-border">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-warm-border bg-white/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-warm-text">Achievement Progress</h2>
          <p className="text-warm-textSecondary text-sm mt-0.5">Track your badge progress</p>
        </div>
        {headerRight ? (
          <div className="shrink-0 w-full sm:w-auto sm:max-w-2xl lg:max-w-3xl">{headerRight}</div>
        ) : null}
      </div>
      <div className="px-4 sm:px-6 py-5">
        <div className="space-y-4">
          {showMilestones ? (
            <>
              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-warm-border">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                    <FiAward className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-warm-text">First Steps</p>
                    <p className="text-sm text-warm-textSecondary">Earn your first {COIN_GOAL} coins</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-warm-text">
                    {coinProgress} / {COIN_GOAL}
                  </p>
                  <div className="w-20 h-2 bg-warm-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${coinPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/70 rounded-lg border border-warm-border">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                    <FiTrendingUp className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-warm-text">Active Trader</p>
                    <p className="text-sm text-warm-textSecondary">Complete {TX_GOAL} transactions</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-semibold text-warm-text">
                    {txProgress} / {TX_GOAL}
                  </p>
                  <div className="w-20 h-2 bg-warm-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${txPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : null}

          {children}
        </div>
      </div>

      {footer ? (
        <div className="px-6 py-4 border-t border-warm-border bg-white/60">{footer}</div>
      ) : null}
    </div>
  );
};

export default AchievementMilestones;
