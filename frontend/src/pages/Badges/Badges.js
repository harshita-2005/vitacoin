import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiFilter, FiSearch } from 'react-icons/fi';
import axios from 'axios';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import AchievementMilestones from '../../components/Badges/AchievementMilestones';
import { useAuth } from '../../contexts/AuthContext';

const Badges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [badgeProgress, setBadgeProgress] = useState([]);
  const [recommendedBadges, setRecommendedBadges] = useState([]);
  const [txStats, setTxStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    rarity: ''
  });

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const [badgesRes, userBadgesRes, progressRes, recommendedRes, statsRes] = await Promise.all([
        axios.get('/api/badges'),
        axios.get('/api/badges/user'),
        axios.get('/api/badges/progress'),
        axios.get('/api/badges/recommended'),
        axios.get('/api/transactions/stats')
      ]);

      const raw = badgesRes.data;
      setBadges(Array.isArray(raw) ? raw : raw?.badges || []);
      setUserBadges(userBadgesRes.data?.badges || []);
      setBadgeProgress(progressRes.data?.progress || []);
      setRecommendedBadges(recommendedRes.data?.recommended || []);
      setTxStats(statsRes.data || null);
    } catch (error) {
      console.error('Error fetching badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefreshBadges = async () => {
    try {
      setLoading(true);
      // Check for new badges
      await axios.post('/api/badges/check');
      
      // Refresh all badge data
      await fetchBadges();
    } catch (error) {
      console.error('Error refreshing badges:', error);
    }
  };

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

  const getRarityBorder = (rarity) => {
    const borders = {
      common: 'border-warm-border',
      uncommon: 'border-green-300',
      rare: 'border-blue-300',
      epic: 'border-purple-300',
      legendary: 'border-orange-300'
    };
    return borders[rarity] || borders.common;
  };

  const hasBadge = (badgeId) => {
    return userBadges.some(badge => badge._id === badgeId);
  };

  const totalTransactions = useMemo(
    () => txStats?.totalTransactions ?? txStats?.transactionCount ?? 0,
    [txStats]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredBadges = badges.filter(badge => {
    if (filters.category && badge.category !== filters.category) return false;
    if (filters.rarity && badge.rarity !== filters.rarity) return false;
    return true;
  });

  const catalogEmpty = badges.length === 0;
  const filterEmpty = !catalogEmpty && filteredBadges.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-text">Badges & Achievements</h1>
          <p className="text-warm-textSecondary">
            Track your progress and unlock new achievements
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warm-primary">
                {userBadges.length}
              </div>
              <div className="text-sm text-warm-textSecondary">Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warm-text">
                {badges.length}
              </div>
              <div className="text-sm text-warm-textSecondary">Total</div>
            </div>
            <button
              onClick={handleRefreshBadges}
              className="btn-primary px-4 py-2 text-sm"
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Check for New Badges'}
            </button>
          </div>
        </div>
      </div>

      {/* Same milestones as Dashboard — always visible */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <AchievementMilestones user={user} totalTransactions={totalTransactions} />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-semibold text-warm-text flex items-center">
            <FiFilter className="w-5 h-5 mr-2" />
            Filters
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-text mb-1">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="input"
              >
                <option value="">All Categories</option>
                <option value="achievement">Achievement</option>
                <option value="milestone">Milestone</option>
                <option value="streak">Streak</option>
                <option value="special">Special</option>
                <option value="event">Event</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-text mb-1">
                Rarity
              </label>
              <select
                value={filters.rarity}
                onChange={(e) => handleFilterChange('rarity', e.target.value)}
                className="input"
              >
                <option value="">All Rarities</option>
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recommended Badges */}
      {recommendedBadges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiAward className="w-5 h-5 mr-2 text-primary-600" />
              Recommended for You
            </h3>
            <p className="text-sm text-gray-600">Badges you're close to earning</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedBadges.slice(0, 6).map((badge, index) => (
                <motion.div
                  key={badge._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-warm-container border border-warm-border rounded-lg p-4"
                >
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-2">{badge.icon}</div>
                    <h4 className="font-semibold text-warm-text text-sm">{badge.name}</h4>
                    <p className="text-xs text-warm-textSecondary mt-1">{badge.description}</p>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-warm-textSecondary mb-1">
                      <span>Progress</span>
                      <span>{badge.progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-warm-secondary rounded-full h-2">
                      <div 
                        className="bg-warm-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${badge.progressPercentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-warm-textSecondary mt-1 text-center">
                      {badge.progress} / {badge.maxProgress}
                    </div>
                  </div>

                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(badge.rarity)}`}>
                    {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Badges Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-semibold text-warm-text">
            Available Badges ({filteredBadges.length})
          </h3>
        </div>
        <div className="card-body">
          {catalogEmpty ? (
            <div className="text-center py-10 px-4">
              <FiAward className="w-14 h-14 text-warm-textSecondary mx-auto mb-4 opacity-80" />
              <p className="text-warm-text font-medium text-lg mb-2">No badge catalog loaded</p>
              <p className="text-warm-textSecondary text-sm max-w-lg mx-auto mb-4">
                The database doesn&apos;t have badge definitions yet. Seed them once from the backend folder:
              </p>
              <code className="block text-sm bg-warm-secondary/80 text-warm-text px-4 py-2 rounded-lg max-w-md mx-auto">
                npm run seed-badges
              </code>
              <p className="text-warm-textSecondary text-xs mt-4">
                You can still track <strong>First Steps</strong> and <strong>Active Trader</strong> above. Use{' '}
                <strong>Check for New Badges</strong> after earning rewards.
              </p>
            </div>
          ) : filterEmpty ? (
            <div className="text-center py-12">
              <FiSearch className="w-12 h-12 text-warm-textSecondary mx-auto mb-4" />
              <p className="text-warm-textSecondary text-lg">No badges match these filters</p>
              <p className="text-warm-textSecondary text-sm mt-1">Try &quot;All Categories&quot; and &quot;All Rarities&quot;</p>
            </div>
          ) : filteredBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBadges.map((badge, index) => (
                <motion.div
                  key={badge._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                    hasBadge(badge._id) 
                      ? `${getRarityBorder(badge.rarity)} bg-white` 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {/* Earned indicator */}
                  {hasBadge(badge._id) && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                      <FiAward className="w-5 h-5 text-white" />
                    </div>
                  )}

                  {/* Badge Icon */}
                  <div className="text-center mb-4">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl ${
                      hasBadge(badge._id) ? 'bg-warm-primary' : 'bg-warm-secondary'
                    }`}>
                      {badge.icon}
                    </div>
                  </div>

                  {/* Badge Info */}
                  <div className="text-center">
<h4 className="font-semibold text-warm-text mb-2">
                    {badge.name}
                  </h4>
                  <p className="text-sm text-warm-textSecondary mb-3">
                      {badge.description}
                    </p>

                    {/* Rarity Badge */}
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${getRarityColor(badge.rarity)}`}>
                      {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                    </div>

                    {/* Requirements */}
                    {badge.requirements && (
                      <div className="text-xs text-warm-textSecondary space-y-1">
                        {badge.requirements.coinsRequired > 0 && (
                          <div>Requires {badge.requirements.coinsRequired} coins</div>
                        )}
                        {badge.requirements.tasksCompleted > 0 && (
                          <div>Complete {badge.requirements.tasksCompleted} tasks</div>
                        )}
                        {badge.requirements.loginStreak > 0 && (
                          <div>{badge.requirements.loginStreak} day login streak</div>
                        )}
                      </div>
                    )}

                    {/* Progress Bar for Unearned Badges */}
                    {!hasBadge(badge._id) && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-warm-textSecondary mb-1">
                          <span>Progress</span>
                          <span>
                            {(() => {
                              const progress = badgeProgress.find(p => p.badge._id === badge._id);
                              return progress ? `${progress.progressPercentage}%` : '0%';
                            })()}
                          </span>
                        </div>
                        <div className="w-full bg-warm-secondary rounded-full h-2">
                          <div 
                            className="bg-warm-primary h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: (() => {
                                const progress = badgeProgress.find(p => p.badge._id === badge._id);
                                return progress ? `${progress.progressPercentage}%` : '0%';
                              })()
                            }}
                          />
                        </div>
                        <div className="text-xs text-warm-textSecondary mt-1 text-center">
                          {(() => {
                            const progress = badgeProgress.find(p => p.badge._id === badge._id);
                            if (progress) {
                              return `${progress.progress} / ${progress.maxProgress}`;
                            }
                            return '0 / 1';
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Rewards */}
                    {badge.rewards && badge.rewards.coins > 0 && (
                      <div className="mt-3 pt-3 border-t border-warm-border">
                        <div className="text-xs text-warm-textSecondary">
                          Reward: {badge.rewards.coins} coins
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="mt-3">
                      {hasBadge(badge._id) ? (
                        <span className="text-success-600 text-sm font-medium">
                          ✓ Earned
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Not earned yet
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export default Badges;
