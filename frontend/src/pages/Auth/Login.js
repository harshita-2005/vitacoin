import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Handle redirect after successful login
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      // Redirect is handled by useEffect when user state updates
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-background py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-warm-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          >
            <span className="text-white font-bold text-2xl">V</span>
          </motion.div>
          
          <h2 className="text-3xl font-bold text-warm-text mb-2">
            Welcome back
          </h2>
          <p className="text-warm-textSecondary">
            Sign in to your Vitacoin account
          </p>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
        >
          <div className="space-y-4">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="input-group">
                <FiMail className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`input input-with-icon ${errors.email ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="form-error"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-group">
                <FiLock className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`input input-with-icon pr-12 ${errors.password ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-warm-container transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5 text-warm-textSecondary hover:text-warm-text" />
                  ) : (
                    <FiEye className="w-5 h-5 text-warm-textSecondary hover:text-warm-text" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="form-error"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-warm-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              'Sign in'
            )}
          </motion.button>

          {/* Links */}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
            
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </motion.form>

        {/* Demo Accounts Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 space-y-4"
        >
          {/* Demo User Account */}
          <div className="p-4 bg-warm-container rounded-xl border border-warm-border shadow-sm">
            <h3 className="text-sm font-semibold text-warm-text mb-2">Demo Account (Regular User)</h3>
            <p className="text-xs text-warm-textSecondary mb-2">
              Test the application as a regular user:
            </p>
            <div className="text-xs text-warm-text space-y-1">
              <p><strong>Email:</strong> demo@vitacoin.com</p>
              <p><strong>Password:</strong> demo123</p>
            </div>
          </div>

          {/* Admin Account */}
          <div className="p-4 bg-warm-container rounded-xl border border-warm-border shadow-sm">
            <h3 className="text-sm font-semibold text-warm-text mb-2">Admin Account</h3>
            <p className="text-xs text-warm-textSecondary mb-2">
              Access admin dashboard and management features:
            </p>
            <div className="text-xs text-warm-text space-y-1">
              <p><strong>Email:</strong> admin@vitacoin.com</p>
              <p><strong>Password:</strong> admin123</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
