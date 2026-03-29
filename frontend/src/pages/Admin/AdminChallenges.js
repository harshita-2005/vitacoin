import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import axios from 'axios';

const AdminChallenges = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyOverview, setDailyOverview] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadError, setLoadError] = useState('');

  const fetchStats = useCallback(async (isRefresh = false) => {
    setLoadError('');
    if (isRefresh) setRefreshing(true);
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [dailyRes, weeklyRes] = await Promise.all([
        axios.get('/api/admin/daily-challenge/overview', { headers }),
        axios.get('/api/admin/daily-challenge/weekly-summary', { headers })
      ]);
      setDailyOverview(dailyRes.data);
      setWeeklySummary(weeklyRes.data);
    } catch (error) {
      console.error('Error loading challenge stats:', error);
      setLoadError('Could not load statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-warm-border border-t-warm-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-warm-text tracking-tight">Challenge Statistics</h1>
          <p className="text-warm-textSecondary mt-1 max-w-xl">
            View completion data and rewards distributed for the daily challenge.
          </p>
          <p className="text-sm text-warm-textSecondary/90 mt-2">
            Daily challenges are system-generated and cannot be modified.
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={refreshing}
          onClick={() => fetchStats(true)}
          className="inline-flex items-center gap-2 shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium bg-warm-primary text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-opacity"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </motion.button>
      </div>

      {loadError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{loadError}</p>
      )}

      {/* Today — primary coffee accent */}
      <div className="rounded-2xl border border-warm-border bg-warm-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 bg-warm-primary text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiCalendar className="w-5 h-5 opacity-90" />
            Today&apos;s Challenge
          </h2>
          {dailyOverview?.dateUtc && (
            <span className="text-sm tabular-nums bg-white/15 px-3 py-1 rounded-lg">{dailyOverview.dateUtc}</span>
          )}
        </div>

        <div className="p-5 sm:p-6 bg-warm-container/40">
          {!dailyOverview && !loadError && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-9 w-9 border-2 border-warm-border border-t-warm-primary" />
            </div>
          )}

          {dailyOverview && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide mb-2">Rounds</p>
                <ul className="grid sm:grid-cols-3 gap-3">
                  {(dailyOverview.recipe?.rounds || []).map((r, i) => (
                    <li
                      key={`${r.slug}-${i}`}
                      className="rounded-xl border border-warm-border bg-white px-4 py-3 text-center shadow-sm"
                    >
                      <p className="text-xs text-warm-textSecondary">Round {i + 1}</p>
                      <p className="font-semibold text-warm-text">{r.name}</p>
                      <p className="text-sm text-warm-primary font-medium">{r.count} tasks</p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-warm-border bg-warm-secondary/25 px-4 py-4 sm:px-5 sm:py-4">
                <p className="text-xs font-bold text-warm-text uppercase tracking-wide mb-3">Reward rules</p>
                <p className="text-base sm:text-lg md:text-xl text-warm-text leading-snug flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-bold text-warm-text">Base reward:</span>
                    <span className="font-semibold text-warm-primary tabular-nums">
                      {dailyOverview.rewardRules?.baseCoins ?? 5} coins
                    </span>
                  </span>
                  <span className="text-warm-primary/50 font-bold px-0.5 sm:px-1" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-bold text-warm-text">Bonus:</span>
                    <span className="font-semibold text-warm-primary tabular-nums">
                      up to {dailyOverview.rewardRules?.bonusCoinsMax ?? 10} coins
                    </span>
                  </span>
                  <span className="text-warm-primary/50 font-bold px-0.5 sm:px-1" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                    <span className="font-bold text-warm-text">Max reward:</span>
                    <span className="font-semibold text-warm-primary tabular-nums">
                      {dailyOverview.rewardRules?.maxCoinsIfCompleted ?? 15} coins
                    </span>
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-warm-border bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-warm-primary">
                    {dailyOverview.stats?.uniqueParticipants ?? 0}
                  </p>
                  <p className="text-xs text-warm-textSecondary mt-1 font-medium">Completions (Today)</p>
                </div>
                <div className="rounded-xl border border-warm-border bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-warm-primary">
                    {dailyOverview.stats?.completionsLogged ?? 0}
                  </p>
                  <p className="text-xs text-warm-textSecondary mt-1 font-medium">Total Attempts</p>
                </div>
                <div className="rounded-xl border border-warm-border bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-warm-primary">
                    {dailyOverview.stats?.totalCoinsPaid ?? 0}
                  </p>
                  <p className="text-xs text-warm-textSecondary mt-1 font-medium">Rewards Distributed</p>
                </div>
              </div>

              {dailyOverview.correctAnswerBreakdown?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide mb-2">
                    Correct answers
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dailyOverview.correctAnswerBreakdown.map((row) => (
                      <span
                        key={String(row.correctAnswers)}
                        className="text-xs bg-warm-secondary/30 border border-warm-border rounded-full px-3 py-1 text-warm-text"
                      >
                        {row.correctAnswers == null ? '—' : `${row.correctAnswers} correct`} · {row.completions}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {dailyOverview.topParticipants?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide mb-2">
                    Top earners
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-warm-border bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-warm-container text-left text-warm-textSecondary">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold">#</th>
                          <th className="px-3 py-2.5 font-semibold">User</th>
                          <th className="px-3 py-2.5 font-semibold">Email</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Coins</th>
                        </tr>
                      </thead>
                      <tbody className="text-warm-text">
                        {dailyOverview.topParticipants.map((p, idx) => (
                          <tr key={p.userId || idx} className="border-t border-warm-border hover:bg-warm-container/50">
                            <td className="px-3 py-2 text-warm-textSecondary">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium">{(p.name || '').trim() || '—'}</td>
                            <td className="px-3 py-2 text-warm-textSecondary truncate max-w-[200px]">
                              {p.email || '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-warm-primary">{p.totalCoins}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Week — secondary coffee accent */}
      <div className="rounded-2xl border border-warm-border bg-warm-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 bg-warm-secondary/35 border-b border-warm-border">
          <h2 className="text-lg font-semibold text-warm-text flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-warm-primary" />
            Weekly Summary
          </h2>
          {weeklySummary?.weekUtcStart && (
            <span className="text-sm text-warm-textSecondary tabular-nums font-medium">
              {weeklySummary.weekUtcStart} — {weeklySummary.weekUtcEndExclusive}
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 bg-warm-container/40">
          {weeklySummary && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-warm-border bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-warm-primary">{weeklySummary.stats?.uniqueParticipants ?? 0}</p>
                  <p className="text-xs text-warm-textSecondary mt-1 font-medium">Active users</p>
                </div>
                <div className="rounded-xl border border-warm-border bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-warm-primary">{weeklySummary.stats?.completionsLogged ?? 0}</p>
                  <p className="text-xs text-warm-textSecondary mt-1 font-medium">Total attempts</p>
                </div>
                <div className="rounded-xl border border-warm-border bg-white p-4 text-center shadow-sm">
                  <p className="text-2xl font-bold text-warm-primary">{weeklySummary.stats?.totalCoinsPaid ?? 0}</p>
                  <p className="text-xs text-warm-textSecondary mt-1 font-medium">Rewards distributed</p>
                </div>
              </div>

              {weeklySummary.byDay?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide mb-2">
                    Daily breakdown
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-warm-border bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-warm-container text-left text-warm-textSecondary">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold">Date</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Attempts</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Users</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Coins</th>
                        </tr>
                      </thead>
                      <tbody className="text-warm-text">
                        {weeklySummary.byDay.map((row) => (
                          <tr key={row.date} className="border-t border-warm-border hover:bg-warm-container/50">
                            <td className="px-3 py-2 tabular-nums">{row.date}</td>
                            <td className="px-3 py-2 text-right">{row.completions}</td>
                            <td className="px-3 py-2 text-right">{row.uniqueParticipants}</td>
                            <td className="px-3 py-2 text-right font-semibold text-warm-primary">{row.coins}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {weeklySummary.topParticipants?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wide mb-2">
                    Top earners
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-warm-border bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-warm-container text-left text-warm-textSecondary">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold">#</th>
                          <th className="px-3 py-2.5 font-semibold">User</th>
                          <th className="px-3 py-2.5 font-semibold">Email</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Coins</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Completions</th>
                        </tr>
                      </thead>
                      <tbody className="text-warm-text">
                        {weeklySummary.topParticipants.map((p, idx) => (
                          <tr key={p.userId || idx} className="border-t border-warm-border hover:bg-warm-container/50">
                            <td className="px-3 py-2 text-warm-textSecondary">{idx + 1}</td>
                            <td className="px-3 py-2 font-medium">{(p.name || '').trim() || '—'}</td>
                            <td className="px-3 py-2 text-warm-textSecondary truncate max-w-[180px]">
                              {p.email || '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-warm-primary">{p.totalCoins}</td>
                            <td className="px-3 py-2 text-right text-warm-textSecondary">{p.completions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChallenges;
