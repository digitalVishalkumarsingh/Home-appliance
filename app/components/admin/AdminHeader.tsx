"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { FaUserCircle, FaCog, FaSignOutAlt, FaBars } from 'react-icons/fa';
import AdminNotificationBadge from './AdminNotificationBadge';

interface AdminHeaderProps {
  user?: any;
  onMenuClick?: () => void;
  onLogout?: () => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ user, onMenuClick, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <FaBars className="h-5 w-5" />
            </button>
          </div>

          {/* Logo - hidden on mobile since it's in sidebar */}
          <div className="hidden lg:flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Admin Notifications */}
            <AdminNotificationBadge />

            {/* User dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-3 p-2 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                onClick={toggleDropdown}
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaUserCircle className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium hidden sm:block">{user?.name || user?.email || 'Admin'}</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 ring-1 ring-gray-200 border border-gray-200">
                  <Link
                    href="/admin/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FaUserCircle className="mr-3 h-4 w-4 text-gray-400" />
                    Your Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <FaCog className="mr-3 h-4 w-4 text-gray-400" />
                    Settings
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FaSignOutAlt className="mr-3 h-4 w-4" />
                    Sign out
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
