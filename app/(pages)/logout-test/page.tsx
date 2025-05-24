"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSignOutAlt, FaTrash, FaCookieBite, FaDatabase, FaSync } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import useAuth from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LogoutTestPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Check current storage state
  const checkStorageState = () => {
    const localStorage_token = localStorage.getItem('token');
    const localStorage_user = localStorage.getItem('user');
    const sessionStorage_token = sessionStorage.getItem('token');
    const cookies = document.cookie;
    
    return {
      localStorage_token: !!localStorage_token,
      localStorage_user: !!localStorage_user,
      sessionStorage_token: !!sessionStorage_token,
      cookies: cookies.split(';').filter(c => c.includes('token') || c.includes('auth')),
      cookieCount: document.cookie.split(';').length
    };
  };

  const [storageState, setStorageState] = useState(checkStorageState());

  const refreshStorageState = () => {
    setStorageState(checkStorageState());
  };

  const handleEnhancedLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('LogoutTest - Starting enhanced logout');
      
      // Show before state
      const beforeState = checkStorageState();
      console.log('LogoutTest - Before logout:', beforeState);
      
      // Call enhanced logout
      await logout();
      
      // Check after state
      setTimeout(() => {
        const afterState = checkStorageState();
        console.log('LogoutTest - After logout:', afterState);
        setStorageState(afterState);
        setIsLoggingOut(false);
      }, 500);
      
    } catch (error) {
      console.error('LogoutTest - Error:', error);
      setIsLoggingOut(false);
      toast.error('Logout failed');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 mb-6">Please log in to test the logout functionality</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <FaSignOutAlt className="mr-3 text-red-500" />
            Enhanced Logout Test
          </h1>

          {/* User Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">Current User</h2>
            <p className="text-blue-700">Email: {user.email}</p>
            <p className="text-blue-700">Role: {user.role}</p>
            <p className="text-blue-700">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          </div>

          {/* Storage State */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FaDatabase className="mr-2" />
                Current Storage State
              </h2>
              <button
                onClick={refreshStorageState}
                className="flex items-center px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                <FaSync className="mr-1" />
                Refresh
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Local Storage</h3>
                <p className="text-sm">Token: {storageState.localStorage_token ? '✅ Present' : '❌ Missing'}</p>
                <p className="text-sm">User: {storageState.localStorage_user ? '✅ Present' : '❌ Missing'}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Session Storage</h3>
                <p className="text-sm">Token: {storageState.sessionStorage_token ? '✅ Present' : '❌ Missing'}</p>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <FaCookieBite className="mr-1" />
                  Cookies ({storageState.cookieCount})
                </h3>
                <div className="text-sm text-gray-600">
                  {storageState.cookies.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {storageState.cookies.map((cookie, index) => (
                        <li key={index}>{cookie.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No auth-related cookies found</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logout Actions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Logout Actions</h2>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEnhancedLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging out...
                </>
              ) : (
                <>
                  <FaTrash className="mr-2" />
                  Enhanced Logout (Clear Everything)
                </>
              )}
            </motion.button>

            <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
              <strong>What Enhanced Logout Does:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Calls logout API to clear server-side sessions</li>
                <li>Clears all localStorage items</li>
                <li>Clears all sessionStorage items</li>
                <li>Removes all authentication cookies (multiple domains/paths)</li>
                <li>Clears browser cache</li>
                <li>Clears IndexedDB (if any)</li>
                <li>Resets authentication state</li>
                <li>Redirects to login page</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
