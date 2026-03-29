import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import AchievementMilestones from '../../components/Badges/AchievementMilestones';
import { getRarityLabel } from '../../utils/badgeRarity';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

/** Puts Getting Started first, First Steps second; remaining badges follow A–Z by name. */
const BADGE_NAME_ORDER = ['getting started', 'first steps'];

const sortBadgesForDisplay = (list) => {
  if (!list?.length) return [];
  const priority = (name) => {
    const n = String(name || '').trim().toLowerCase();
    const i = BADGE_NAME_ORDER.indexOf(n);
    return i === -1 ? BADGE_NAME_ORDER.length : i;
  };
  return [...list].sort((a, b) => {
    const pa = priority(a.name);
    const pb = priority(b.name);
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
};

const Badges = () => {
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [badgeProgress, setBadgeProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all');
  /** 'all' or backend rarity key (common…epic); UI labels use metal tiers via getRarityLabel. */
  const [rarityFilter, setRarityFilter] = useState('all');

  const fetchBadges = useCallback(async ({ showFullPageLoader = true, syncAwards = false } = {}) => {
    try {
      if (showFullPageLoader) setLoading(true);
      if (syncAwards) {
        try {
          await axios.post('/api/badges/check', {}, authHeaders());
        } catch (e) {
          console.warn('Badge sync:', e);
        }
      }

      const [badgesRes, userBadgesRes, progressRes] = await Promise.all([
        axios.get('/api/badges', authHeaders()),
        axios.get('/api/badges/user', authHeaders()),
        axios.get('/api/badges/progress', authHeaders())
      ]);

      const raw = badgesRes.data;
      setBadges(Array.isArray(raw) ? raw : raw?.badges || []);
      setUserBadges(userBadgesRes.data?.badges || []);
      setBadgeProgress(progressRes.data?.progress || []);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error(error.response?.data?.error || 'Could not load badges');
    } finally {
      if (showFullPageLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadges({ showFullPageLoader: true, syncAwards: true });
  }, [fetchBadges]);

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-gray-100 text-gray-800',
      uncommon: 'bg-green-100 text-green-800',
      rare: 'bg-blue-100 text-blue-800',
      epic: 'bg-purple-100 text-purple-800',
      legendary: 'bg-orange-100 text-orange-800'
    };
    return colors[rarity] || colors.common;
  };

  const earnedIdSet = useMemo(() => {
    const set = new Set();
    (userBadges || []).forEach((b) => {
      if (b && b._id) set.add(String(b._id));
    });
    return set;
  }, [userBadges]);

  const hasBadge = (badgeId) => earnedIdSet.has(String(badgeId));

  const getProgressForBadge = useCallback(
    (badgeId) => badgeProgress.find((x) => x.badge && String(x.badge._id) === String(badgeId)),
    [badgeProgress]
  );

  const displayedBadges = useMemo(() => {
    let raw = view === 'earned' ? badges.filter((b) => earnedIdSet.has(String(b._id))) : badges;
    if (rarityFilter !== 'all') {
      raw = raw.filter((b) => String(b.rarity || 'common').toLowerCase() === rarityFilter);
    }
    return sortBadgesForDisplay(raw);
  }, [badges, view, earnedIdSet, rarityFilter]);

  const selectClass =
    'input w-full min-w-0 text-sm font-medium text-warm-text border-warm-border rounded-lg py-2.5 pr-8 bg-white shadow-sm';

  const filterBar = (
    <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-0">
      <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-stretch sm:justify-end sm:gap-3">
        <label className="block w-full sm:min-w-[200px] sm:max-w-[240px]">
          <span className="sr-only">Show earned or all catalog badges</span>
          <select value={view} onChange={(e) => setView(e.target.value)} className={selectClass}>
            <option value="all">View all badges</option>
            <option value="earned">Earned badges</option>
          </select>
        </label>
        <label
          className="block w-full sm:min-w-[180px] sm:max-w-[220px]"
          title="Tier shows how exclusive a badge is: Bronze (easiest), then Silver, Gold, and Platinum (hardest)."
        >
          <span className="sr-only">Filter by badge tier</span>
          <select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className={selectClass}>
            <option value="all">All tiers</option>
            <option value="common">Bronze</option>
            <option value="uncommon">Silver</option>
            <option value="rare">Gold</option>
            <option value="epic">Platinum</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-warm-textSecondary sm:text-right max-w-xl sm:ml-auto leading-snug">
        <span className="font-medium text-warm-text">Tier</span> is how exclusive a badge is—{' '}
        <span className="whitespace-nowrap">Bronze</span> is the easiest, then{' '}
        <span className="whitespace-nowrap">Silver</span>, <span className="whitespace-nowrap">Gold</span>, and{' '}
        <span className="whitespace-nowrap">Platinum</span>.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-warm-text mb-2">🏅 Badges & Achievements</h1>
        <p className="text-lg text-warm-textSecondary">
          Track milestones, unlock badges, and see everything you&apos;ve earned in one place
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <AchievementMilestones showMilestones={false} headerRight={filterBar}>
          <>
            {badges.length === 0 ? (
              <p className="text-warm-textSecondary text-sm text-center py-6">
                No badges in the database yet. From the{' '}
                <code className="text-xs bg-warm-secondary px-1.5 py-0.5 rounded">backend</code> folder run{' '}
                <code className="text-xs bg-warm-secondary px-1.5 py-0.5 rounded">npm run seed-badges</code>, then refresh.
              </p>
            ) : view === 'earned' && displayedBadges.length === 0 ? (
              <p className="text-warm-textSecondary text-center py-8 text-sm">
                You haven&apos;t unlocked any catalog badges yet. Choose <strong>View all badges</strong> above to see
                goals.
              </p>
            ) : displayedBadges.length === 0 ? (
              <p className="text-warm-textSecondary text-center py-8 text-sm">
                No badges match this tier. Choose <strong>All tiers</strong> above to see every badge.
              </p>
            ) : (
              displayedBadges.map((badge, index) => {
                const earned = hasBadge(badge._id);
                const p = getProgressForBadge(badge._id);
                const pct = earned ? 100 : Math.min(100, p?.progressPercentage ?? 0);
                const maxP = p?.maxProgress ?? 1;
                const curP = earned ? maxP : p?.progress ?? 0;
                const showFraction = maxP > 0;

                return (
                  <motion.div
                    key={badge._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`flex items-center justify-between p-4 bg-white/70 rounded-lg border transition-all duration-200 ${
                      earned ? 'border-green-200/90 ring-1 ring-green-100/80' : 'border-warm-border'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 text-base leading-none">
                        {badge.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-warm-text">{badge.name}</p>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${getRarityColor(
                              badge.rarity
                            )}`}
                          >
                            {getRarityLabel(badge.rarity)}
                          </span>
                        </div>
                        <p className="text-sm text-warm-textSecondary mt-0.5">{badge.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-semibold ${earned ? 'text-green-600' : 'text-warm-text'}`}>
                        {earned ? 'Earned' : showFraction ? `${curP} / ${maxP}` : '—'}
                      </p>
                      <div className="w-20 h-2 bg-warm-secondary rounded-full overflow-hidden ml-auto">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            earned ? 'bg-green-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </>
        </AchievementMilestones>
      </motion.div>
    </div>
  );
};

export default Badges;
