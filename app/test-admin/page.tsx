'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function TestAdminPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [adminData, setAdminData] = useState({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'admin123',
    phone: '1234567890'
  });

  const createTestAdmin = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/auth/admin-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Test admin created successfully!');
        toast.success('You can now login with admin@test.com / admin123');
      } else {
        toast.error(data.message || 'Failed to create admin');
      }
    } catch (error) {
      toast.error('Error creating admin: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  const testCurrentUser = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        toast.success(`Current user: ${userData.email} (Role: ${userData.role})`);
      } catch (error) {
        toast.error('Error parsing user data');
      }
    } else {
      toast.error('No user logged in');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🧪 Admin Testing Tool</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Create Test Admin User</h2>
          <p className="text-gray-600 mb-4">
            This will create a test admin user that you can use to test the admin dashboard functionality.
          </p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={adminData.name}
                onChange={(e) => setAdminData({...adminData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({...adminData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={adminData.password}
                onChange={(e) => setAdminData({...adminData, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={adminData.phone}
                onChange={(e) => setAdminData({...adminData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={createTestAdmin}
            disabled={isCreating}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? '🔄 Creating Admin...' : '👑 Create Test Admin'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Test Current User</h2>
          <p className="text-gray-600 mb-4">
            Check what user is currently logged in and their role.
          </p>
          
          <button
            onClick={testCurrentUser}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            🔍 Check Current User
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">📋 Testing Instructions</h2>
          
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Create a test admin user using the form above</li>
            <li>Go to <a href="/login" className="text-blue-600 hover:underline">/login</a> and login with the admin credentials</li>
            <li>After login, you should be redirected to the admin dashboard</li>
            <li>Check the user profile dropdown in the header - it should show "Admin Dashboard" option</li>
            <li>The dropdown should also show a blue "Admin" badge next to your name</li>
            <li>Click on "Admin Dashboard" to navigate to the admin panel</li>
          </ol>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> This is a development tool. In production, admin users should be created through proper admin management interfaces.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
