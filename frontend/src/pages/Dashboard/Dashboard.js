import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiAward, FiActivity, FiPlay, FiMinus, FiLogOut, FiGift, FiCreditCard, FiShoppingCart, FiRepeat, FiStar } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import CoinDisplay from '../../components/UI/CoinDisplay';
import AchievementMilestones from '../../components/Badges/AchievementMilestones';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refetch when user returns to this tab so Recent Coin Activity stays up to date
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchDashboardData();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Refetch when balance changes (earned/spent elsewhere) so dashboard and recent transactions update
  const prevBalanceRef = React.useRef(undefined);
  useEffect(() => {
    const balance = user?.coinBalance;
    if (balance == null) return;
    if (prevBalanceRef.current === undefined) {
      prevBalanceRef.current = balance;
      return;
    }
    if (prevBalanceRef.current !== balance) {
      prevBalanceRef.current = balance;
      fetchDashboardData();
    }
  }, [user?.coinBalance]);

  // Listen for real-time updates
  useEffect(() => {
    if (socket) {
      // Listen for balance updates
      socket.on('balance_updated', () => {
        fetchDashboardData();
      });

      // Listen for transaction updates
      socket.on('transactions_data', () => {
        fetchDashboardData();
      });

      return () => {
        socket.off('balance_updated');
        socket.off('transactions_data');
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, transactionsRes] = await Promise.all([
        api.get('/api/transactions/stats'),
        api.get('/api/transactions?limit=5')
      ]);

      setStats(statsRes.data);
      setRecentTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh dashboard data
  const refreshDashboard = () => {
    fetchDashboardData();
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'earn':
      case 'bonus':
        return <FiTrendingUp className="w-5 h-5 text-green-600" />;
      case 'deduct':
      case 'penalty':
        return <FiMinus className="w-5 h-5 text-red-600" />;
      case 'transfer':
        return <FiActivity className="w-5 h-5 text-blue-600" />;
      default:
        return <FiActivity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'earn':
      case 'bonus':
        return 'text-green-600';
      case 'deduct':
      case 'penalty':
        return 'text-red-500';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-slate-600';
    }
  };

  const getTransactionSign = (type) => {
    switch (type) {
      case 'earn':
      case 'bonus':
        return '+';
      case 'deduct':
      case 'penalty':
        return '-';
      default:
        return '';
    }
  };

  const formatTransactionAmount = (transaction) => {
    const amount = Math.abs(transaction.amount);
    const sign = getTransactionSign(transaction.type);
    return `${sign}${amount}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <div className="space-y-10">
        {/* Welcome - centered, Vercel-style typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative flex flex-col items-center justify-center gap-6 py-4 pr-0 sm:pr-32"
        >
          <div className="flex flex-col items-center justify-center text-center w-full max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-warm-text mb-2">
              Welcome back, {user?.firstName}!
              <span className="ml-2" role="img" aria-label="wave">👋</span>
            </h1>
            <p className="text-base text-warm-textSecondary font-normal leading-relaxed">
              Here&apos;s what&apos;s happening with your Vitacoin account
            </p>
            <span className="inline-block mt-3 h-0.5 w-12 rounded-full bg-indigo-500" aria-hidden />
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
                navigate('/login');
              }
            }}
            className="btn-secondary shrink-0 self-end sm:absolute sm:right-0 sm:top-0"
          >
            <FiLogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </motion.div>

        {/* Stats Cards - white cards, colored icon circles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5"
        >
          {/* Current Balance — stored value / balance */}
          <div className="stats-card">
            <div className="stats-icon !bg-amber-50 !text-amber-600">
              <FiCreditCard className="w-6 h-6" />
            </div>
            <div className="stats-value">
              <CoinDisplay balance={user?.coinBalance || 0} size="sm" />
            </div>
            <div className="stats-label">Current Balance</div>
          </div>

          {/* Total Earned — growth / increase */}
          <div className="stats-card">
            <div className="stats-icon !bg-green-50 !text-green-600">
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <div className="stats-value">
              <CoinDisplay balance={stats?.totalEarned || 0} size="sm" />
            </div>
            <div className="stats-label">Total Earned</div>
          </div>

          {/* Total Spent — spending / purchases */}
          <div className="stats-card">
            <div className="stats-icon !bg-red-50 !text-red-600">
              <FiShoppingCart className="w-6 h-6" />
            </div>
            <div className="stats-value">
              <CoinDisplay balance={Math.abs(stats?.totalDeducted || 0)} size="sm" />
            </div>
            <div className="stats-label">Total Spent</div>
          </div>

          {/* Total XP — same field as leaderboard “Experience” */}
          <div className="stats-card">
            <div className="stats-icon !bg-indigo-50 !text-indigo-600">
              <FiStar className="w-6 h-6" />
            </div>
            <div className="stats-value text-2xl font-semibold text-indigo-700 tracking-tight">
              {(user?.experiencePoints ?? 0).toLocaleString()} <span className="text-lg font-medium text-indigo-500">XP</span>
            </div>
            <div className="stats-label">Total experience</div>
            {user?.userLevel != null && (
              <div className="text-xs text-warm-textSecondary mt-1">Level {user.userLevel}</div>
            )}
          </div>

          {/* Badges Earned — achievement */}
          <div className="stats-card">
            <div className="stats-icon !bg-purple-50 !text-purple-600">
              <FiAward className="w-6 h-6" />
            </div>
            <div className="stats-value">{user?.badgeCount || 0}</div>
            <div className="stats-label">Badges Earned</div>
          </div>

          {/* Total Transactions — activity cycles / operations */}
          <div className="stats-card">
            <div className="stats-icon !bg-blue-50 !text-blue-600">
              <FiRepeat className="w-6 h-6" />
            </div>
            <div className="stats-value">
              {stats?.totalTransactions ?? stats?.transactionCount ?? 0}
            </div>
            <div className="stats-label">Total Transactions</div>
          </div>
        </motion.div>

      {/* Earn Coins - lighter container #F4EFEA; Primary (indigo) / Secondary (warm) / Accent (coffee) */}
      {user?.role !== 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md bg-warm-container border-warm-border"
        >
          <div className="px-6 py-5 border-b border-warm-border bg-white/60">
            <h2 className="text-lg font-semibold text-warm-text">Earn Coins</h2>
            <p className="text-warm-textSecondary text-sm mt-0.5">Complete rounds and play games to earn coins</p>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/play-games" className="flex-1">
                <button type="button" className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg text-white transition-all duration-200 hover:opacity-90" style={{ backgroundColor: '#7B5E4A' }}>
                  <FiPlay className="w-5 h-5 mr-2 text-white" />
                  Play Games
                </button>
              </Link>
              <Link to="/challenges" className="flex-1">
                <button type="button" className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg bg-white border border-warm-border text-warm-text hover:bg-warm-secondary hover:border-warm-primary/30 transition-all duration-200">
                  <FiAward className="w-5 h-5 mr-2 text-warm-primary" />
                  Interview Arena
                </button>
              </Link>
              <Link to="/coupons" className="flex-1">
                <button type="button" className="w-full inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg bg-warm-primary text-white hover:bg-warm-primary/90 transition-all duration-200">
                  <FiGift className="w-5 h-5 mr-2 text-white" />
                  Spend Vitacoins
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Transaction Summary - same warm bar as Earn Coins (#F4EFEA) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md bg-warm-container border-warm-border"
      >
        <div className="px-6 py-5 border-b border-warm-border bg-white/60">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-warm-text">Transaction Summary</h2>
              <p className="text-sm text-warm-textSecondary mt-0.5">Your earning and spending overview</p>
            </div>
            <button
              type="button"
              onClick={refreshDashboard}
              className="btn-secondary px-3 py-2"
              title="Refresh data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Earned — growth */}
            <div className="bg-white/70 rounded-lg p-4 border border-warm-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warm-textSecondary">Total Earned</p>
                  <p className="text-2xl font-semibold text-green-600">
                    <CoinDisplay balance={stats?.totalEarned || 0} size="lg" />
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <FiTrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            {/* Total Spent — purchases */}
            <div className="bg-white/70 rounded-lg p-4 border border-warm-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warm-textSecondary">Total Spent</p>
                  <p className="text-2xl font-semibold text-red-600">
                    <CoinDisplay balance={Math.abs(stats?.totalDeducted || 0)} size="lg" />
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <FiShoppingCart className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
            {/* Net Balance — stored balance */}
            <div className="bg-white/70 rounded-lg p-4 border border-warm-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-warm-textSecondary">Net Balance</p>
                  <p className="text-2xl font-semibold text-amber-600">
                    <CoinDisplay balance={user?.coinBalance || 0} size="lg" />
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <FiCreditCard className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recent Coin Activity - same warm bar as Earn Coins, title in black */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md bg-warm-container border-warm-border"
      >
        <div className="px-6 py-5 border-b border-warm-border bg-white/60">
          <h2 className="text-lg font-semibold text-warm-text">Recent Coin Activity</h2>
          <p className="text-warm-textSecondary text-sm mt-0.5">Your latest activity</p>
        </div>
        <div className="p-0">
          {recentTransactions.length > 0 ? (
            <div className="divide-y divide-warm-border">
              {recentTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-6 hover:bg-warm-container transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-warm-text">{transaction.description}</p>
                      <p className="text-sm text-warm-textSecondary">
                        {new Date(transaction.createdAt).toLocaleDateString()} • {transaction.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${getTransactionColor(transaction.type)}`}>
                      {formatTransactionAmount(transaction)} coins
                    </p>
                    <p className="text-sm text-warm-textSecondary">
                      Balance: <CoinDisplay balance={transaction.balanceAfter} size="xs" />
                    </p>
                    <p className="text-xs text-warm-textSecondary/80">
                      {new Date(transaction.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FiActivity className="w-12 h-12 text-warm-textSecondary mx-auto mb-4" />
              <p className="text-warm-textSecondary">No transactions yet</p>
              <p className="text-sm text-warm-textSecondary/80">Complete rounds, play games, or redeem coupons to see your activity here</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link to="/challenges" className="btn-primary">
                  <FiAward className="w-4 h-4 mr-2" />
                  Interview Arena
                </Link>
                <Link to="/play-games" className="btn-secondary">
                  <FiPlay className="w-4 h-4 mr-2" />
                  Play Games
                </Link>
              </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-warm-border bg-white/60">
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => window.location.href = '/transactions'}
          >
            View All Transactions
          </button>
        </div>
      </motion.div>

      {/* Achievement Progress — shared with Badges page */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="hover:shadow-md transition-shadow duration-200"
      >
        <AchievementMilestones
          user={user}
          totalTransactions={stats?.totalTransactions ?? stats?.transactionCount ?? 0}
          footer={
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => window.location.href = '/badges'}
            >
              View All Badges
            </button>
          }
        />
      </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
