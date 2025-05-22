"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaUserShield, FaKey, FaTrash, FaSignInAlt, FaTachometerAlt } from 'react-icons/fa';

export default function AdminDebugPage() {
  const router = useRouter();
  const [authData, setAuthData] = useState<{
    token: string | null;
    user: any;
    cookieToken: string | null;
  }>({
    token: null,
    user: null,
    cookieToken: null,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // Get user data from localStorage
        const userStr = localStorage.getItem('user');
        let user = null;
        
        if (userStr) {
          try {
            user = JSON.parse(userStr);
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
        
        // Get token from cookies
        const cookieToken = document.cookie
          .split(';')
          .find(c => c.trim().startsWith('token='))
          ?.split('=')[1] || null;
        
        setAuthData({
          token,
          user,
          cookieToken,
        });
      } catch (error) {
        console.error('Error getting auth data:', error);
        toast.error('Error getting authentication data');
      }
    }
  }, []);

  const handleClearAuth = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('freshAdminLogin');
      
      // Clear cookies
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
      
      toast.success('Authentication data cleared!');
      
      // Update the state
      setAuthData({
        token: null,
        user: null,
        cookieToken: null,
      });
    } catch (error) {
      toast.error('Failed to clear auth data: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleSetAdminAuth = () => {
    try {
      // Create a mock admin user
      const adminUser = {
        _id: 'mock-admin-id',
        name: 'Debug Admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      
      // Create a mock token
      const token = 'mock-admin-token-' + Date.now();
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('freshAdminLogin', 'true');
      
      // Save to cookies
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
      
      toast.success('Admin authentication data set!');
      
      // Update the state
      setAuthData({
        token,
        user: adminUser,
        cookieToken: token,
      });
    } catch (error) {
      toast.error('Failed to set admin auth data: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (!isClient) {
    return null; // Prevent hydration errors
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <FaUserShield className="mr-2 text-blue-600" />
            Admin Authentication Debug
          </h1>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Current Authentication State</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">LocalStorage Token</h3>
                  <p className="mt-1 text-sm bg-gray-100 p-2 rounded font-mono break-all">
                    {authData.token || 'No token found'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cookie Token</h3>
                  <p className="mt-1 text-sm bg-gray-100 p-2 rounded font-mono break-all">
                    {authData.cookieToken || 'No cookie token found'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">User Data</h3>
                  {authData.user ? (
                    <pre className="mt-1 text-sm bg-gray-100 p-2 rounded font-mono overflow-auto max-h-40">
                      {JSON.stringify(authData.user, null, 2)}
                    </pre>
                  ) : (
                    <p className="mt-1 text-sm bg-gray-100 p-2 rounded">No user data found</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Admin Status</h3>
                  <p className="mt-1 text-sm">
                    {authData.user?.role === 'admin' ? (
                      <span className="text-green-600 font-semibold">✓ User has admin role</span>
                    ) : (
                      <span className="text-red-600 font-semibold">✗ User does not have admin role</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleSetAdminAuth}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaKey className="mr-2" />
                Set Admin Auth
              </button>
              
              <button
                onClick={handleClearAuth}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaTrash className="mr-2" />
                Clear Auth Data
              </button>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Navigation</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push('/admin/login')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FaSignInAlt className="mr-2" />
                  Admin Login
                </button>
                
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaTachometerAlt className="mr-2" />
                  Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
