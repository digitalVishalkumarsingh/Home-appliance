"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/app/hooks/useAuth';
import { FaSpinner, FaTimesCircle, FaUserShield, FaUser } from 'react-icons/fa';

export default function AdminCheckPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    // If user is admin, redirect to admin dashboard after a short delay
    if (!isLoading && isAuthenticated && isAdmin) {
      const timer = setTimeout(() => {
        router.push('/admin/dashboard');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Checking Authentication</h1>
          <p className="text-gray-600">Please wait while we verify your account...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
          <FaTimesCircle className="text-red-600 text-4xl mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Not Authenticated</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to access this page.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              {isAdmin ? (
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaUserShield className="text-blue-600 text-4xl" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <FaUser className="text-green-600 text-4xl" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              {isAdmin ? 'Admin User Detected' : 'Regular User Detected'}
            </h1>

            <p className="text-center text-gray-600 mb-6">
              {isAdmin
                ? 'You are logged in as an admin user. You will be redirected to the admin dashboard shortly.'
                : 'You are logged in as a regular user. You should see the user navigation bar.'}
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">User Information</h2>
              <p className="text-gray-700"><strong>Name:</strong> {user?.name || 'Not provided'}</p>
              <p className="text-gray-700"><strong>Email:</strong> {user?.email}</p>
              <p className="text-gray-700"><strong>Role:</strong> {user?.role}</p>
            </div>

            <div className="flex justify-center space-x-4">
              {isAdmin ? (
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go to Admin Dashboard
                </button>
              ) : (
                <button
                  onClick={() => router.push('/profile')}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Go to User Profile
                </button>
              )}

              <button
                onClick={() => setShowDebug(!showDebug)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
              </button>
            </div>

            {showDebug && (
              <div className="mt-8 p-4 bg-gray-800 text-white rounded-lg overflow-auto max-h-96">
                <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
                <pre className="text-xs">
                  {JSON.stringify({
                    user,
                    isAuthenticated,
                    isAdmin,
                    userNavBarShouldShow: isAuthenticated && user && user.role !== 'admin',
                    currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
