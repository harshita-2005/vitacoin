import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiStar, FiTarget, FiLayers } from 'react-icons/fi';
import api from '../../api/axios';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Leaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState({});
  const [sortBy, setSortBy] = useState('coins');
  const [page, setPage] = useState(1);

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = `/api/leaderboard?sortBy=${sortBy}&page=${page}&limit=50`;

      const response = await api.get(endpoint);

      if (response.status === 200) {
        setLeaderboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, page]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const sortOptions = [
    { value: 'coins', label: 'Coins', suffix: 'Coins', icon: FiAward, pick: (u) => u.coinBalance },
    { value: 'experience', label: 'Experience', suffix: 'XP', icon: FiStar, pick: (u) => u.experiencePoints },
    { value: 'tasks', label: 'Games played', suffix: 'games', icon: FiTarget, pick: (u) => u.gamesPlayedTotal },
    { value: 'badges', label: 'Badges', suffix: 'badges', icon: FiLayers, pick: (u) => u.totalBadges }
  ];

  const activeSort = sortOptions.find((o) => o.value === sortBy) || sortOptions[0];

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-100';
    if (rank === 2) return 'text-gray-600 bg-gray-100';
    if (rank === 3) return 'text-orange-600 bg-orange-100';
    return 'text-gray-500 bg-gray-50';
  };

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
        <h1 className="text-4xl font-bold text-warm-text mb-2">🏆 Leaderboard</h1>
        <p className="text-lg text-warm-textSecondary">Compete with other players and climb the rankings</p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white rounded-xl shadow-md p-4">
          <label className="block text-sm font-medium text-warm-text mb-2">Sort by</label>
          <div className="flex flex-wrap gap-2 justify-center">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setSortBy(option.value);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-warm-primary text-white'
                      : 'bg-warm-container text-warm-textSecondary hover:bg-warm-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8">
        {leaderboardData.users && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {leaderboardData.users.map((user, index) => (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(index + 1)}`}
                    >
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-warm-text">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-warm-textSecondary">@{user.username}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-warm-primary">
                      {activeSort.pick(user) ?? 0}
                    </div>
                    <div className="text-sm text-warm-textSecondary capitalize">{activeSort.suffix}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {leaderboardData.pagination && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!leaderboardData.pagination.hasPrev}
              className="px-4 py-2 bg-white border border-warm-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-container"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-warm-text">
              Page {leaderboardData.pagination.current} of {leaderboardData.pagination.total}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!leaderboardData.pagination.hasNext}
              className="px-4 py-2 bg-white border border-warm-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-container"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
