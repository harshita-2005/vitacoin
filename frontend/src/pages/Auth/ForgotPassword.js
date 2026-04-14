import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiShield, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { requestPasswordReset, verifyPasswordResetOtp, resetPasswordWithOtp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const stepMeta = useMemo(() => ([
    {
      title: 'Forgot your password?',
      description: 'Enter your email and we will send a password reset OTP.'
    },
    {
      title: 'Verify OTP',
      description: 'Check your email inbox and enter the OTP we sent you.'
    },
    {
      title: 'Set a new password',
      description: 'Choose a new password for your Vitacoin account.'
    }
  ]), []);

  const validateStep = () => {
    const nextErrors = {};

    if (step === 1) {
      if (!formData.email) {
        nextErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        nextErrors.email = 'Email is invalid';
      }
    }

    if (step === 2) {
      if (!formData.otp.trim()) {
        nextErrors.otp = 'OTP is required';
      } else if (!/^\d{6}$/.test(formData.otp.trim())) {
        nextErrors.otp = 'OTP must be 6 digits';
      }
    }

    if (step === 3) {
      if (!formData.newPassword) {
        nextErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 6) {
        nextErrors.newPassword = 'Password must be at least 6 characters';
      }

      if (!formData.confirmPassword) {
        nextErrors.confirmPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    setLoading(true);
    try {
      if (step === 1) {
        const result = await requestPasswordReset(formData.email);
        if (result.success) {
          setStep(2);
        }
      } else if (step === 2) {
        const result = await verifyPasswordResetOtp(formData.email, formData.otp);
        if (result.success) {
          setStep(3);
        }
      } else {
        const result = await resetPasswordWithOtp(
          formData.email,
          formData.otp,
          formData.newPassword
        );

        if (result.success) {
          navigate('/login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStep = stepMeta[step - 1];

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-background py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-warm-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg"
          >
            <span className="text-white font-bold text-2xl">V</span>
          </motion.div>

          <h2 className="text-3xl font-bold text-warm-text mb-2">{currentStep.title}</h2>
          <p className="text-warm-textSecondary">{currentStep.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => {
            const active = item === step;
            const complete = item < step;
            return (
              <div
                key={item}
                className={`h-2 rounded-full transition-colors ${
                  complete || active ? 'bg-warm-primary' : 'bg-warm-border'
                }`}
              />
            );
          })}
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
          onSubmit={handleSubmit}
        >
          {step === 1 && (
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email address</label>
              <div className="input-group">
                <FiMail className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input input-with-icon ${errors.email ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="form-group">
              <label htmlFor="otp" className="form-label">OTP code</label>
              <div className="input-group">
                <FiShield className="input-icon" />
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={formData.otp}
                  onChange={handleChange}
                  className={`input input-with-icon tracking-[0.4em] ${errors.otp ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                  placeholder="123456"
                />
              </div>
              {errors.otp && <p className="form-error">{errors.otp}</p>}

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await requestPasswordReset(formData.email);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="mt-3 text-sm font-semibold text-warm-primary hover:opacity-80 transition-colors"
              >
                Resend OTP
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">New password</label>
                <div className="input-group">
                  <FiLock className="input-icon" />
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`input input-with-icon pr-12 ${errors.newPassword ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-warm-container transition-colors"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-5 h-5 text-warm-textSecondary hover:text-warm-text" />
                    ) : (
                      <FiEye className="w-5 h-5 text-warm-textSecondary hover:text-warm-text" />
                    )}
                  </button>
                </div>
                {errors.newPassword && <p className="form-error">{errors.newPassword}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
                <div className="input-group">
                  <FiLock className="input-icon" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input input-with-icon pr-12 ${errors.confirmPassword ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-warm-container transition-colors"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="w-5 h-5 text-warm-textSecondary hover:text-warm-text" />
                    ) : (
                      <FiEye className="w-5 h-5 text-warm-textSecondary hover:text-warm-text" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
              </div>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-warm-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warm-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : step === 1 ? (
              'Send OTP'
            ) : step === 2 ? (
              'Verify OTP'
            ) : (
              'Reset password'
            )}
          </motion.button>

          <div className="text-center">
            <p className="text-sm text-warm-textSecondary">
              Remembered your password?{' '}
              <Link
                to="/login"
                className="font-semibold text-warm-primary hover:opacity-80 transition-colors duration-200"
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
