import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiRefreshCw, FiDownload } from 'react-icons/fi';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

// Category options only for "Earned" – Puzzle, CS Fundamentals, Daily Login (no Admin, Streak, Achievement)
const EARN_CATEGORIES = [
  { value: 'game_completion', label: 'Puzzle' },
  { value: 'task_completion', label: 'CS Fundamentals' },
  { value: 'daily_login', label: 'Daily Login' },
  { value: 'daily_challenge', label: 'Daily Challenge' }
];

function getCategoryIcon(category) {
  if (!category || category === 'other' || category === 'admin_penalty') return '⚠️';
  switch (category) {
    case 'game_completion': return '🧩';
    case 'task_completion': return '📘';
    case 'daily_login':
    case 'daily_challenge': return '🔥';
    default: return '📌';
  }
}

function getCategoryLabel(category) {
  if (!category) return '—';
  const found = EARN_CATEGORIES.find(c => c.value === category);
  if (found) return found.label;
  if (category === 'admin_penalty' || category === 'other') return 'Penalty';
  return category.replace(/_/g, ' ');
}

/** Slug → display name (must match GamePlayer / PlayGames display names) */
const GAME_DISPLAY_NAMES = {
  'memory-game': 'Verbal IQ',
  'verbal-iq': 'Verbal IQ',
  'math-quiz': 'Math Quiz',
  'word-scramble': 'Word Shuffle',
  'code-breaker': 'Code Breaker',
  'puzzle-solver': 'Pattern IQ',
  'reaction-time': 'Code Breaker'
};

/** Batched MCQ session: "CS Fundamentals – N correct" → "📘 CS Fundamentals" */
function getActivityDisplayText(transaction) {
  const d = transaction.description || '';
  if (d.startsWith('CS Fundamentals –') && d.includes('correct')) {
    return '📘 CS Fundamentals';
  }
  const gameMatch = d.match(/^Game completion: (.+?) \((easy|medium|hard)\)$/i);
  if (gameMatch) {
    const nameOrSlug = gameMatch[1].trim();
    const difficulty = gameMatch[2];
    const slug = nameOrSlug.toLowerCase().replace(/\s+/g, '-');
    const name = GAME_DISPLAY_NAMES[slug] || nameOrSlug;
    return `Game completion: ${name} (${difficulty})`;
  }
  return d;
}

/** For CS Fundamentals batch: return subject list "OS, CN" from metadata or parsed from description */
function getCsFundamentalsSubjectList(transaction) {
  const meta = transaction.metadata || {};
  if (Array.isArray(meta.mcqSubjects) && meta.mcqSubjects.length > 0) {
    return meta.mcqSubjects.join(', ');
  }
  const d = transaction.description || '';
  const match = d.match(/CS Fundamentals – \d+ correct\s*\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',       // '' | 'earned' | 'spent'
    category: '',  // only used when type is '' or 'earned'
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const showCategoryFilter = filters.type !== 'spent';

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      });
      if (filters.type) params.set('type', filters.type);
      if (showCategoryFilter && filters.category) params.set('category', filters.category);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate) params.set('endDate', filters.endDate);

      const response = await api.get(`/api/transactions?${params}`);
      setTransactions(response.data.transactions);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total ?? 0,
        pages: response.data.pagination?.pages ?? 0
      }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.type, filters.category, filters.startDate, filters.endDate, showCategoryFilter]);

  // Refetch when page/filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Refetch when balance changes (e.g. just earned/spent elsewhere in the app) so list updates without refresh
  const prevBalanceRef = useRef(undefined);
  useEffect(() => {
    const balance = user?.coinBalance;
    if (balance == null) return;
    if (prevBalanceRef.current === undefined) {
      prevBalanceRef.current = balance;
      return;
    }
    if (prevBalanceRef.current !== balance) {
      prevBalanceRef.current = balance;
      fetchTransactions();
    }
  }, [user?.coinBalance, fetchTransactions]);

  // Refetch when user returns to this tab so list is up to date (e.g. earned in another tab)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchTransactions();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'type' && value === 'spent') {
        next.category = '';
      }
      return next;
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatTableDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warm-text">Coin Activity</h1>
          <p className="text-warm-textSecondary">Track how you earned and used your coins</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchTransactions}
            className="btn-outline"
          >
            <FiRefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Export
          </motion.button>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-warm-text mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="input"
              >
                <option value="">All</option>
                <option value="earned">Earned</option>
                <option value="spent">Spent</option>
              </select>
            </div>

            {showCategoryFilter && (
              <div>
                <label className="block text-sm font-medium text-warm-text mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="input"
                >
                  <option value="">All</option>
                  {EARN_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-warm-text mb-1">Start date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-warm-text mb-1">End date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="card-header">
          <h3 className="text-lg font-semibold text-warm-text">
            Activity ({pagination.total})
          </h3>
        </div>
        <div className="card-body">
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction, index) => {
                const isEarned = transaction.amount > 0;
                return (
                  <motion.div
                    key={transaction._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
                      isEarned ? 'border-green-200/60 hover:border-green-300/70' : 'border-red-200/60 hover:border-red-300/70'
                    }`}
                  >
                    {/* Left accent bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                        isEarned ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    {/* Date + type badge */}
                    <div className="flex items-center gap-3 sm:w-32 shrink-0 pl-1">
                      <span className="text-sm font-medium text-warm-textSecondary">
                        {formatTableDate(transaction.createdAt)}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isEarned
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isEarned ? 'Earned' : 'Spent'}
                      </span>
                    </div>
                    {/* Activity + category */}
                    <div className="flex-1 min-w-0 pl-1">
                      <p className="font-semibold text-warm-text leading-snug">
                        {getActivityDisplayText(transaction)}
                      </p>
                      {transaction.category === 'task_completion' && (transaction.description || '').includes('CS Fundamentals') && getCsFundamentalsSubjectList(transaction) && (
                        <p className="text-sm text-warm-textSecondary mt-0.5">
                          {getCsFundamentalsSubjectList(transaction)}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        {transaction.amount < 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-warm-textSecondary">
                            <span>⚠️</span>
                            <span>Penalty</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warm-container/80 text-sm font-medium text-warm-text">
                            <span className="text-base">{getCategoryIcon(transaction.category)}</span>
                            <span>{getCategoryLabel(transaction.category)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Amount pill */}
                    <div className="shrink-0 pl-1 sm:pl-0">
                      <div
                        className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl font-bold text-lg ${
                          isEarned
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span>{transaction.amount > 0 ? '+' : ''}{transaction.amount}</span>
                        <span className="text-sm font-medium opacity-90">coins</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warm-container/80 text-warm-textSecondary mb-4">
                <FiFilter className="w-8 h-8" />
              </div>
              <p className="text-warm-text font-semibold text-lg">No activity found</p>
              <p className="text-warm-textSecondary text-sm mt-1">Try adjusting your filters or complete more activities to earn coins.</p>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm text-warm-textSecondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-warm-text">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Transactions;
