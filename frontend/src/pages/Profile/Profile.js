import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiUser, FiLock, FiSave, FiLogOut, FiUpload, FiTrash2, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CoinDisplay from '../../components/UI/CoinDisplay';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
const CROP_FRAME_SIZE = 280;
const CROPPED_OUTPUT_SIZE = 512;

function getInitials(firstName, lastName) {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

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
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropSaving, setCropSaving] = useState(false);
  const dragStateRef = useRef(null);

  useEffect(() => {
    setProfileForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      profilePicture: user?.profilePicture || ''
    });
  }, [user?.firstName, user?.lastName, user?.profilePicture]);

  const previewProfilePicture = useMemo(
    () => profileForm.profilePicture ?? user?.profilePicture ?? '',
    [profileForm.profilePicture, user?.profilePicture]
  );

  const cropBounds = useMemo(() => {
    if (!cropImage?.width || !cropImage?.height) {
      return {
        baseScale: 1,
        scaledWidth: CROP_FRAME_SIZE,
        scaledHeight: CROP_FRAME_SIZE,
        maxOffsetX: 0,
        maxOffsetY: 0
      };
    }

    const baseScale = Math.max(
      CROP_FRAME_SIZE / cropImage.width,
      CROP_FRAME_SIZE / cropImage.height
    );
    const effectiveScale = baseScale * cropScale;
    const scaledWidth = cropImage.width * effectiveScale;
    const scaledHeight = cropImage.height * effectiveScale;

    return {
      baseScale,
      scaledWidth,
      scaledHeight,
      maxOffsetX: Math.max(0, (scaledWidth - CROP_FRAME_SIZE) / 2),
      maxOffsetY: Math.max(0, (scaledHeight - CROP_FRAME_SIZE) / 2)
    };
  }, [cropImage, cropScale]);

  useEffect(() => {
    setCropX((prev) => clamp(prev, -cropBounds.maxOffsetX, cropBounds.maxOffsetX));
    setCropY((prev) => clamp(prev, -cropBounds.maxOffsetY, cropBounds.maxOffsetY));
  }, [cropBounds.maxOffsetX, cropBounds.maxOffsetY]);

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

  const handleProfilePictureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, profilePicture: 'Please choose an image file' }));
      e.target.value = '';
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_BYTES) {
      setErrors(prev => ({ ...prev, profilePicture: 'Image must be 2 MB or smaller' }));
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result || '');
      if (!src) {
        setErrors(prev => ({ ...prev, profilePicture: 'Could not read that image. Try another file.' }));
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        setCropImage({
          src,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });
        setCropScale(1);
        setCropX(0);
        setCropY(0);
        setCropModalOpen(true);
        setErrors(prev => ({ ...prev, profilePicture: '' }));
      };
      img.onerror = () => {
        setErrors(prev => ({ ...prev, profilePicture: 'Could not load that image. Try another file.' }));
      };
      img.src = src;
    };
    reader.onerror = () => {
      setErrors(prev => ({ ...prev, profilePicture: 'Could not read that image. Try another file.' }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveProfilePicture = () => {
    handleInputChange(profileForm, setProfileForm, 'profilePicture', '');
  };

  const closeCropModal = () => {
    if (cropSaving) return;
    dragStateRef.current = null;
    setCropModalOpen(false);
    setCropImage(null);
    setCropScale(1);
    setCropX(0);
    setCropY(0);
  };

  const handleCropPointerDown = (e) => {
    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCropX: cropX,
      startCropY: cropY
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleCropPointerMove = (e) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const nextX = clamp(
      drag.startCropX + (e.clientX - drag.startClientX),
      -cropBounds.maxOffsetX,
      cropBounds.maxOffsetX
    );
    const nextY = clamp(
      drag.startCropY + (e.clientY - drag.startClientY),
      -cropBounds.maxOffsetY,
      cropBounds.maxOffsetY
    );

    setCropX(nextX);
    setCropY(nextY);
  };

  const handleCropPointerUp = (e) => {
    if (dragStateRef.current?.pointerId === e.pointerId) {
      dragStateRef.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
  };

  const handleCropSave = async () => {
    if (!cropImage?.src || !cropImage.width || !cropImage.height) return;

    setCropSaving(true);
    try {
      const image = new window.Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = CROPPED_OUTPUT_SIZE;
        canvas.height = CROPPED_OUTPUT_SIZE;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setErrors(prev => ({ ...prev, profilePicture: 'Could not prepare cropped image.' }));
          setCropSaving(false);
          return;
        }

        const effectiveScale = cropBounds.baseScale * cropScale;
        const sourceSize = CROP_FRAME_SIZE / effectiveScale;
        const sourceX = clamp(
          (cropImage.width - sourceSize) / 2 - cropX / effectiveScale,
          0,
          Math.max(0, cropImage.width - sourceSize)
        );
        const sourceY = clamp(
          (cropImage.height - sourceSize) / 2 - cropY / effectiveScale,
          0,
          Math.max(0, cropImage.height - sourceSize)
        );

        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          CROPPED_OUTPUT_SIZE,
          CROPPED_OUTPUT_SIZE
        );

        const croppedDataUrl = canvas.toDataURL('image/png');
        handleInputChange(profileForm, setProfileForm, 'profilePicture', croppedDataUrl);
        setCropSaving(false);
        closeCropModal();
      };

      image.onerror = () => {
        setErrors(prev => ({ ...prev, profilePicture: 'Could not crop that image. Try another file.' }));
        setCropSaving(false);
      };

      image.src = cropImage.src;
    } catch (error) {
      setErrors(prev => ({ ...prev, profilePicture: 'Could not crop that image. Try another file.' }));
      setCropSaving(false);
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
            {previewProfilePicture ? (
              <img
                src={previewProfilePicture}
                alt={`${user?.firstName || 'User'} ${user?.lastName || ''}`.trim()}
                className="w-20 h-20 rounded-full object-cover ring-2 ring-warm-border"
              />
            ) : (
              <div className="w-20 h-20 bg-warm-primary rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {getInitials(user?.firstName, user?.lastName)}
                </span>
              </div>
            )}
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

      <AnimatePresence>
        {cropModalOpen && cropImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={closeCropModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-warm-border overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-warm-border px-5 py-4 bg-warm-container/40">
                <div>
                  <h3 className="text-lg font-semibold text-warm-text">Adjust Profile Photo</h3>
                  <p className="text-sm text-warm-textSecondary">Zoom and reposition the image inside the circle, then save it.</p>
                </div>
                <button
                  type="button"
                  onClick={closeCropModal}
                  className="rounded-lg p-2 text-warm-textSecondary hover:bg-warm-container"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                <div className="mx-auto flex items-center justify-center">
                  <div
                    className="relative overflow-hidden rounded-2xl bg-gray-900/95 touch-none cursor-grab active:cursor-grabbing"
                    style={{ width: CROP_FRAME_SIZE, height: CROP_FRAME_SIZE }}
                    onPointerDown={handleCropPointerDown}
                    onPointerMove={handleCropPointerMove}
                    onPointerUp={handleCropPointerUp}
                    onPointerCancel={handleCropPointerUp}
                  >
                    <img
                      src={cropImage.src}
                      alt="Crop preview"
                      className="absolute left-1/2 top-1/2 select-none pointer-events-none max-w-none"
                      style={{
                        width: `${cropBounds.scaledWidth}px`,
                        height: `${cropBounds.scaledHeight}px`,
                        transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px))`
                      }}
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-black/35" />
                      <div
                        className="absolute left-1/2 top-1/2 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
                        style={{
                          width: CROP_FRAME_SIZE - 20,
                          height: CROP_FRAME_SIZE - 20,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="block md:col-span-3">
                    <span className="mb-2 block text-sm font-medium text-warm-text">Zoom</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.01"
                      value={cropScale}
                      onChange={(e) => setCropScale(Number(e.target.value))}
                      className="w-full"
                    />
                  </label>
                  <p className="md:col-span-3 text-sm text-warm-textSecondary">
                    Drag the photo inside the circle to adjust its position. Use zoom if needed.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-warm-border bg-warm-container/25 px-5 py-4">
                <button
                  type="button"
                  onClick={closeCropModal}
                  className="rounded-lg border border-warm-border px-4 py-2 text-sm font-medium text-warm-text hover:bg-warm-container"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  disabled={cropSaving}
                  className="rounded-lg bg-warm-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {cropSaving ? 'Saving…' : 'Use this photo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  Profile Picture
                </label>
                <div className="flex flex-col gap-3 rounded-xl border border-warm-border bg-warm-container/20 p-4">
                  <div className="flex items-center gap-4">
                    {previewProfilePicture ? (
                      <img
                        src={previewProfilePicture}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-warm-border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-warm-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {getInitials(profileForm.firstName || user?.firstName, profileForm.lastName || user?.lastName)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-warm-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                        <FiUpload className="w-4 h-4" />
                        Upload from device
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureUpload}
                          className="hidden"
                        />
                      </label>
                      {previewProfilePicture && (
                        <button
                          type="button"
                          onClick={handleRemoveProfilePicture}
                          className="inline-flex items-center gap-2 rounded-lg border border-warm-border px-4 py-2 text-sm font-medium text-warm-text hover:bg-warm-container"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {errors.profilePicture && (
                  <p className="mt-1 text-sm text-danger-600">{errors.profilePicture}</p>
                )}
                <p className="mt-1 text-sm text-warm-textSecondary">
                  Upload an image from this device. JPG, PNG, or WebP up to 2 MB.
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
