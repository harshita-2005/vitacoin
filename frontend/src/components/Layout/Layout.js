import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiDollarSign,
  FiAward,
  FiTrendingUp,
  FiHome,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPlay,
  FiTarget,
  FiUsers,
  FiGift,
  FiArrowLeft,
  FiBarChart2,
  FiTag,
  FiDatabase
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import CoinDisplay from '../UI/CoinDisplay';
import XpDisplay from '../UI/XpDisplay';
import NotificationDropdown from '../UI/NotificationDropdown';

const SIDEBAR_COLLAPSED_KEY = 'vitacoin_sidebar_collapsed';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const { user, logout } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch (_) {}
  }, [sidebarCollapsed]);
  useSocket(); // keep connection active
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = user?.role === 'admin' ? [
    { name: 'Administration', href: '/admin', icon: FiTrendingUp },
    { name: 'Challenges', href: '/admin/challenges', icon: FiTarget },
    { name: 'Games', href: '/admin/games', icon: FiPlay },
    { name: 'Users', href: '/admin/users', icon: FiUsers },
    { name: 'Data', href: '/admin/data', icon: FiDatabase },
    { name: 'Settings', href: '/admin/settings', icon: FiSettings },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Play Games', href: '/play-games', icon: FiPlay },
    { name: 'Interview Arena', href: '/challenges', icon: FiTarget },
    { name: 'Coupons', href: '/coupons', icon: FiTag },
    { name: 'My Coupons', href: '/my-coupons', icon: FiAward },
    { name: 'Coin Activity', href: '/transactions', icon: FiDollarSign },
    { name: 'Badges', href: '/badges', icon: FiAward },
    { name: 'Leaderboard', href: '/leaderboard', icon: FiBarChart2 },
    { name: 'Profile', href: '/profile', icon: FiUser },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (user?.role === 'admin' && path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-warm-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - collapsible on desktop only; full width on mobile when open */}
      <motion.aside
        initial={false}
        className={`sidebar fixed top-0 left-0 h-full w-64 z-40 lg:static lg:flex lg:flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'} ${sidebarOpen ? '' : 'hidden lg:flex'}`}
      >
        <div className="flex flex-col h-full w-full min-w-0 overflow-hidden">
          {/* Logo row: when collapsed stack logo + chevron for narrow width */}
          <div className={`border-b border-warm-border ${sidebarCollapsed ? 'flex flex-col items-center py-3 gap-2' : 'flex items-center justify-between gap-2 p-4'}`}>
            <Link to={user?.role === 'admin' ? '/admin' : '/dashboard'} className={`flex items-center min-w-0 ${sidebarCollapsed ? 'justify-center' : 'flex-1 space-x-3'}`} onClick={() => setSidebarOpen(false)}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="w-10 h-10 bg-warm-primary rounded-xl flex items-center justify-center shrink-0"
              >
                <span className="text-white font-bold text-lg">V</span>
              </motion.div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-lg font-bold gradient-text">Vitacoin</h1>
                  <p className="text-xs text-warm-textSecondary">Rewards Dashboard</p>
                </div>
              )}
            </Link>
            <div className={`flex items-center shrink-0 gap-1 ${sidebarCollapsed ? 'flex-col' : ''}`}>
              {/* Collapse/expand - at top, desktop only */}
              <button
                type="button"
                onClick={() => setSidebarCollapsed((c) => !c)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-warm-container text-warm-textSecondary hover:text-warm-text transition-colors"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-warm-container transition-colors"
                aria-label="Close menu"
              >
                <FiX className="w-5 h-5 text-warm-textSecondary" />
              </button>
            </div>
          </div>

          {/* Navigation - collapsed: icons in circles with tooltip */}
          <nav className={`flex-1 py-4 space-y-1 ${sidebarCollapsed ? 'px-2 flex flex-col items-center' : 'px-4'}`}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <motion.div
                  key={item.name}
                  whileHover={{ x: sidebarCollapsed ? 0 : 4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <Link
                    to={item.href}
                    title={item.name}
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center w-full py-2' : 'nav-link'} ${!sidebarCollapsed && active ? 'nav-link-active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {sidebarCollapsed ? (
                      <span className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${active ? 'bg-warm-container text-warm-primary' : 'bg-warm-container text-warm-textSecondary hover:bg-warm-secondary hover:text-warm-primary'}`}>
                        <Icon className="w-5 h-5 shrink-0" />
                      </span>
                    ) : (
                      <>
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="ml-3 truncate">{item.name}</span>
                      </>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Quick Actions - only when expanded */}
          {user?.role !== 'admin' && !sidebarCollapsed && (
            <div className="px-4 py-3 border-t border-warm-border">
              <h3 className="text-xs font-semibold text-warm-textSecondary uppercase tracking-wider mb-2">Quick Actions</h3>
              <div className="space-y-1">
                <Link to="/play-games" className="flex items-center px-3 py-2 text-sm text-warm-text hover:text-warm-primary hover:bg-warm-container rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}>
                  <FiPlay className="w-4 h-4 mr-3" /> Quick Game
                </Link>
                <Link to="/coupons" className="flex items-center px-3 py-2 text-sm text-warm-text hover:text-warm-primary hover:bg-warm-container rounded-lg transition-colors" onClick={() => setSidebarOpen(false)}>
                  <FiGift className="w-4 h-4 mr-3" /> Spend Coins
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="main-content flex-1 flex flex-col overflow-hidden">
        {/* Header with accent */}
        <header className="header">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FiMenu className="w-6 h-6 text-warm-textSecondary" />
            </button>

            {/* Page Title - no duplicate search; pages like Play Games have their own search */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-warm-text truncate">
                {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {/* Coins + XP — regular users only */}
              {user?.role !== 'admin' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <CoinDisplay balance={user?.coinBalance || 0} size="lg" premium />
                  <XpDisplay points={user?.experiencePoints ?? 0} size="lg" />
                </motion.div>
              )}

              {/* Notifications — end-users only; admins use dashboard tools, not consumer alerts */}
              {user?.role !== 'admin' && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <NotificationDropdown />
                </motion.div>
              )}

              {/* User Menu */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="relative group"
              >
                <button className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={`${user?.firstName || 'User'} profile`}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-warm-border bg-white"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-warm-container rounded-full flex items-center justify-center">
                      <span className="text-warm-primary font-semibold text-base">
                        {user?.firstName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium text-warm-text">
                    {user?.firstName}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* User Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FiUser className="w-4 h-4 mr-3" />
                      Profile
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

        </header>

        {/* Breadcrumb Navigation */}
        <div className="border-b border-slate-200 bg-white">
          <div className="px-6 py-3 flex items-center justify-between gap-4">
            <nav className="flex items-center space-x-2 text-sm text-slate-500 min-w-0">
              <Link to="/dashboard" className="hover:text-warm-primary transition-colors">
                Dashboard
              </Link>
              {location.pathname !== '/dashboard' && (
                <>
                  <span>/</span>
                  <span className="text-warm-text font-medium truncate">
                    {navigation.find(item => isActive(item.href))?.name || 'Page'}
                  </span>
                </>
              )}
            </nav>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="shrink-0 flex items-center gap-1.5 text-sm text-warm-textSecondary hover:text-warm-primary transition-colors"
              title="Go back"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container-fluid py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Mobile Bottom Navigation - Only for regular users */}
        {user?.role !== 'admin' && (
          <div className="lg:hidden border-t border-warm-border bg-white">
            <div className="flex items-center justify-around py-2">
              <Link
                to="/dashboard"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/dashboard')
                    ? 'text-warm-primary bg-warm-container'
                    : 'text-warm-textSecondary hover:text-warm-primary'
                }`}
              >
                <FiHome className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Dashboard</span>
              </Link>
              
              <Link
                to="/play-games"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/play-games')
                    ? 'text-warm-primary bg-warm-container'
                    : 'text-warm-textSecondary hover:text-warm-primary'
                }`}
              >
                <FiPlay className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Games</span>
              </Link>
              
              <Link
                to="/coupons"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/coupons')
                    ? 'text-warm-primary bg-warm-container'
                    : 'text-warm-textSecondary hover:text-warm-primary'
                }`}
              >
                <FiGift className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Coupons</span>
              </Link>
              
              <Link
                to="/profile"
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive('/profile')
                    ? 'text-warm-primary bg-warm-container'
                    : 'text-warm-textSecondary hover:text-warm-primary'
                }`}
              >
                <FiUser className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Profile</span>
              </Link>
            </div>
          </div>
        )}

        {/* Floating Action Button - Only for regular users */}
        {user?.role !== 'admin' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            className="fixed bottom-6 right-6 z-40 lg:hidden"
          >
            <div className="relative group">
              <button className="w-14 h-14 bg-indigo-600 rounded-full shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center text-white">
                <FiMenu className="w-6 h-6" />
              </button>
              
              {/* Floating Menu */}
              <div className="absolute bottom-16 right-0 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 space-y-2">
                  <Link
                    to="/play-games"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-warm-container rounded-lg flex items-center justify-center">
                      <FiPlay className="w-4 h-4 text-warm-primary" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Play Games</span>
                  </Link>
                  
                  <Link
                    to="/coupons"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FiGift className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Coupons</span>
                  </Link>
                  
                  <Link
                    to="/challenges"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-warm-container rounded-lg flex items-center justify-center">
                      <FiTarget className="w-4 h-4 text-warm-primary" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Interview Arena</span>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Layout;
