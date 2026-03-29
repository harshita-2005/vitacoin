import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiEye,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiCopy
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';

/** Parse dailyAttempts map keys like `math-quiz_easy` for admin UI */
function parseDailyAttemptEntries(raw) {
  if (!raw || typeof raw !== 'object') return [];
  return Object.entries(raw).map(([key, count]) => {
    const lastU = key.lastIndexOf('_');
    const game = lastU > 0 ? key.slice(0, lastU) : key;
    const difficulty = lastU > 0 ? key.slice(lastU + 1) : '';
    return {
      key,
      game,
      difficulty,
      count: Number(count) || 0
    };
  });
}

function difficultyPillClass(diff) {
  const d = String(diff).toLowerCase();
  if (d === 'easy') return 'bg-emerald-50 text-emerald-900 ring-emerald-200/70';
  if (d === 'medium') return 'bg-amber-50 text-amber-950 ring-amber-200/70';
  if (d === 'hard') return 'bg-red-50 text-red-900 ring-red-200/60';
  return 'bg-warm-container text-warm-text ring-warm-border/40';
}

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/toggle`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const viewUserDetails = async (userId) => {
    setShowUserModal(true);
    setSelectedUser(null);
    setProfileLoading(true);
    try {
      const response = await axios.get(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedUser(response.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.response?.data?.error || 'Could not load user profile');
      setShowUserModal(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfileModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setProfileLoading(false);
  };

  const filteredUsers = users.filter(user => {
    const q = searchTerm.trim().toLowerCase();
    const idStr = String(user._id || '').toLowerCase();
    const matchesSearch =
      !q ||
      user.firstName?.toLowerCase().includes(q) ||
      user.lastName?.toLowerCase().includes(q) ||
      user.username?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      idStr.includes(q.replace(/\s/g, ''));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1 max-w-3xl">
            View and manage user accounts, track activity, and monitor reward distribution.
          </p>
        </div>
        <div className="text-sm text-gray-600 shrink-0">
          Registered: <span className="font-semibold">{users.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, username, email, or user ID…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterRole('all');
                setFilterStatus('all');
              }}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[12rem]">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Coins Earned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Games Played
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 align-top whitespace-nowrap">
                    <code
                      className="font-mono text-[11px] text-gray-600 tabular-nums"
                      title={String(user._id)}
                    >
                      {String(user._id)}
                    </code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          @{user.username}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'moderator' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">
                      {user.totalEarned ?? user.coinBalance ?? 0}
                    </div>
                    <div className="text-sm text-gray-500">lifetime</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">
                      {user.tasksCompleted ?? 0}
                    </div>
                    <div className="text-sm text-gray-500">tasks completed</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => viewUserDetails(user._id)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View profile"
                        aria-label="View profile"
                      >
                        <FiEye className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        className={`p-1 ${
                          user.isActive 
                            ? 'text-orange-600 hover:text-orange-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={user.isActive ? 'Disable user' : 'Enable user'}
                        aria-label={user.isActive ? 'Disable user' : 'Enable user'}
                      >
                        {user.isActive ? <FiToggleLeft className="w-4 h-4" /> : <FiToggleRight className="w-4 h-4" />}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Remove account"
                        aria-label="Remove account"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal — warm coffee palette, matches Admin Games */}
      {showUserModal && (
        <div
          className="fixed inset-0 bg-warm-text/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-user-profile-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-warm-card rounded-2xl shadow-xl border border-warm-border/90 max-w-4xl w-full max-h-[90vh] overflow-y-auto ring-1 ring-warm-border/30"
          >
            <div className="p-5 sm:p-6 border-b border-warm-border/70 sticky top-0 bg-warm-card/95 backdrop-blur-sm z-10 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2
                  id="admin-user-profile-title"
                  className="text-xl sm:text-2xl font-bold text-warm-text tracking-tight"
                >
                  User profile
                </h2>
                <p className="text-sm font-semibold text-warm-textSecondary mt-1.5 leading-snug">
                  Admin view — passwords and secrets are <span className="text-warm-primary">never</span> included.
                </p>
              </div>
              <button
                type="button"
                onClick={closeProfileModal}
                className="shrink-0 text-warm-textSecondary hover:text-warm-text p-2 rounded-xl hover:bg-warm-container/80 ring-1 ring-transparent hover:ring-warm-border/50 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 sm:p-6 bg-warm-background/50">
              {profileLoading && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-warm-primary border-t-transparent" />
                  <p className="text-sm font-bold text-warm-textSecondary">Loading profile…</p>
                </div>
              )}

              {!profileLoading && selectedUser && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* Account */}
                    <section className="lg:col-span-5 rounded-2xl bg-warm-container/45 ring-1 ring-warm-border/50 p-4 sm:p-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-warm-textSecondary mb-4">
                        Account
                      </h3>
                      <dl className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-2 sm:gap-3 sm:items-start">
                          <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary">
                            User ID
                          </dt>
                          <dd className="flex flex-wrap items-center gap-2 min-w-0">
                            <code className="text-xs font-mono font-bold text-warm-text break-all leading-snug">
                              {selectedUser._id}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(String(selectedUser._id));
                                toast.success('User ID copied');
                              }}
                              className="inline-flex items-center gap-1 shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-warm-primary ring-1 ring-warm-border/60 hover:bg-warm-container/80"
                              title="Copy ID"
                            >
                              <FiCopy className="w-3.5 h-3.5" />
                              Copy
                            </button>
                          </dd>
                        </div>
                        {[
                          ['Full name', `${selectedUser.firstName} ${selectedUser.lastName}`],
                          ['Username', `@${selectedUser.username}`],
                          ['Email', selectedUser.email]
                        ].map(([label, val]) => (
                          <div key={label} className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-0.5 sm:gap-3 sm:items-baseline">
                            <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary">
                              {label}
                            </dt>
                            <dd className="text-sm font-bold text-warm-text break-all leading-snug">{val}</dd>
                          </div>
                        ))}
                        <div className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-2 sm:gap-3 sm:items-center">
                          <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary">
                            Role
                          </dt>
                          <dd>
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ring-1 ${
                                selectedUser.role === 'admin'
                                  ? 'bg-red-50 text-red-900 ring-red-200/80'
                                  : selectedUser.role === 'moderator'
                                    ? 'bg-amber-50 text-amber-950 ring-amber-200/70'
                                    : 'bg-warm-card text-warm-primary ring-warm-border/60'
                              }`}
                            >
                              {selectedUser.role}
                            </span>
                          </dd>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-2 sm:gap-3 sm:items-center">
                          <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary">
                            Status
                          </dt>
                          <dd>
                            <span
                              className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ring-1 ${
                                selectedUser.isActive
                                  ? 'bg-emerald-50 text-emerald-900 ring-emerald-200/70'
                                  : 'bg-red-50 text-red-900 ring-red-200/70'
                              }`}
                            >
                              {selectedUser.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </dd>
                        </div>
                        {[
                          [
                            'Joined',
                            selectedUser.createdAt
                              ? new Date(selectedUser.createdAt).toLocaleString()
                              : '—'
                          ],
                          [
                            'Last login',
                            selectedUser.lastLogin
                              ? new Date(selectedUser.lastLogin).toLocaleString()
                              : '—'
                          ]
                        ].map(([label, val]) => (
                          <div
                            key={label}
                            className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] gap-0.5 sm:gap-3 sm:items-baseline"
                          >
                            <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary">
                              {label}
                            </dt>
                            <dd className="text-sm font-bold text-warm-text tabular-nums">{val}</dd>
                          </div>
                        ))}
                        {selectedUser.profilePicture && (
                          <div className="pt-1 border-t border-warm-border/40">
                            <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary mb-1">
                              Avatar URL
                            </dt>
                            <dd className="text-xs font-semibold text-warm-text break-all">{selectedUser.profilePicture}</dd>
                          </div>
                        )}
                      </dl>
                    </section>

                    {/* Coins & progression — compact stat tiles */}
                    <section className="lg:col-span-7 rounded-2xl bg-warm-container/45 ring-1 ring-warm-border/50 p-4 sm:p-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-warm-textSecondary mb-3">
                        Coins & progression
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="rounded-xl bg-warm-card px-2 py-2 ring-1 ring-warm-border/45 text-center">
                          <div className="text-lg sm:text-xl font-bold text-coinGold tabular-nums leading-none">
                            {selectedUser.coinBalance ?? 0}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-warm-textSecondary mt-1.5">
                            Balance
                          </div>
                        </div>
                        <div className="rounded-xl bg-warm-card px-2 py-2 ring-1 ring-warm-border/45 text-center">
                          <div className="text-lg sm:text-xl font-bold text-warm-primary tabular-nums leading-none">
                            {selectedUser.totalEarned ?? 0}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-warm-textSecondary mt-1.5">
                            Total earned
                          </div>
                        </div>
                        <div className="rounded-xl bg-warm-card px-2 py-2 ring-1 ring-warm-border/45 text-center">
                          <div className="text-lg sm:text-xl font-bold text-warm-primary tabular-nums leading-none">
                            {selectedUser.experiencePoints ?? 0}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-warm-textSecondary mt-1.5">
                            XP
                          </div>
                        </div>
                        <div className="rounded-xl bg-warm-card px-2 py-2 ring-1 ring-warm-border/45 text-center">
                          <div className="text-lg sm:text-xl font-bold text-warm-primary tabular-nums leading-none">
                            {selectedUser.userLevel ?? 1}
                          </div>
                          <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-warm-textSecondary mt-1.5">
                            Level
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="rounded-xl bg-warm-secondary/25 px-3 py-2 ring-1 ring-warm-border/40">
                          <div className="text-base font-bold text-warm-text tabular-nums">
                            {selectedUser.tasksCompleted ?? 0}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-warm-textSecondary mt-0.5">
                            Tasks done
                          </div>
                        </div>
                        <div className="rounded-xl bg-warm-secondary/25 px-3 py-2 ring-1 ring-warm-border/40">
                          <div className="text-base font-bold text-warm-text tabular-nums">
                            {selectedUser.loginStreak ?? 0}
                          </div>
                          <div className="text-[10px] font-bold uppercase text-warm-textSecondary mt-0.5">
                            Login streak
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Game progress */}
                  {selectedUser.gameProgress && Object.keys(selectedUser.gameProgress).length > 0 && (
                    <section className="rounded-2xl bg-warm-container/45 ring-1 ring-warm-border/50 p-4 sm:p-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-warm-textSecondary mb-3">
                        Game progress
                      </h3>
                      <div className="overflow-x-auto rounded-xl ring-1 ring-warm-border/40 bg-warm-card">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left bg-warm-container/60 border-b border-warm-border/60">
                              {['Game', 'Level', 'Best', 'E / M / H', 'Plays'].map((h) => (
                                <th
                                  key={h}
                                  className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-warm-textSecondary"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-warm-border/40">
                            {Object.entries(selectedUser.gameProgress).map(([slug, prog]) => (
                              <tr key={slug} className="text-warm-text">
                                <td className="px-3 py-2 font-bold text-xs sm:text-sm">{slug}</td>
                                <td className="px-3 py-2 font-semibold tabular-nums">{prog?.level ?? '—'}</td>
                                <td className="px-3 py-2 font-semibold tabular-nums">{prog?.bestScore ?? '—'}</td>
                                <td className="px-3 py-2 tabular-nums text-xs font-semibold text-warm-textSecondary">
                                  {prog?.scores
                                    ? `${prog.scores.easy ?? 0} / ${prog.scores.medium ?? 0} / ${prog.scores.hard ?? 0}`
                                    : '—'}
                                </td>
                                <td className="px-3 py-2 font-bold tabular-nums">{prog?.timesPlayed ?? 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* Daily attempts — visual chips */}
                  {selectedUser.dailyAttempts && Object.keys(selectedUser.dailyAttempts).length > 0 && (
                    <section className="rounded-2xl bg-warm-container/45 ring-1 ring-warm-border/50 p-4 sm:p-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-warm-textSecondary mb-1">
                        Today&apos;s attempt counts
                      </h3>
                      <p className="text-xs font-semibold text-warm-textSecondary/90 mb-3">
                        Per game and difficulty (resets daily).
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {parseDailyAttemptEntries(selectedUser.dailyAttempts).map((row) => (
                          <div
                            key={row.key}
                            className="inline-flex flex-wrap items-center gap-2 rounded-xl bg-warm-card px-3 py-2 ring-1 ring-warm-border/50"
                          >
                            <span className="text-xs font-bold text-warm-text">{row.game}</span>
                            {row.difficulty && (
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ring-1 ${difficultyPillClass(row.difficulty)}`}
                              >
                                {row.difficulty}
                              </span>
                            )}
                            <span className="text-sm font-bold tabular-nums text-warm-primary">{row.count}×</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {(selectedUser.completedPuzzles?.length > 0 || selectedUser.completedMcqs?.length > 0) && (
                    <section className="rounded-2xl bg-warm-container/45 ring-1 ring-warm-border/50 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl bg-warm-card/80 p-3 ring-1 ring-warm-border/40">
                        <h4 className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary mb-1">
                          Interview puzzles
                        </h4>
                        <p className="text-2xl font-bold text-warm-primary tabular-nums">
                          {selectedUser.completedPuzzles?.length ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl bg-warm-card/80 p-3 ring-1 ring-warm-border/40">
                        <h4 className="text-[11px] font-bold uppercase tracking-wide text-warm-textSecondary mb-1">
                          CS MCQ completed
                        </h4>
                        <p className="text-2xl font-bold text-warm-primary tabular-nums">
                          {selectedUser.completedMcqs?.length ?? 0}
                        </p>
                      </div>
                    </section>
                  )}

                  {Array.isArray(selectedUser.badges) && selectedUser.badges.length > 0 && (
                    <section className="rounded-2xl bg-warm-container/45 ring-1 ring-warm-border/50 p-4 sm:p-5">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-warm-textSecondary mb-4">
                        Badges
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {selectedUser.badges.map((badge) => {
                          const id = badge?._id ?? badge;
                          const isObj = badge && typeof badge === 'object';
                          return (
                            <div
                              key={String(id)}
                              className="text-center rounded-xl bg-warm-card p-3 ring-1 ring-warm-border/45"
                            >
                              <div className="w-14 h-14 mx-auto bg-gradient-to-br from-coinGold/90 to-warm-primary rounded-2xl flex items-center justify-center text-2xl mb-2 ring-1 ring-warm-border/30">
                                {isObj ? badge.icon || '🏅' : '?'}
                              </div>
                              <div className="text-xs font-bold text-warm-text leading-tight">
                                {isObj ? badge.name || 'Badge' : `ID…${String(badge).slice(0, 6)}`}
                              </div>
                              {isObj && badge.description && (
                                <div className="text-[10px] font-semibold text-warm-textSecondary mt-1 line-clamp-2">
                                  {badge.description}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  <section className="rounded-2xl bg-warm-container/45 ring-1 ring-warm-border/50 p-4 sm:p-5">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-warm-textSecondary mb-3">
                      Recent transactions
                    </h3>
                    {(!selectedUser.recentTransactions || selectedUser.recentTransactions.length === 0) && (
                      <p className="text-sm font-bold text-warm-textSecondary">No transactions yet.</p>
                    )}
                    {selectedUser.recentTransactions && selectedUser.recentTransactions.length > 0 && (
                      <ul className="space-y-2">
                        {selectedUser.recentTransactions.map((tx) => (
                          <li
                            key={tx._id}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center p-3 rounded-xl bg-warm-card ring-1 ring-warm-border/45"
                          >
                            <div className="sm:col-span-6 min-w-0">
                              <div className="font-bold text-warm-text text-sm leading-snug">{tx.description}</div>
                              <div className="text-[11px] font-bold text-warm-textSecondary mt-1 uppercase tracking-wide">
                                {tx.type}
                                {tx.category ? ` · ${tx.category}` : ''}
                              </div>
                            </div>
                            <div
                              className={`sm:col-span-3 font-bold tabular-nums text-base ${
                                tx.amount > 0 ? 'text-emerald-700' : 'text-red-700'
                              }`}
                            >
                              {tx.amount > 0 ? '+' : ''}
                              {tx.amount} coins
                            </div>
                            <div className="sm:col-span-3 text-xs sm:text-sm">
                              <div className="font-bold text-warm-text tabular-nums">
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
                              </div>
                              {tx.balanceAfter != null && (
                                <div className="text-[11px] font-bold text-warm-textSecondary mt-1">
                                  Balance after: <span className="text-warm-text">{tx.balanceAfter}</span>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
