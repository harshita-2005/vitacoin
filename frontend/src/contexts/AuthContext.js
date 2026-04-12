import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        user: {
          ...state.user,
          coinBalance: action.payload.newBalance
        }
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify session: httpOnly cookie (production) and/or legacy Bearer token in localStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' });
        const response = await api.get('/api/auth/verify');
        const bodyToken = response.data.token;
        if (typeof localStorage !== 'undefined') {
          if (bodyToken) localStorage.setItem('token', bodyToken);
        }
        const stored =
          typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.data.user,
            token: bodyToken || stored
          }
        });
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.error('Auth verification failed:', error);
        }
        if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await api.post('/api/auth/login', { email, password });

      const { user, token: bodyToken } = response.data;
      if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
      if (bodyToken) localStorage.setItem('token', bodyToken);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token: bodyToken || null }
      });

      toast.success(`Welcome back, ${user.firstName}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const response = await api.post('/api/auth/register', userData);

      const { user, token: bodyToken } = response.data;
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('token');
        if (bodyToken) localStorage.setItem('token', bodyToken);
      }

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token: bodyToken || null }
      });

      toast.success(`Welcome to Vitacoin, ${user.firstName}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (_) {
      /* still clear client state */
    }
    if (typeof localStorage !== 'undefined') localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      dispatch({ type: 'UPDATE_USER', payload: response.data });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateBalance = (newBalance) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: { newBalance } });
  };

  /** Sync total XP (and optional level) after games, puzzles, MCQs, challenges, badges, etc. */
  const updateExperiencePoints = (experiencePoints, userLevel) => {
    const payload = { experiencePoints };
    if (userLevel != null) payload.userLevel = userLevel;
    dispatch({ type: 'UPDATE_USER', payload });
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateBalance,
    updateExperiencePoints,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
