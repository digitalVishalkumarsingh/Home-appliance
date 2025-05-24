"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import {  FaSpinner, FaBell, FaLock, FaShieldAlt, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import useAuth from '@/app/hooks/useAuth';
import AdminRedirect from '@/app/components/AdminRedirect';

interface UserSettings {
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacySettings: {
    shareBookingHistory: boolean;
    shareContactInfo: boolean;
    allowLocationTracking: boolean;
  };
}

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, syncTokenFromCookies } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications', 'privacy', 'security'
  const [settings, setSettings] = useState<UserSettings>({
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
      marketing: false,
    },
    privacySettings: {
      shareBookingHistory: false,
      shareContactInfo: false,
      allowLocationTracking: true,
    },
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Settings - Auth state:', { isLoading, isAuthenticated, hasUser: !!user });

    // Don't redirect while still loading
    if (isLoading) {
      console.log('Settings - Still loading, waiting...');
      return;
    }

    // If not authenticated, try to sync token from cookies first
    if (!isAuthenticated || !user) {
      console.log('Settings - Not authenticated, trying to sync token from cookies');
      const hasToken = syncTokenFromCookies();

      if (!hasToken) {
        console.log('Settings - No token found, redirecting to login');
        toast.error('Please log in to access settings');
        router.push('/login');
        return;
      } else {
        console.log('Settings - Token found, waiting for authentication to complete');
        // Token was found, wait for the auth hook to process it
        return;
      }
    }

    // User is authenticated, fetch settings
    console.log('Settings - User authenticated, fetching settings');
    fetchSettings();
  }, [isAuthenticated, isLoading, user, router, syncTokenFromCookies]);

  const fetchSettings = async () => {
    try {
      setIsLoadingSettings(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Settings - No token found in localStorage');
        toast.error('Authentication token not found. Please log in again.');
        router.push('/login');
        return;
      }

      console.log('Settings - Fetching settings with token');
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Settings - API response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Settings - 401 Unauthorized, clearing auth and redirecting');
          // Clear authentication data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please log in again.');
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();
      console.log('Settings - API data:', { success: data.success, hasSettings: !!data.settings });

      if (data.success) {
        setSettings(data.settings || {
          notificationPreferences: {
            email: true,
            sms: true,
            push: true,
            marketing: false,
          },
          privacySettings: {
            shareBookingHistory: false,
            shareContactInfo: false,
            allowLocationTracking: true,
          },
        });
      } else {
        throw new Error(data.message || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError('Failed to load your settings. Please try again later.');

      // If it's an authentication error, redirect to login
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save your settings. Please try again later.');
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    try {
      setIsSaving(true);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Settings - No token found for password change');
        toast.error('Authentication token not found. Please log in again.');
        router.push('/login');
        return;
      }

      console.log('Settings - Changing password');
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      console.log('Settings - Password change response:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        if (response.status === 401) {
          console.error('Settings - 401 Unauthorized during password change');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error('Session expired. Please log in again.');
          router.push('/login');
          return;
        }
        const data = await response.json();
        throw new Error(data.message || 'Failed to change password');
      }

      const data = await response.json();
      console.log('Settings - Password change data:', { success: data.success });

      if (data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError(null);
      } else {
        throw new Error(data.message || 'Failed to change password');
      }
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleNotification = (key: keyof UserSettings['notificationPreferences']) => {
    setSettings(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences[key],
      },
    }));
  };

  const handleTogglePrivacy = (key: keyof UserSettings['privacySettings']) => {
    setSettings(prev => ({
      ...prev,
      privacySettings: {
        ...prev.privacySettings,
        [key]: !prev.privacySettings[key],
      },
    }));
  };

  if (isLoading || isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
          <p className="text-gray-600">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminRedirect />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and settings</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-gray-50 p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'notifications'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FaBell className="mr-3 h-5 w-5" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'privacy'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FaShieldAlt className="mr-3 h-5 w-5" />
                  Privacy
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <FaLock className="mr-3 h-5 w-5" />
                  Security
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {error && (
                <div className="mb-6 bg-red-50 p-4 rounded-md">
                  <div className="flex">
                    <FaExclamationCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Manage how you receive notifications about your bookings, promotions, and account activity.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-xs text-gray-500">Receive booking confirmations and updates via email</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification('email')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          settings.notificationPreferences.email ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notificationPreferences.email ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-xs text-gray-500">Receive booking confirmations and updates via SMS</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification('sms')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          settings.notificationPreferences.sms ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notificationPreferences.sms ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-xs text-gray-500">Receive booking confirmations and updates via push notifications</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification('push')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          settings.notificationPreferences.push ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notificationPreferences.push ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Marketing Communications</h3>
                        <p className="text-xs text-gray-500">Receive promotions, offers, and newsletters</p>
                      </div>
                      <button
                        onClick={() => handleToggleNotification('marketing')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          settings.notificationPreferences.marketing ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.notificationPreferences.marketing ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Control how your information is used and shared.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Share Booking History</h3>
                        <p className="text-xs text-gray-500">Allow service providers to see your booking history</p>
                      </div>
                      <button
                        onClick={() => handleTogglePrivacy('shareBookingHistory')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          settings.privacySettings.shareBookingHistory ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.privacySettings.shareBookingHistory ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Share Contact Information</h3>
                        <p className="text-xs text-gray-500">Allow service providers to contact you directly</p>
                      </div>
                      <button
                        onClick={() => handleTogglePrivacy('shareContactInfo')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          settings.privacySettings.shareContactInfo ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.privacySettings.shareContactInfo ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Location Tracking</h3>
                        <p className="text-xs text-gray-500">Allow location tracking for better service</p>
                      </div>
                      <button
                        onClick={() => handleTogglePrivacy('allowLocationTracking')}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                          settings.privacySettings.allowLocationTracking ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            settings.privacySettings.allowLocationTracking ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Manage your account security and password.
                  </p>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                        minLength={8}
                      />
                      {newPassword && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600 mb-1">Password strength:</div>
                          <div className="flex space-x-1">
                            <div className={`h-1 w-1/4 rounded ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`h-1 w-1/4 rounded ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`h-1 w-1/4 rounded ${/[a-z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <div className={`h-1 w-1/4 rounded ${/\d/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Must contain: 8+ characters, uppercase, lowercase, number
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                        minLength={8}
                      />
                    </div>

                    {passwordError && (
                      <div className="bg-red-50 p-4 rounded-md">
                        <div className="flex">
                          <FaExclamationCircle className="h-5 w-5 text-red-400 mr-2" />
                          <p className="text-sm text-red-700">{passwordError}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <FaLock className="mr-2" />
                            Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Account Security</h3>

                    <div className="bg-yellow-50 p-4 rounded-md mb-6">
                      <div className="flex">
                        <FaExclamationCircle className="h-5 w-5 text-yellow-400 mr-2" />
                        <div>
                          <p className="text-sm text-yellow-700 font-medium">Important Security Information</p>
                          <p className="text-sm text-yellow-700 mt-1">
                            For your security, we recommend changing your password regularly and using a strong, unique password.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Forgot Your Password?</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            If you can't remember your current password, you can reset it using your email.
                          </p>
                        </div>
                        <Link
                          href="/forgot-password"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          Reset Password
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
