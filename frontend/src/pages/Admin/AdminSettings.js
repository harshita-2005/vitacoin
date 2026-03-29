import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUser, 
  FiSettings,
  FiSave,
  FiBell,
  FiEye,
  FiEyeOff,
  FiX
} from 'react-icons/fi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

function formatUserDisplayName(u) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (u.username) return `@${u.username}`;
  return u.email || 'User';
}

const AdminSettings = () => {
  const { updateUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
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
    maxTasksPerUser: 50,
    maxChallengesPerUser: 20
  });

  const [broadcast, setBroadcast] = useState({ title: '', message: '', type: 'info' });
  /** Comma- or space-separated MongoDB user IDs; empty = all active users (User role). */
  const [broadcastUserIds, setBroadcastUserIds] = useState('');
  /** Resolved labels for valid Mongo IDs in the broadcast field (lookup via GET /api/admin/users/:id). */
  const [broadcastIdPreview, setBroadcastIdPreview] = useState({});
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);

  useEffect(() => {
    fetchAdminProfile();
    fetchSystemSettings();
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (profileData.newPassword && !profileData.currentPassword) {
      setMessage({ type: 'error', text: 'Enter current password to set a new password' });
      return;
    }

    try {
      setProfileLoading(true);
      const { data } = await axios.put('/api/auth/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email
      });
      updateUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email
      });

      if (profileData.newPassword) {
        await axios.put('/api/auth/change-password', {
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword
        });
      }

      setMessage({
        type: 'success',
        text: profileData.newPassword ? 'Profile and password updated successfully' : 'Profile updated successfully'
      });
      setProfileData((prev) => ({
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
      setProfileLoading(false);
    }
  };

  const handleSystemSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSettingsLoading(true);
      await axios.put('/api/admin/settings', systemSettings);
      setMessage({ type: 'success', text: 'System settings updated successfully' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update system settings' 
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const parseBroadcastUserIds = (raw) => {
    return String(raw || '')
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const isValidMongoId = (s) => /^[a-fA-F0-9]{24}$/.test(String(s));

  const handleBroadcastFormSubmit = (e) => {
    e.preventDefault();
    if (!broadcast.title.trim() || !broadcast.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    const ids = parseBroadcastUserIds(broadcastUserIds);
    if (ids.some((id) => !isValidMongoId(id))) {
      toast.error('Each user ID must be a 24-character ID from the Users page (comma or space separated).');
      return;
    }
    setShowBroadcastConfirm(true);
  };

  const closeBroadcastConfirm = () => {
    if (!broadcastLoading) setShowBroadcastConfirm(false);
  };

  const confirmBroadcastSend = async () => {
    const ids = parseBroadcastUserIds(broadcastUserIds);
    if (ids.some((id) => !isValidMongoId(id))) {
      toast.error('Invalid user ID. Copy IDs from the Users page.');
      return;
    }
    setBroadcastLoading(true);
    try {
      const body = {
        title: broadcast.title.trim(),
        message: broadcast.message.trim(),
        type: broadcast.type
      };
      if (ids.length > 0) body.userIds = ids;
      const { data } = await axios.post('/api/admin/notifications/broadcast', body, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(data.sent != null ? `Sent to ${data.sent} user(s).` : 'Sent.');
      setBroadcast({ title: '', message: '', type: 'info' });
      setBroadcastUserIds('');
      setBroadcastIdPreview({});
      setShowBroadcastConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not send');
    } finally {
      setBroadcastLoading(false);
    }
  };

  useEffect(() => {
    if (message.text) {
      clearMessage();
    }
  }, [message]);

  useEffect(() => {
    const uniqueValid = [
      ...new Set(parseBroadcastUserIds(broadcastUserIds).filter(isValidMongoId))
    ];
    if (uniqueValid.length === 0) {
      setBroadcastIdPreview({});
      return;
    }
    const ac = new AbortController();
    const idsSnapshot = [...uniqueValid];
    const timer = setTimeout(() => {
      setBroadcastIdPreview(() => {
        const next = {};
        idsSnapshot.forEach((id) => {
          next[id] = { loading: true };
        });
        return next;
      });

      Promise.all(
        idsSnapshot.map((id) =>
          axios
            .get(`/api/admin/users/${id}`, {
              signal: ac.signal,
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
            .then(({ data }) => ({ id, displayName: formatUserDisplayName(data) }))
            .catch((err) => {
              if (axios.isCancel(err) || err.code === 'ERR_CANCELED' || err.name === 'CanceledError') {
                return null;
              }
              return { id, error: 'Not found' };
            })
        )
      ).then((results) => {
        if (ac.signal.aborted) return;
        setBroadcastIdPreview((prev) => {
          const merged = { ...prev };
          results.forEach((r) => {
            if (!r || !idsSnapshot.includes(r.id)) return;
            if (r.displayName) merged[r.id] = { displayName: r.displayName };
            else if (r.error) merged[r.id] = { error: r.error };
          });
          return merged;
        });
      });
    }, 350);
    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [broadcastUserIds]);

  const broadcastIdList = parseBroadcastUserIds(broadcastUserIds);
  const broadcastHasTargetIds = broadcastIdList.length > 0;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start">
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
                disabled={profileLoading}
              >
                <FiSave className="w-4 h-4 mr-2" />
                {profileLoading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* System Settings — compact card; grid uses items-start so it doesn’t stretch to match Profile height */}
        <div className="card border-warm-border/80 w-full lg:max-w-lg shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-xl mb-1">
              <FiSettings className="w-5 h-5" />
              System Settings
            </h2>
            <p className="text-sm text-warm-textSecondary mb-5 max-w-sm">
              Access, sign-ups, and notification defaults for the whole platform.
            </p>

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

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={settingsLoading}
              >
                <FiSave className="w-4 h-4 mr-2" />
                {settingsLoading ? 'Updating...' : 'Update Settings'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* User notifications (broadcast) */}
      <div className="card border-warm-border overflow-hidden">
        <div className="card-body pt-5 pb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <FiBell className="w-5 h-5 shrink-0 text-warm-primary" aria-hidden />
              <h2 className="card-title text-xl m-0">Notify users</h2>
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:pt-0.5 self-start sm:ml-auto">
              <span className="text-sm font-medium text-warm-textSecondary whitespace-nowrap">Style</span>
              <select
                className="select select-bordered select-sm h-9 min-h-9 w-[9.5rem] max-w-[9.5rem] pl-3 pr-8 text-sm bg-base-100 border-warm-border/80 focus:border-warm-primary"
                value={broadcast.type}
                onChange={(e) => setBroadcast((p) => ({ ...p, type: e.target.value }))}
                aria-label="Notification style"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Important</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-warm-primary/25 bg-warm-primary/5 px-3.5 py-2.5 mb-4 text-sm text-warm-text leading-snug">
            <p className="m-0">Send a message to everyone or just selected users.</p>
          </div>

          <form onSubmit={handleBroadcastFormSubmit} className="space-y-4 max-w-xl">
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">User IDs (optional)</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full border-warm-border/80 font-mono text-sm"
                value={broadcastUserIds}
                onChange={(e) => setBroadcastUserIds(e.target.value)}
                placeholder="Leave empty for all users — or paste one ID, or several separated by comma or space"
                autoComplete="off"
              />
              {broadcastIdList.length > 0 && (
                <div
                  className="mt-2 space-y-1.5 rounded-lg border border-warm-border/50 bg-base-100/80 px-3 py-2"
                  aria-live="polite"
                >
                  {broadcastIdList.map((id, i) => (
                    <div
                      key={`${id}-${i}`}
                      className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
                    >
                      <code className="font-mono text-xs text-warm-textSecondary break-all">{id}</code>
                      {isValidMongoId(id) ? (
                        broadcastIdPreview[id]?.loading ? (
                          <span className="text-xs text-warm-textSecondary">Looking up…</span>
                        ) : broadcastIdPreview[id]?.displayName ? (
                          <span className="text-warm-text font-medium">— {broadcastIdPreview[id].displayName}</span>
                        ) : broadcastIdPreview[id]?.error ? (
                          <span className="text-xs text-error">— {broadcastIdPreview[id].error}</span>
                        ) : null
                      ) : (
                        <span className="text-xs text-warning">— Invalid ID (must be 24 hex characters)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-warm-textSecondary mt-1">
                Copy from the Users table or user profile. Admins are never notified.
              </p>
            </div>
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">Title</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full border-warm-border/80"
                value={broadcast.title}
                onChange={(e) => setBroadcast((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Scheduled maintenance tonight"
                maxLength={120}
              />
            </div>
            <div>
              <label className="label py-1">
                <span className="label-text font-medium">Message</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full min-h-[100px] border-warm-border/80 resize-y"
                value={broadcast.message}
                onChange={(e) => setBroadcast((p) => ({ ...p, message: e.target.value }))}
                placeholder="Short message users will see in the notification list."
                maxLength={500}
              />
            </div>
            <button
              type="submit"
              disabled={broadcastLoading}
              className="btn btn-primary"
            >
              {broadcastLoading
                ? 'Sending…'
                : broadcastHasTargetIds
                  ? 'Send to selected user(s)'
                  : 'Send to all users'}
            </button>
          </form>
        </div>
      </div>

      {showBroadcastConfirm && (
        <div
          className="fixed inset-0 bg-warm-text/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="broadcast-confirm-title"
          onClick={(e) => e.target === e.currentTarget && closeBroadcastConfirm()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-warm-card rounded-2xl shadow-xl border border-warm-border/90 max-w-md w-full ring-1 ring-warm-border/30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-warm-border/70 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="broadcast-confirm-title"
                  className="text-xl font-bold text-warm-text tracking-tight"
                >
                  {broadcastHasTargetIds ? 'Send to selected user(s)?' : 'Send to all users?'}
                </h2>
                <p className="text-sm text-warm-textSecondary mt-2 leading-relaxed">
                  {broadcastHasTargetIds ? (
                    <>
                      Sends one in-app notification to each matching <strong>active</strong> account with role{' '}
                      <strong>User</strong> for the <strong>{broadcastIdList.length}</strong> ID
                      {broadcastIdList.length === 1 ? '' : 's'} you entered. Admins are excluded.
                    </>
                  ) : (
                    <>
                      This will send one in-app notification to every <strong>active</strong> account with role{' '}
                      <strong>User</strong>. Admin accounts will not receive it.
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={closeBroadcastConfirm}
                disabled={broadcastLoading}
                className="shrink-0 text-warm-textSecondary hover:text-warm-text p-2 rounded-xl hover:bg-warm-container/80 disabled:opacity-50"
                aria-label="Close"
              >
                <FiX className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-5 sm:p-6 bg-warm-background/50 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={closeBroadcastConfirm}
                disabled={broadcastLoading}
                className="btn btn-ghost border border-warm-border text-warm-textSecondary hover:bg-warm-border/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBroadcastSend}
                disabled={broadcastLoading}
                className="btn btn-primary"
              >
                {broadcastLoading ? 'Sending…' : 'Yes, send now'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminSettings;
