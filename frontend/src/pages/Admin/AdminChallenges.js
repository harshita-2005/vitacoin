import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiRefreshCw, FiTrendingUp, FiEdit2, FiX } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StatMini = ({ value, label, title }) => {
  const num =
    value == null || value === '' ? 0 : typeof value === 'number' ? value : Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  const show = safe.toLocaleString();
  return (
    <div
      title={title}
      className="inline-flex flex-col items-center justify-center shrink-0 rounded-xl border border-warm-border bg-white px-5 py-2.5 text-center shadow-sm min-h-[3.5rem] w-[10.25rem] sm:w-[11rem]"
    >
      <p className="text-sm font-bold text-warm-primary tabular-nums leading-none">{show}</p>
      <p className="text-[11px] text-warm-textSecondary mt-1.5 leading-snug">{label}</p>
    </div>
  );
};

const AdminChallenges = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyOverview, setDailyOverview] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [rewardForm, setRewardForm] = useState({
    baseCoins: 5,
    baseXp: 10,
    bonusCoinsMax: 10,
    bonusXpMax: 15
  });
  const [rewardSaving, setRewardSaving] = useState(false);
  const [rewardRulesEditing, setRewardRulesEditing] = useState(false);
  const [rewardFormSnapshot, setRewardFormSnapshot] = useState(null);

  const fetchStats = useCallback(async (isRefresh = false) => {
    setLoadError('');
    if (isRefresh) setRefreshing(true);
    try {
      const [dailyRes, weeklyRes, rewardRes] = await Promise.all([
        api.get('/api/admin/daily-challenge/overview'),
        api.get('/api/admin/daily-challenge/weekly-summary'),
        api.get('/api/admin/daily-challenge/reward-settings')
      ]);
      setDailyOverview(dailyRes.data);
      setWeeklySummary(weeklyRes.data);
      const rw = rewardRes.data;
      if (rw && typeof rw.baseCoins === 'number') {
        setRewardForm({
          baseCoins: rw.baseCoins,
          baseXp: rw.baseXp,
          bonusCoinsMax: rw.bonusCoinsMax,
          bonusXpMax: rw.bonusXpMax
        });
      }
    } catch (error) {
      console.error('Error loading challenge stats:', error);
      setLoadError('Could not load statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const beginRewardRulesEdit = () => {
    setRewardFormSnapshot({ ...rewardForm });
    setRewardRulesEditing(true);
  };

  const cancelRewardRulesEdit = () => {
    if (rewardFormSnapshot) {
      setRewardForm(rewardFormSnapshot);
    }
    setRewardRulesEditing(false);
    setRewardFormSnapshot(null);
  };

  const saveRewardSettings = async (e) => {
    e?.preventDefault?.();
    setRewardSaving(true);
    try {
      await api.put('/api/admin/daily-challenge/reward-settings', rewardForm);
      toast.success('Daily challenge rewards updated. New values apply to the next completion.');
      setRewardRulesEditing(false);
      setRewardFormSnapshot(null);
      await fetchStats(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save');
    } finally {
      setRewardSaving(false);
    }
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 sm:pr-2">
          <h1 className="text-3xl font-bold text-warm-text tracking-tight">Challenge Statistics</h1>
          <p className="text-warm-textSecondary mt-1">
            View completion stats and tune Vitacoin / XP rewards for the automatic 7-task daily challenge. Round mix is
            still date-seeded; rewards apply to all users on their next run.
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

              <div className="w-full max-w-xl sm:max-w-2xl mx-auto rounded-xl border border-warm-border bg-warm-secondary/25 px-4 py-4 sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-xs font-bold text-warm-text uppercase tracking-wide">Reward rules</p>
                  {!rewardRulesEditing ? (
                    <button
                      type="button"
                      onClick={beginRewardRulesEdit}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-warm-primary hover:bg-warm-primary/10 transition-colors"
                      title="Edit base and bonus coins"
                      aria-label="Edit reward rules"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelRewardRulesEdit}
                        disabled={rewardSaving}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-warm-textSecondary hover:bg-warm-border/40 disabled:opacity-50"
                      >
                        <FiX className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveRewardSettings()}
                        disabled={rewardSaving}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-warm-primary text-white hover:opacity-95 disabled:opacity-50"
                      >
                        {rewardSaving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                {!rewardRulesEditing ? (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[11px] font-medium text-warm-textSecondary uppercase tracking-wide mb-1">
                        Base coins
                      </p>
                      <p className="text-xl font-bold text-warm-primary tabular-nums">
                        {dailyOverview.rewardRules?.baseCoins ?? rewardForm.baseCoins}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-warm-textSecondary uppercase tracking-wide mb-1">
                        Bonus coins
                      </p>
                      <p className="text-xl font-bold text-warm-primary tabular-nums">
                        {dailyOverview.rewardRules?.bonusCoinsMax ?? rewardForm.bonusCoinsMax}
                      </p>
                      <p className="text-[10px] text-warm-textSecondary mt-0.5">max if all 7 correct</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-warm-textSecondary uppercase tracking-wide mb-1">
                        Max coins
                      </p>
                      <p className="text-xl font-bold text-warm-primary tabular-nums">
                        {dailyOverview.rewardRules?.maxCoinsIfCompleted ??
                          (rewardForm.baseCoins + rewardForm.bonusCoinsMax)}
                      </p>
                      <p className="text-[10px] text-warm-textSecondary mt-0.5">base + bonus</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    <div className="min-w-0 flex flex-col">
                      <label className="block text-[11px] font-medium text-warm-textSecondary mb-1">Base coins</label>
                      <input
                        type="number"
                        min={0}
                        className="input input-bordered w-full min-w-0"
                        value={rewardForm.baseCoins}
                        onChange={(e) =>
                          setRewardForm((p) => ({ ...p, baseCoins: Math.max(0, parseInt(e.target.value, 10) || 0) }))
                        }
                      />
                      <p className="text-[10px] text-warm-textSecondary mt-1 leading-snug min-h-[2.5rem]">
                        Awarded when the challenge is completed
                      </p>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <label className="block text-[11px] font-medium text-warm-textSecondary mb-1">Bonus coins</label>
                      <input
                        type="number"
                        min={0}
                        className="input input-bordered w-full min-w-0"
                        value={rewardForm.bonusCoinsMax}
                        onChange={(e) =>
                          setRewardForm((p) => ({
                            ...p,
                            bonusCoinsMax: Math.max(0, parseInt(e.target.value, 10) || 0)
                          }))
                        }
                      />
                      <p className="text-[10px] text-warm-textSecondary mt-1 leading-snug min-h-[2.5rem]">
                        Extra at full score (7/7)
                      </p>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <label className="block text-[11px] font-medium text-warm-textSecondary mb-1">Max coins</label>
                      <div className="input input-bordered w-full min-w-0 flex items-center justify-center bg-warm-container/50 font-bold text-warm-primary tabular-nums min-h-[3rem]">
                        {rewardForm.baseCoins + rewardForm.bonusCoinsMax}
                      </div>
                      <p className="text-[10px] text-warm-textSecondary mt-1 leading-snug min-h-[2.5rem]">auto</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <StatMini
                  value={dailyOverview.stats?.uniqueParticipants}
                  label="Today's Users"
                  title="Users who completed the challenge today"
                />
                <StatMini
                  value={dailyOverview.stats?.completionsLogged}
                  label="Today's Completions"
                  title="Paid completions logged today (one ledger row per finish)"
                />
                <StatMini
                  value={dailyOverview.stats?.totalCoinsPaid}
                  label="Coins distributed"
                  title="Vitacoins paid out today"
                />
              </div>

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-4 bg-warm-primary text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 opacity-90" />
            Weekly Summary
          </h2>
          {weeklySummary?.weekUtcStart && (
            <span className="text-sm tabular-nums bg-white/15 px-3 py-1 rounded-lg">
              {weeklySummary.weekUtcStart} — {weeklySummary.weekUtcEndExclusive}
            </span>
          )}
        </div>

        <div className="p-5 sm:p-6 bg-warm-container/40">
          {weeklySummary && (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-4 justify-center">
                <StatMini
                  value={weeklySummary.stats?.uniqueParticipants}
                  label="This week's users"
                  title="Users with at least one completion this week"
                />
                <StatMini
                  value={weeklySummary.stats?.completionsLogged}
                  label="This week's completions"
                  title="Paid completions this week"
                />
                <StatMini
                  value={weeklySummary.stats?.totalCoinsPaid}
                  label="This week's coins"
                  title="Vitacoins paid out this week"
                />
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
