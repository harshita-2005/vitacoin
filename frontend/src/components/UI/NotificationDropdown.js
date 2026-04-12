import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from '../../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';

const REFRESH_EVENT = 'vitacoin-notifications-refresh';

const NotificationDropdown = () => {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  /** Which notification row is expanded to read full message (null = none). */
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    if (!token || !user) return;
    try {
      setLoading(true);
      const { data } = await api.get('/api/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (e) {
      console.error('Notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener(REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(REFRESH_EVENT, onRefresh);
  }, [load]);

  const markOneRead = async (id) => {
    try {
      const { data } = await api.patch(`/api/notifications/${id}/read`);
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
      else load();
    } catch {
      load();
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      load();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-success-400 bg-success-50';
      case 'warning':
        return 'border-warning-400 bg-warning-50';
      case 'error':
        return 'border-danger-400 bg-danger-50';
      default:
        return 'border-primary-400 bg-primary-50';
    }
  };

  const timeLabel = (createdAt) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setExpandedId(null);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (isOpen) setExpandedId(null);
        }}
        className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md"
        aria-label="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-10"
              onClick={closeDropdown}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <button
                    type="button"
                    onClick={closeDropdown}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">Loading…</div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => {
                    const isExpanded = expandedId === notification._id;
                    const msg = notification.message || '';
                    return (
                      <motion.button
                        type="button"
                        key={notification._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => {
                          if (!notification.read) markOneRead(notification._id);
                          setExpandedId((prev) =>
                            prev === notification._id ? null : notification._id
                          );
                        }}
                        aria-expanded={isExpanded}
                        className={`w-full text-left p-4 border-l-4 transition-shadow ${getNotificationColor(
                          notification.type
                        )} hover:bg-gray-50 ${
                          !notification.read ? 'bg-white' : 'opacity-90'
                        } ${
                          isExpanded
                            ? 'shadow-inner ring-1 ring-gray-200/80 z-[1] relative'
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg mr-1 shrink-0" aria-hidden>
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 pr-1">
                              <span className={isExpanded ? '' : 'line-clamp-2'}>
                                {notification.title}
                              </span>
                              {!notification.read && (
                                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-warm-primary align-middle shrink-0" />
                              )}
                            </p>
                            <div
                              className={`mt-2 rounded-xl border text-sm text-gray-700 ${
                                isExpanded
                                  ? 'border-gray-200 bg-white/90 shadow-sm p-3 leading-relaxed whitespace-pre-wrap break-words'
                                  : 'border-transparent bg-transparent p-0'
                              }`}
                            >
                              <p className={isExpanded ? '' : 'line-clamp-2'}>{msg}</p>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{timeLabel(notification.createdAt)}</p>
                          </div>
                          <span
                            className="shrink-0 text-gray-400 mt-0.5"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                            aria-hidden
                          >
                            {isExpanded ? (
                              <FiChevronUp className="w-4 h-4" />
                            ) : (
                              <FiChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <FiBell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications yet</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && unreadCount > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Mark all as read
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
