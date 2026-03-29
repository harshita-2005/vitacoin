import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiShield, 
  FiSettings,
  FiSave,
  FiBell,
  FiGlobe,
  FiDatabase,
  FiUsers,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import axios from 'axios';
const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    taskAutoExpiry: 30,
    challengeAutoExpiry: 7,
    maxTasksPerUser: 50,
    maxChallengesPerUser: 20
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    totalChallenges: 0,
    totalTransactions: 0,
    databaseSize: '0 MB'
  });

  useEffect(() => {
    fetchAdminProfile();
    fetchSystemSettings();
    fetchSystemStats();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      const { firstName, lastName, email } = response.data;
      setProfileData(prev => ({ ...prev, firstName, lastName, email }));
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings');
      setSystemSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get('/api/admin/system-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email
      };

      if (profileData.newPassword) {
        updateData.currentPassword = profileData.currentPassword;
        updateData.newPassword = profileData.newPassword;
      }

      await axios.put('/api/auth/profile', updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put('/api/admin/settings', systemSettings);
      setMessage({ type: 'success', text: 'System settings updated successfully' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update system settings' 
      });
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  useEffect(() => {
    if (message.text) {
      clearMessage();
    }
  }, [message]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Platform Settings</h1>
        <p className="text-gray-600 mt-1 max-w-3xl">
          Configure global platform settings, reward policies, and system preferences — for example default reward
          coins, difficulty scaling, and game timers where applicable.
        </p>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="card">
          <div className="card-body">
            <h2 className="card-title text-xl mb-6">
              <FiUser className="w-5 h-5" />
              Profile Settings
            </h2>
            
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">
                    <span className="label-text">First Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      firstName: e.target.value 
                    }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    <span className="label-text">Last Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      lastName: e.target.value 
                    }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ 
                    ...prev, 
                    email: e.target.value 
                  }))}
                  required
                />
              </div>

              <div className="divider">Change Password (Optional)</div>

              <div className="form-group">
                <label className="label">
                  <span className="label-text">Current Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input input-bordered w-full pr-10"
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      currentPassword: e.target.value 
                    }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="input input-bordered w-full pr-10"
                    value={profileData.newPassword}
                    onChange={(e) => setProfileData(prev => ({ 
                      ...prev, 
                      newPassword: e.target.value 
                    }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">
                  <span className="label-text">Confirm New Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData(prev => ({ 
                    ...prev, 
                    confirmPassword: e.target.value 
                  }))}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                <FiSave className="w-4 h-4 mr-2" />
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* System Settings */}
        <div className="card">
          <div className="card-body">
            <h2 className="card-title text-xl mb-6">
              <FiSettings className="w-5 h-5" />
              System Settings
            </h2>

            <form onSubmit={handleSystemSettingsSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label cursor-pointer flex flex-row items-start gap-3 justify-start w-full">
                  <input
                    type="checkbox"
                    className="toggle toggle-error shrink-0 mt-0.5"
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        maintenanceMode: e.target.checked
                      }))
                    }
                  />
                  <span className="label-text flex-1 text-left">
                    <span className="block font-medium">Maintenance Mode</span>
                    <span className="block text-sm text-gray-500 font-normal mt-1">
                      When enabled, only admins can access the system
                    </span>
                  </span>
                </label>
              </div>

              <div className="form-group">
                <label className="label cursor-pointer flex flex-row items-center gap-3 justify-start w-full">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary shrink-0"
                    checked={systemSettings.allowRegistrations}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        allowRegistrations: e.target.checked
                      }))
                    }
                  />
                  <span className="label-text flex-1 text-left">Allow User Registrations</span>
                </label>
              </div>

              <div className="form-group">
                <label className="label cursor-pointer flex flex-row items-center gap-3 justify-start w-full">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary shrink-0"
                    checked={systemSettings.emailNotifications}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        emailNotifications: e.target.checked
                      }))
                    }
                  />
                  <span className="label-text flex-1 text-left">Email Notifications</span>
                </label>
              </div>

              <div className="form-group">
                <label className="label">
                  <span className="label-text">Task Auto Expiry (days)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={systemSettings.taskAutoExpiry}
                  onChange={(e) => setSystemSettings(prev => ({ 
                    ...prev, 
                    taskAutoExpiry: parseInt(e.target.value) 
                  }))}
                  min="1"
                  max="365"
                />
              </div>

              <div className="form-group">
                <label className="label">
                  <span className="label-text">Challenge Auto Expiry (days)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={systemSettings.challengeAutoExpiry}
                  onChange={(e) => setSystemSettings(prev => ({ 
                    ...prev, 
                    challengeAutoExpiry: parseInt(e.target.value) 
                  }))}
                  min="1"
                  max="365"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                <FiSave className="w-4 h-4 mr-2" />
                {loading ? 'Updating...' : 'Update Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title text-xl mb-6">
            <FiDatabase className="w-5 h-5" />
            System Statistics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-primary">
                <FiUsers className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Users</div>
              <div className="stat-value text-primary">{stats.totalUsers}</div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-secondary">
                <FiSettings className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Tasks</div>
              <div className="stat-value text-secondary">{stats.totalTasks}</div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-accent">
                <FiShield className="w-8 h-8" />
              </div>
              <div className="stat-title">Challenges</div>
              <div className="stat-value text-accent">{stats.totalChallenges}</div>
            </div>

            <div className="stat bg-base-200 rounded-lg">
              <div className="stat-figure text-info">
                <FiDatabase className="w-8 h-8" />
              </div>
              <div className="stat-title">Transactions</div>
              <div className="stat-value text-info">{stats.totalTransactions}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminSettings;
