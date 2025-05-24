'use client';

import { useEffect, useState } from 'react';
import { clearAllCache, clearAuthData } from '@/app/utils/clearCache';

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>({});
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Gather auth information
    const gatherAuthInfo = () => {
      const info: any = {
        localStorage: {},
        sessionStorage: {},
        cookies: {},
        timestamp: new Date().toISOString()
      };

      // Check localStorage
      if (typeof window !== 'undefined') {
        const authKeys = ['token', 'user', 'auth_token', 'token_backup'];
        authKeys.forEach(key => {
          const value = localStorage.getItem(key);
          info.localStorage[key] = value ? `${value.substring(0, 20)}...` : null;
        });

        // Check sessionStorage
        authKeys.forEach(key => {
          const value = sessionStorage.getItem(key);
          info.sessionStorage[key] = value ? `${value.substring(0, 20)}...` : null;
        });

        // Check cookies
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
          const [name, value] = cookie.trim().split('=');
          if (authKeys.includes(name)) {
            info.cookies[name] = value ? `${value.substring(0, 20)}...` : null;
          }
        });
      }

      setAuthInfo(info);
    };

    gatherAuthInfo();
    
    // Refresh info every 2 seconds
    const interval = setInterval(gatherAuthInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAuth = async () => {
    setIsClearing(true);
    try {
      clearAuthData();
      alert('✅ Authentication data cleared! Please refresh the page.');
      window.location.reload();
    } catch (error) {
      alert('❌ Error clearing auth data: ' + error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearAllCache = async () => {
    setIsClearing(true);
    try {
      await clearAllCache();
      alert('✅ All cache cleared! Page will reload.');
    } catch (error) {
      alert('❌ Error clearing cache: ' + error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleGoToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🔧 Authentication Debug Tool</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🚨 Authentication Issue Detected</h2>
          <p className="text-gray-600 mb-4">
            You're seeing this because there's an "Unauthorized" error in your application. 
            This usually means your authentication token has expired or is invalid.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleClearAuth}
              disabled={isClearing}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {isClearing ? '🔄 Clearing...' : '🔐 Clear Auth Data Only'}
            </button>
            
            <button
              onClick={handleClearAllCache}
              disabled={isClearing}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {isClearing ? '🔄 Clearing...' : '🧹 Clear All Cache & Data'}
            </button>
            
            <button
              onClick={handleGoToLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              🔑 Go to Login Page
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📊 Current Authentication State</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-600 mb-2">💾 localStorage</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre>{JSON.stringify(authInfo.localStorage, null, 2)}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-600 mb-2">🗂️ sessionStorage</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre>{JSON.stringify(authInfo.sessionStorage, null, 2)}</pre>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-600 mb-2">🍪 Cookies</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <pre>{JSON.stringify(authInfo.cookies, null, 2)}</pre>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Last updated: {authInfo.timestamp}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">🛠️ Troubleshooting Steps</h2>
          
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Click "Clear Auth Data Only" to remove just authentication data</li>
            <li>If that doesn't work, click "Clear All Cache & Data" for a complete reset</li>
            <li>Go to the login page and sign in again</li>
            <li>If the issue persists, check your network connection and try again</li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Clearing cache will log you out and remove any saved preferences. 
              You'll need to log in again after clearing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
