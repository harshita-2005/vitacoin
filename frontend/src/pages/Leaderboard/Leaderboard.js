import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiCalendar, FiClock, FiStar, FiAward } from 'react-icons/fi';
import axios from 'axios';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState('overall');
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState({});
  const [sortBy, setSortBy] = useState('coins');
  const [currentPeriod, setCurrentPeriod] = useState('');

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = '/api/leaderboard';
      
      if (activeTab === 'daily') {
        endpoint = '/api/leaderboard/daily';
        if (currentPeriod) {
          endpoint += `?date=${currentPeriod}`;
        }
      } else if (activeTab === 'weekly') {
        endpoint = '/api/leaderboard/weekly';
        if (currentPeriod) {
          endpoint += `?week=${currentPeriod}`;
        }
      } else if (activeTab === 'monthly') {
        endpoint = '/api/leaderboard/monthly';
        if (currentPeriod) {
          endpoint += `?month=${currentPeriod}`;
        }
      } else {
        endpoint += `?sortBy=${sortBy}`;
      }

      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.status === 200) {
        setLeaderboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, sortBy, currentPeriod]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  const getPeriodOptions = () => {
    if (activeTab === 'daily') {
      const options = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        options.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
      return options;
    } else if (activeTab === 'weekly') {
      const options = [];
      for (let i = 0; i < 4; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekNum = Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7);
        const year = weekStart.getFullYear();
        options.push({
          value: `${year}-W${weekNum}`,
          label: `Week ${weekNum}, ${year}`
        });
      }
      return options;
    } else if (activeTab === 'monthly') {
      const options = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        options.push({
          value: `${year}-${String(month).padStart(2, '0')}`,
          label: date.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })
        });
      }
      return options;
    }
    return [];
  };



  const getSortOptions = () => {
    if (activeTab === 'overall') {
      return [
        { value: 'coins', label: 'Coins', icon: FiAward },
        { value: 'experience', label: 'Experience', icon: FiStar },
        { value: 'tasks', label: 'Tasks', icon: FiAward },
        { value: 'badges', label: 'Badges', icon: FiAward }
      ];
    } else {
      return [
        { value: 'coins', label: 'Coins', icon: FiAward },
        { value: 'tasks', label: 'Tasks', icon: FiAward },
        { value: 'experience', label: 'Experience', icon: FiStar }
      ];
    }
  };

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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-warm-text mb-2">
          🏆 Leaderboard
        </h1>
        <p className="text-lg text-warm-textSecondary">
          Compete with other players and climb the rankings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: 'overall', name: 'Overall', icon: FiTrendingUp },
          { id: 'daily', name: 'Daily', icon: FiCalendar },
          { id: 'weekly', name: 'Weekly', icon: FiClock },
          { id: 'monthly', name: 'Monthly', icon: FiStar }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPeriod('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-warm-primary text-white shadow-lg'
                  : 'bg-white text-warm-textSecondary hover:bg-warm-container shadow-md border border-warm-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Period Selector */}
      {activeTab !== 'overall' && (
        <div className="flex justify-center">
          <div className="bg-white rounded-xl shadow-md p-4">
            <label className="block text-sm font-medium text-warm-text mb-2">
              Select {activeTab === 'daily' ? 'Date' : activeTab === 'weekly' ? 'Week' : 'Month'}
            </label>
            <select
              value={currentPeriod}
              onChange={(e) => setCurrentPeriod(e.target.value)}
              className="px-3 py-2 border border-warm-border rounded-lg focus:ring-2 focus:ring-warm-primary focus:border-transparent"
            >
              <option value="">Current {activeTab === 'daily' ? 'Day' : activeTab === 'weekly' ? 'Week' : 'Month'}</option>
              {getPeriodOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sort Options */}
      {activeTab === 'overall' && (
        <div className="flex justify-center">
          <div className="bg-white rounded-xl shadow-md p-4">
            <label className="block text-sm font-medium text-warm-text mb-2">Sort By</label>
            <div className="flex gap-2">
              {getSortOptions().map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
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
      )}

      {/* Leaderboard Content */}
      <div className="mt-8">
        {activeTab === 'overall' && leaderboardData.users && (
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
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(index + 1)}`}>
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
                      {sortBy === 'coins' && user.coinBalance}
                      {sortBy === 'experience' && user.experience}
                      {sortBy === 'tasks' && user.totalTasks}
                      {sortBy === 'badges' && user.totalBadges}
                    </div>
                    <div className="text-sm text-warm-textSecondary capitalize">
                      {sortBy === 'coins' && 'Coins'}
                      {sortBy === 'experience' && 'Experience'}
                      {sortBy === 'tasks' && 'Tasks'}
                      {sortBy === 'badges' && 'Badges'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {(activeTab === 'daily' || activeTab === 'weekly' || activeTab === 'monthly') && leaderboardData.stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {leaderboardData.stats.map((stat, index) => (
              <motion.div
                key={stat._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(index + 1)}`}>
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-warm-text">
                        {stat.firstName} {stat.lastName}
                      </h3>
                      <p className="text-warm-textSecondary">@{stat.username}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-warm-primary">
                      {sortBy === 'coins' && stat[`${activeTab}Coins`]}
                      {sortBy === 'tasks' && stat[`${activeTab}Tasks`]}
                      {sortBy === 'experience' && stat[`${activeTab}Experience`]}
                    </div>
                    <div className="text-sm text-warm-textSecondary capitalize">
                      {sortBy === 'coins' && 'Coins'}
                      {sortBy === 'tasks' && 'Tasks'}
                      {sortBy === 'experience' && 'Experience'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {leaderboardData.pagination && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => fetchLeaderboardData(leaderboardData.pagination.current - 1)}
              disabled={!leaderboardData.pagination.hasPrev}
              className="px-4 py-2 bg-white border border-warm-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-container"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-warm-text">
              Page {leaderboardData.pagination.current} of {leaderboardData.pagination.total}
            </span>
            <button
              onClick={() => fetchLeaderboardData(leaderboardData.pagination.current + 1)}
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
