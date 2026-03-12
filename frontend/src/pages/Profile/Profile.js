import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiSave, FiEdit3, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CoinDisplay from '../../components/UI/CoinDisplay';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const Profile = () => {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    profilePicture: user?.profilePicture || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const result = await updateProfile(profileForm);
      if (!result.success) {
        setErrors(result.errors || {});
      }
    } catch (error) {
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setErrors(result.errors || {});
      }
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (form, setForm, field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: FiUser },
    { id: 'password', name: 'Password', icon: FiLock }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-warm-text">Profile Settings</h1>
        <p className="text-warm-textSecondary">Manage your account information and preferences</p>
      </div>

      {/* Profile Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="card-body">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-warm-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-warm-text">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-warm-textSecondary">@{user?.username}</p>
              <p className="text-warm-textSecondary">{user?.email}</p>
              <div className="mt-2">
                <CoinDisplay balance={user?.coinBalance || 0} size="lg" />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-warm-textSecondary">Member since</div>
              <div className="font-medium text-warm-text">
                {new Date(user?.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <div className="card-header">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleProfileSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-warm-text mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => handleInputChange(profileForm, setProfileForm, 'firstName', e.target.value)}
                    className={`input ${errors.firstName ? 'border-danger-500' : ''}`}
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-danger-600">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-text mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => handleInputChange(profileForm, setProfileForm, 'lastName', e.target.value)}
                    className={`input ${errors.lastName ? 'border-danger-500' : ''}`}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-danger-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-text mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={profileForm.profilePicture}
                  onChange={(e) => handleInputChange(profileForm, setProfileForm, 'profilePicture', e.target.value)}
                  className="input"
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className="mt-1 text-sm text-warm-textSecondary">
                  Enter a URL to your profile picture
                </p>
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <>
                      <FiSave className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handlePasswordSubmit}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-warm-text mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handleInputChange(passwordForm, setPasswordForm, 'currentPassword', e.target.value)}
                  className={`input ${errors.currentPassword ? 'border-danger-500' : ''}`}
                  placeholder="Enter your current password"
                />
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-danger-600">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-text mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => handleInputChange(passwordForm, setPasswordForm, 'newPassword', e.target.value)}
                  className={`input ${errors.newPassword ? 'border-danger-500' : ''}`}
                  placeholder="Enter your new password"
                />
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-danger-600">{errors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-text mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handleInputChange(passwordForm, setPasswordForm, 'confirmPassword', e.target.value)}
                  className={`input ${errors.confirmPassword ? 'border-danger-500' : ''}`}
                  placeholder="Confirm your new password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="text-white" />
                  ) : (
                    <>
                      <FiLock className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>

      {/* Account Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-warm-primary">
              {user?.badgeCount || 0}
            </div>
            <div className="text-sm text-warm-textSecondary">Badges Earned</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-success-600">
              <CoinDisplay balance={user?.totalEarned || 0} size="lg" showIcon={false} />
            </div>
            <div className="text-sm text-gray-500">Total Earned</div>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-warm-primary">
              {user?.role || 'user'}
            </div>
            <div className="text-sm text-warm-textSecondary">Account Type</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
