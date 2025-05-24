'use client';

// User Profile Page - Next.js 15 Compatible
// Handles user profile display and updates with backend API integration

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import OrderHistory from '@/app/components/OrderHistory';
import AdminRedirect from '@/app/components/AdminRedirect';
import useAuth from '@/app/hooks/useAuth';

interface UserProfile {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profileImage?: string;
  role?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, isAuthenticated, isLoading: authLoading, logout: authLogout, syncTokenFromCookies } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'orders'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    address: '',
    profileImage: ''
  });

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          authLogout();
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
          profileImage: data.user.profileImage || ''
        });
      } else {
        throw new Error(data.message || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      toast.error(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debug authentication state
    console.log('Profile page - Auth state:', {
      authLoading,
      isAuthenticated,
      authUser: authUser ? {
        email: authUser.email,
        role: authUser.role,
        userId: authUser.userId
      } : null,
      localStorage_token: typeof window !== 'undefined' ? !!localStorage.getItem('token') : 'N/A',
      localStorage_user: typeof window !== 'undefined' ? !!localStorage.getItem('user') : 'N/A'
    });

    // Wait for auth to initialize
    if (authLoading) {
      console.log('Profile page - Still loading auth...');
      return;
    }

    // Redirect if not authenticated
    if (!isAuthenticated || !authUser) {
      console.log('Profile page - Not authenticated, trying to sync token from cookies');
      const hasToken = syncTokenFromCookies();

      if (!hasToken) {
        console.log('Profile page - No token found, redirecting to login');
        router.push('/login');
        return;
      } else {
        console.log('Profile page - Token found, waiting for authentication to complete');
        // Token was found, wait for the auth hook to process it
        return;
      }
    }

    // Redirect admin users
    if (authUser.role === 'admin') {
      console.log('Profile page - Admin user, redirecting to admin dashboard');
      router.push('/admin/dashboard');
      return;
    }

    // Redirect technician users
    if (authUser.role === 'technician') {
      console.log('Profile page - Technician user, redirecting to technician dashboard');
      router.push('/technician/dashboard');
      return;
    }

    console.log('Profile page - Regular user, fetching profile');
    // Fetch profile for regular users
    fetchUserProfile();
  }, [authLoading, isAuthenticated, authUser, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (updating) return; // Prevent double submission

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Session expired. Please log in again.');
        authLogout();
        return;
      }

      // Validate form data
      if (!formData.name || !formData.name.trim()) {
        toast.error('Name is required');
        return;
      }

      // Always send all fields, fallback to empty string if undefined
      const payload = {
        name: formData.name?.trim() || '',
        phone: formData.phone?.trim() || '',
        address: formData.address?.trim() || '',
        profileImage: formData.profileImage?.trim() || ''
      };

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          authLogout();
          return;
        }
        let errorMsg = 'Failed to update profile';
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch {}
        throw new Error(errorMsg + ` (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.success && data.user) {
        // Update local state
        setUser(data.user);
        setFormData({
          name: data.user.name || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          address: data.user.address || '',
          profileImage: data.user.profileImage || ''
        });
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    authLogout();
  };

  // Add AdminRedirect to prevent admin users from accessing this page
  return (
    <>
      <AdminRedirect />
      {(authLoading || loading) ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      ) : !user ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Not Logged In</h2>
            <p className="text-gray-600 mb-6">Please log in to view your profile</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      ) : (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
            <div className="flex flex-col md:flex-row items-center">
              <div className="mb-4 md:mb-0 md:mr-6">
                <div className="relative">
                  {formData.profileImage ? (
                    <div className="relative">
                      <img
                        src={formData.profileImage}
                        alt={user.name || 'User'}
                        className="h-24 w-24 rounded-full object-cover border-4 border-white"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full bg-white text-blue-600 flex items-center justify-center text-3xl font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-center md:text-left">{user.name || 'User'}</h1>
                <p className="text-blue-100 text-center md:text-left">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                className={`px-6 py-4 font-medium text-sm focus:outline-none ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                Profile
              </button>
              <button
                className={`px-6 py-4 font-medium text-sm focus:outline-none ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('orders')}
              >
                Order History
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'profile' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>
                  ) : null}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        disabled={updating}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updating}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">


                    {/* Personal Information */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Personal Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                          <p className="mt-1 text-lg text-gray-800">{user.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                          <p className="mt-1 text-lg text-gray-800">{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                          <p className="mt-1 text-lg text-gray-800">{user.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Address</h3>
                          <p className="mt-1 text-lg text-gray-800">{user.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Account Settings</h2>
                  <div className="space-y-4">
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OrderHistory userEmail={user.email} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
      )}
    </>
  );
}
