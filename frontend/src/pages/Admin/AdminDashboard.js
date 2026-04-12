import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiAward,
  FiTrendingUp,
  FiSettings,
  FiCalendar,
  FiPlay,
  FiLogOut,
  FiDatabase,
  FiPlusCircle,
  FiTarget
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import AdminChallenges from './AdminChallenges';
import AdminGames from './AdminGames';
import AdminUsers from './AdminUsers';
import AdminSettings from './AdminSettings';

const ADMIN_TAB_PATHS = {
  overview: '/admin',
  challenges: '/admin/challenges',
  games: '/admin/games',
  users: '/admin/users',
  data: '/admin/data',
  settings: '/admin/settings'
};

const VALID_ADMIN_SEGMENTS = new Set(['challenges', 'games', 'users', 'data', 'settings']);

function pathnameToAdminTab(pathname) {
  const p = pathname.replace(/\/$/, '') || '/admin';
  if (p === '/admin') return 'overview';
  const parts = p.split('/').filter(Boolean);
  if (parts[0] !== 'admin' || parts.length < 2) return 'overview';
  const seg = parts[1];
  return VALID_ADMIN_SEGMENTS.has(seg) ? seg : null;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [datasetTimestamps, setDatasetTimestamps] = useState({
    verbalLastAt: null,
    codeBreakerLastAt: null
  });
  const [datasetLoading, setDatasetLoading] = useState({ verbal: false, codebreaker: false });
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tab = pathnameToAdminTab(location.pathname);
    if (tab === null) {
      navigate('/admin', { replace: true });
      return;
    }
    setActiveTab(tab);
  }, [location.pathname, navigate]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, dsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/dataset/status', {
          params: { _: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
        })
      ]);
      setStats(statsRes.data);
      const ds = dsRes.data;
      if (ds && typeof ds === 'object') {
        setDatasetTimestamps({
          verbalLastAt: ds.verbalLastAt ?? null,
          codeBreakerLastAt: ds.codeBreakerLastAt ?? null
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshDatasetTimestamps = async () => {
    try {
      const { data } = await api.get('/api/admin/dataset/status', {
        params: { _: Date.now() },
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' }
      });
      if (data && typeof data === 'object') {
        setDatasetTimestamps({
          verbalLastAt: data.verbalLastAt ?? null,
          codeBreakerLastAt: data.codeBreakerLastAt ?? null
        });
      }
    } catch (e) {
      console.warn('Dataset status:', e);
    }
  };

  const formatDatasetDate = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const verbalDatasetDate = formatDatasetDate(datasetTimestamps.verbalLastAt);
  const codeBreakerDatasetDate = formatDatasetDate(datasetTimestamps.codeBreakerLastAt);

  const handleAddVerbalDataset = async () => {
    setDatasetLoading((prev) => ({ ...prev, verbal: true }));
    try {
      const res = await api.post('/api/admin/dataset/verbal', { count: 10 });
      if (res.data?.success) {
        toast.success(res.data.message || `Added ${res.data.added} words. Total: ${res.data.total}.`);
        await refreshDatasetTimestamps();
      } else {
        toast.error(res.data?.error || 'Failed to add data');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add Verbal IQ data');
    } finally {
      setDatasetLoading((prev) => ({ ...prev, verbal: false }));
    }
  };

  const handleAddCodeBreakerDataset = async () => {
    setDatasetLoading((prev) => ({ ...prev, codebreaker: true }));
    try {
      const res = await api.post('/api/admin/dataset/codebreaker', { count: 15 });
      if (res.data?.success) {
        toast.success(res.data.message || `Added ${res.data.added} words. Total: ${res.data.total}.`);
        await refreshDatasetTimestamps();
      } else {
        toast.error(res.data?.error || 'Failed to add data');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add Code Breaker data');
    } finally {
      setDatasetLoading((prev) => ({ ...prev, codebreaker: false }));
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FiTrendingUp },
    { id: 'challenges', name: 'Challenges', icon: FiTarget },
    { id: 'games', name: 'Games', icon: FiPlay },
    { id: 'users', name: 'Users', icon: FiUsers },
    { id: 'data', name: 'Data', icon: FiDatabase },
    { id: 'settings', name: 'Settings', icon: FiSettings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentTabLabel = tabs.find((t) => t.id === activeTab)?.name ?? 'Admin';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="rounded-2xl border border-warm-border bg-warm-card shadow-sm overflow-hidden">
        {/* Top: light header + tabs (coffee accent border below) */}
        <div className="relative bg-white px-4 py-5 md:px-8 md:py-6 border-b border-warm-border">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
                navigate('/login');
              }
            }}
            className="btn btn-outline border-warm-border text-warm-text hover:bg-warm-container absolute top-4 right-4 md:top-5 md:right-8 z-10 text-sm"
          >
            <FiLogOut className="w-4 h-4 mr-2" />
            Logout
          </button>

          <div className="text-center max-w-2xl mx-auto px-2 sm:px-12">
            <h1 className="text-2xl md:text-3xl font-bold text-warm-text tracking-tight">
              Administration
            </h1>
            {activeTab === 'overview' ? (
              <>
                <p className="text-warm-textSecondary mt-2 text-base md:text-lg">
                  Monitor platform performance, user activity, and engagement.
                </p>
                <p className="text-sm text-warm-textSecondary/90 mt-2">
                  Use this panel to manage and optimize platform performance efficiently.
                </p>
              </>
            ) : (
              <p className="text-sm text-warm-textSecondary mt-2">
                <span className="font-semibold text-warm-primary">{currentTabLabel}</span>
                <span className="text-warm-textSecondary"> — workspace below</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-6 pt-6 border-t border-warm-border/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(ADMIN_TAB_PATHS[tab.id])}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border ${
                    activeTab === tab.id
                      ? 'bg-warm-primary text-white border-warm-primary shadow-md'
                      : 'bg-warm-container/60 text-warm-text border-warm-border hover:bg-warm-secondary/40 hover:border-warm-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom: coffee-tinted workspace (differentiates from header) */}
        <div className="bg-warm-container px-4 py-6 md:px-8 md:py-8 min-h-[12rem] border-t border-warm-secondary/30">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <div className="card">
              <div className="card-body text-center">
                <FiUsers className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers || 0}
                </div>
                <div className="text-sm text-gray-500">Total Users</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <FiCalendar className="w-8 h-8 text-success-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.dailyChallengeCompletionsToday ?? 0}
                </div>
                <div className="text-sm text-gray-500">Daily challenge completions (today)</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <FiPlay className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.activeGames || 0}
                </div>
                <div className="text-sm text-gray-500">Active Games</div>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <FiAward className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalCoins || 0}
                </div>
                <div className="text-sm text-gray-500">Total Coins Distributed</div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'challenges' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AdminChallenges />
          </motion.div>
        )}

        {activeTab === 'data' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
              <p className="text-gray-600 mt-1">
                Manage game content, including questions, word sets, and other gameplay data.
              </p>
              <p className="text-sm text-gray-500 mt-3">
                This section handles <strong>content</strong>, not game creation. Examples: add words for Verbal IQ / Code
                Breaker, extend word banks for Word Shuffle, or future question/puzzle imports.
              </p>
            </div>
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiDatabase className="w-5 h-5 text-primary-600" />
                  Import content
                </h3>
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 mb-6 text-sm text-gray-700">
                  <p className="font-semibold text-gray-900 mb-2">Dataset files last updated</p>
                  {!verbalDatasetDate && !codeBreakerDatasetDate ? (
                    <p className="text-sm text-gray-500 m-0">No dataset updates recorded yet.</p>
                  ) : (
                    <ul className="space-y-1.5 m-0 list-none p-0">
                      {verbalDatasetDate && (
                        <li>
                          <span className="text-gray-500">Verbal IQ:</span>{' '}
                          <span className="text-gray-900">{verbalDatasetDate}</span>
                        </li>
                      )}
                      {codeBreakerDatasetDate && (
                        <li>
                          <span className="text-gray-500">Code Breaker:</span>{' '}
                          <span className="text-gray-900">{codeBreakerDatasetDate}</span>
                        </li>
                      )}
                    </ul>
                  )}
                  <p className="text-xs text-gray-500 mt-2 mb-0">
                    Dates reflect when each file was last updated on disk (imports or manual edits).
                  </p>
                </div>
                <p className="text-gray-600 mb-6">
                  Fetch new words from external APIs and merge them into live datasets so players see less repetition.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleAddVerbalDataset}
                    disabled={datasetLoading.verbal}
                    className="btn btn-primary inline-flex items-center gap-2"
                  >
                    {datasetLoading.verbal ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <FiPlusCircle className="w-5 h-5" />
                    )}
                    Add Verbal IQ words
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCodeBreakerDataset}
                    disabled={datasetLoading.codebreaker}
                    className="btn btn-outline inline-flex items-center gap-2"
                  >
                    {datasetLoading.codebreaker ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
                    ) : (
                      <FiPlusCircle className="w-5 h-5" />
                    )}
                    Add Code Breaker words
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'games' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AdminGames />
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <AdminUsers />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <AdminSettings />
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
