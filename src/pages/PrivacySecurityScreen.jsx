import React, { useState } from 'react';
import {
  ArrowLeft,
  Lock,
  Mail,
  UserX,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Check,
  Loader,
  Shield,
  Smartphone,
  X
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';

const PrivacySecurityScreen = () => {
  const { setScreen, user, showToast, logout } = useAppContext();
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(false);

  // Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Change Email State
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');

  // Deactivate Account State
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateOtp, setDeactivateOtp] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Delete Account State
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteOtp, setDeleteOtp] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Password Change Confirmation State
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // OTP Request State
  const [otpLoading, setOtpLoading] = useState(false);

  const isGoogleUser = user?.auth_provider === 'google';

  const requestOtp = async (purpose) => {
    setOtpLoading(true);
    try {
      const response = await api.post('/users/me/request-otp', { purpose });
      showToast(response.data.message || 'OTP sent to your email', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to send OTP. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword || !passwordOtp) {
      showToast('Please fill in all fields including OTP', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setShowPasswordConfirm(true);
  };

  const confirmPasswordChange = async () => {
    setShowPasswordConfirm(false);
    setLoading(true);
    try {
      const response = await api.post('/users/me/change-password', {
        new_password: newPassword,
        otp_code: passwordOtp.trim(),
      });

      showToast(response.data.message || 'Password changed successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
      setActiveSection(null);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to change password. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (isGoogleUser) {
      showToast('Email changes are not available for Google OAuth accounts.', 'error');
      return;
    }

    if (!newEmail || !emailOtp) {
      showToast('Please fill in all fields including OTP', 'error');
      return;
    }

    if (!newEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/users/me/change-email', {
        new_email: newEmail,
        otp_code: emailOtp.trim(),
      });

      showToast(response.data.message || 'Email change request sent! Please check your new email for verification.', 'success');
      setNewEmail('');
      setEmailOtp('');
      setActiveSection(null);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to change email. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Deactivate Account (soft delete) ---
  const handleDeactivateAccount = async () => {
    if (!confirmDeactivate) {
      showToast('Please confirm that you want to deactivate your account', 'error');
      return;
    }
    if (!deactivateOtp) {
      showToast('Please enter the OTP sent to your email', 'error');
      return;
    }
    setShowDeactivateConfirm(true);
  };

  const confirmFinalDeactivation = async () => {
    setShowDeactivateConfirm(false);
    setLoading(true);
    try {
      const payload = {
        reason: deactivateReason || undefined,
        otp_code: deactivateOtp.trim(),
      };
      const response = await api.post('/users/me/deactivate', payload);
      showToast(response.data.message || 'Account deactivated successfully', 'success');
      // Properly logout to clear tokens before redirecting
      await logout();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to deactivate account. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Delete Account (hard delete) ---
  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      showToast('Please confirm that you want to permanently delete your account', 'error');
      return;
    }
    if (!deleteOtp) {
      showToast('Please enter the OTP sent to your email', 'error');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmFinalDeletion = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      const payload = {
        reason: deleteReason || undefined,
        otp_code: deleteOtp.trim(),
      };
      const response = await api.post('/users/me/delete', payload);
      showToast(response.data.message || 'Account deleted successfully', 'success');
      // Properly logout to clear tokens before redirecting
      await logout();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete account. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">

      {/* Deactivate Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <UserX className="w-6 h-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Account Deactivation</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Your account will be hidden from other users. All your data will be preserved and you can reactivate anytime by logging back in.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalDeactivation}
                className="flex-1 py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Account Deletion</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you absolutely sure? This action <strong>cannot be undone</strong> and will permanently delete all your data including posts, messages, connections, and profile.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalDeletion}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Confirmation Modal */}
      {showPasswordConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Lock className="w-6 h-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Password Change</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change your password? This action will update your account security.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPasswordConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmPasswordChange}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 pt-6">
        <button
          onClick={() => setScreen('SETTINGS')}
          className="p-2 rounded-full hover:bg-slate-200 mb-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6">Privacy & Security</h1>
      </div>

      <div className="flex-grow overflow-y-auto px-4 space-y-3">
        {/* Change Password Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveSection(activeSection === 'password' ? null : 'password')}
            className="flex items-center w-full p-4 hover:bg-slate-50 transition-colors"
          >
            <Lock className="w-5 h-5 mr-4 text-slate-600" />
            <span className="font-semibold text-base text-slate-800 flex-grow text-left">Change Password</span>
            <div className={`transform transition-transform ${activeSection === 'password' ? 'rotate-90' : ''}`}>
              <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 rotate-45"></div>
            </div>
          </button>

          {activeSection === 'password' && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={passwordOtp}
                    onChange={(e) => setPasswordOtp(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                  <button
                    onClick={() => requestOtp('password_change')}
                    disabled={otpLoading}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {otpLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    Get Code
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter the verification code sent to your email</p>
              </div>

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Change Password
              </button>
            </div>
          )}
        </div>

        {/* Change Email Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={() => !isGoogleUser && setActiveSection(activeSection === 'email' ? null : 'email')}
            className={`flex items-center w-full p-4 hover:bg-slate-50 transition-colors ${isGoogleUser ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <Mail className="w-5 h-5 mr-4 text-slate-600" />
            <span className="font-semibold text-base text-slate-800 flex-grow text-left">Change Email</span>
            {!isGoogleUser && (
              <div className={`transform transition-transform ${activeSection === 'email' ? 'rotate-90' : ''}`}>
                <div className="w-2 h-2 border-r-2 border-b-2 border-slate-400 rotate-45"></div>
              </div>
            )}
            {isGoogleUser && (
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Not Available</span>
            )}
          </button>

          {activeSection === 'email' && !isGoogleUser && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter new email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                  <button
                    onClick={() => requestOtp('email_change')}
                    disabled={otpLoading}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {otpLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    Get Code
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter the verification code sent to your current email</p>
              </div>

              <button
                onClick={handleChangeEmail}
                disabled={loading}
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Change Email
              </button>
            </div>
          )}

          {isGoogleUser && (
            <div className="px-4 pb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">Email Management Unavailable</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Email changes are not available for Google OAuth accounts. Your email is managed through your Google account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Deactivate Account Section (Soft Delete) */}
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveSection(activeSection === 'deactivate' ? null : 'deactivate')}
            className="flex items-center w-full p-4 hover:bg-amber-50 transition-colors"
          >
            <UserX className="w-5 h-5 mr-4 text-amber-500" />
            <span className="font-semibold text-base text-amber-700 flex-grow text-left">Deactivate Account</span>
            <div className={`transform transition-transform ${activeSection === 'deactivate' ? 'rotate-90' : ''}`}>
              <div className="w-2 h-2 border-r-2 border-b-2 border-amber-400 rotate-45"></div>
            </div>
          </button>

          {activeSection === 'deactivate' && (
            <div className="px-4 pb-4 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-800">What happens when you deactivate?</h4>
                    <ul className="text-sm text-amber-700 mt-1 list-disc ml-4 space-y-0.5">
                      <li>Your profile will be hidden from other users</li>
                      <li>All your data (posts, messages, connections) will be preserved</li>
                      <li>You can reactivate anytime by simply logging back in</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for deactivation (optional)</label>
                <textarea
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  placeholder="Tell us why you're taking a break..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deactivateOtp}
                    onChange={(e) => setDeactivateOtp(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                  <button
                    onClick={() => requestOtp('account_deactivation')}
                    disabled={otpLoading}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {otpLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    Get Code
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter the verification code sent to your email</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-deactivate"
                  checked={confirmDeactivate}
                  onChange={(e) => setConfirmDeactivate(e.target.checked)}
                  className="w-4 h-4 text-amber-600 bg-slate-100 border-slate-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="confirm-deactivate" className="text-sm text-slate-700">
                  I understand my account will be hidden until I log back in
                </label>
              </div>

              <button
                onClick={handleDeactivateAccount}
                disabled={loading || !confirmDeactivate}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                Deactivate Account
              </button>
            </div>
          )}
        </div>

        {/* Delete Account Section (Hard Delete) */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setActiveSection(activeSection === 'delete' ? null : 'delete')}
            className="flex items-center w-full p-4 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-5 h-5 mr-4 text-red-500" />
            <span className="font-semibold text-base text-red-600 flex-grow text-left">Delete Account</span>
            <div className={`transform transition-transform ${activeSection === 'delete' ? 'rotate-90' : ''}`}>
              <div className="w-2 h-2 border-r-2 border-b-2 border-red-400 rotate-45"></div>
            </div>
          </button>

          {activeSection === 'delete' && (
            <div className="px-4 pb-4 space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800">Permanent Deletion Warning</h4>
                    <ul className="text-sm text-red-700 mt-1 list-disc ml-4 space-y-0.5">
                      <li>This action <strong>cannot be undone</strong></li>
                      <li>All your posts, messages, connections, and data will be permanently removed</li>
                      <li>You will not be able to recover your account</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800">Consider deactivating instead</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      If you just need a break, deactivating your account will hide your profile while preserving your data. You can come back anytime.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for deletion (optional)</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  placeholder="Tell us why you're leaving..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Verification Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter 6-digit code"
                    maxLength="6"
                  />
                  <button
                    onClick={() => requestOtp('account_deletion')}
                    disabled={otpLoading}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {otpLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    Get Code
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Enter the verification code sent to your email</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confirm-delete"
                  checked={confirmDelete}
                  onChange={(e) => setConfirmDelete(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 rounded focus:ring-red-500"
                />
                <label htmlFor="confirm-delete" className="text-sm text-slate-700">
                  I understand that this action is permanent and cannot be undone
                </label>
              </div>

              <button
                onClick={handleDeleteAccount}
                disabled={loading || !confirmDelete}
                className="w-full py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Account Permanently
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 text-center text-xs text-slate-400">
        Version 1.0.0
      </div>
    </div>
  );
};

export default PrivacySecurityScreen;