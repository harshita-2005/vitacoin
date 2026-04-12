import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocketUrl } from '../api/axios';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);

  useEffect(() => {
    if (user) {
      // Cookie session: withCredentials sends JWT; optional legacy auth.token if still in memory
      socketRef.current = io(getSocketUrl(), {
        ...(token ? { auth: { token } } : {}),
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      // Connection events
      socketRef.current.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // User data events
      socketRef.current.on('user_data', (data) => {
        console.log('User data received:', data);
        setConnectedUsers(data.connectedUsers);
      });

      // Balance update events
      socketRef.current.on('balance_updated', (data) => {
        console.log('Balance updated:', data);
        // This will be handled by the auth context
      });

      // Badge award events
      socketRef.current.on('badge_awarded', (data) => {
        console.log('Badge awarded:', data);
        toast.success(data.message, {
          icon: '🏆',
          duration: 5000,
        });
      });

      // Leaderboard update events
      socketRef.current.on('leaderboard_update', (data) => {
        console.log('Leaderboard updated:', data);
        // This will be handled by the leaderboard component
      });

      // Badge update events
      socketRef.current.on('badge_update', (data) => {
        console.log('Badge update:', data);
        // This will be handled by the badges component
      });

      // Transaction data events
      socketRef.current.on('transactions_data', (data) => {
        console.log('Transactions data received:', data);
        // This will be handled by the transactions component
      });

      // Leaderboard data events
      socketRef.current.on('leaderboard_data', (data) => {
        console.log('Leaderboard data received:', data);
        // This will be handled by the leaderboard component
      });

      // Connected users count events
      socketRef.current.on('connected_users_count', (count) => {
        setConnectedUsers(count);
      });

      socketRef.current.on('notifications_refresh', () => {
        window.dispatchEvent(new CustomEvent('vitacoin-notifications-refresh'));
      });

      // System notification events
      socketRef.current.on('system_notification', (notification) => {
        console.log('System notification:', notification);
        toast(notification.message, {
          icon: notification.type === 'success' ? '✅' : 
                notification.type === 'warning' ? '⚠️' : 
                notification.type === 'error' ? '❌' : 'ℹ️',
          duration: notification.duration || 4000,
        });
      });

      // Error events
      socketRef.current.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'An error occurred');
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [token, user]);

  const emit = (event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const joinLeaderboard = () => {
    emit('join_leaderboard');
  };

  const leaveLeaderboard = () => {
    emit('leave_leaderboard');
  };

  const updateBalance = (amount, reason, category = 'other') => {
    emit('update_balance', { amount, reason, category });
  };

  const awardBadge = (badgeId) => {
    emit('award_badge', { badgeId });
  };

  const getTransactions = (options = {}) => {
    emit('get_transactions', options);
  };

  const getLeaderboard = (options = {}) => {
    emit('get_leaderboard', options);
  };

  const userActivity = (activity) => {
    emit('user_activity', activity);
  };

  const value = {
    socket: socketRef.current,
    isConnected,
    connectedUsers,
    emit,
    joinLeaderboard,
    leaveLeaderboard,
    updateBalance,
    awardBadge,
    getTransactions,
    getLeaderboard,
    userActivity
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
