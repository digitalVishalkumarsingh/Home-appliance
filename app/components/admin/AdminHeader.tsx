"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaUserCircle, FaCog, FaSignOutAlt } from 'react-icons/fa';
import AdminNotificationBadge from './AdminNotificationBadge';

interface AdminHeaderProps {
  userName?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ userName = 'Admin' }) => {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';

    // Redirect to admin login page
    router.push('/admin/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/admin/dashboard" className="flex-shrink-0 flex items-center">
              <img
                className="h-10 w-auto"
                src="/Dizit-Solution.webp"
                alt="Dizit Solutions"
              />
              <span className="ml-2 text-xl font-bold text-gray-800"></span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Admin Notifications */}
            <AdminNotificationBadge />

            {/* User dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 focus:outline-none"
                onClick={toggleDropdown}
              >
                <FaUserCircle className="h-8 w-8" />
                <span className="text-sm font-medium">{user?.name || userName}</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5">
                  <Link
                    href="/admin/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <div className="flex items-center">
                      <FaCog className="mr-2" />
                      Settings
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <FaSignOutAlt className="mr-2" />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
