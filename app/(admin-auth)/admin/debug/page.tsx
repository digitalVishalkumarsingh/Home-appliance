"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function AdminDebug() {
  const [authData, setAuthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication data
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setAuthData({
            token: token.substring(0, 20) + "...", // Only show part of the token for security
            user: {
              ...user,
              // Don't show sensitive data if present
              password: user.password ? "[REDACTED]" : undefined
            },
            isAdmin: user.role === "admin"
          });
        } catch (parseError) {
          setAuthData({
            error: "Failed to parse user data",
            rawData: userStr
          });
        }
      } else {
        setAuthData({
          error: "No authentication data found",
          token: token ? "Present" : "Missing",
          user: userStr ? "Present" : "Missing"
        });
      }
    } catch (error) {
      setAuthData({
        error: "Error accessing localStorage",
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateMockAdmin = () => {
    try {
      // Create a mock admin user for testing
      const mockUser = {
        _id: "mock-admin-id",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin"
      };

      // Store in localStorage
      localStorage.setItem('token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('freshAdminLogin', 'true');

      // Show success message
      toast.success("Mock admin created successfully!");
      
      // Refresh the page to update the displayed data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to create mock admin: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleClearAuth = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('freshAdminLogin');
      toast.success("Authentication data cleared!");
      
      // Refresh the page to update the displayed data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear auth data: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Authentication Debug</h1>
          
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Authentication Status</h2>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                  {JSON.stringify(authData, null, 2)}
                </pre>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleCreateMockAdmin}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Create Mock Admin
                </button>
                
                <button
                  onClick={handleClearAuth}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Clear Auth Data
                </button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Navigation</h2>
                <div className="flex flex-wrap gap-4">
                  <a 
                    href="/admin/login" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Admin Login
                  </a>
                  <a 
                    href="/admin/dashboard" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Admin Dashboard
                  </a>
                  <a 
                    href="/" 
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Home Page
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
