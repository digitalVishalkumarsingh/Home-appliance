"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { FaUserShield, FaSignInAlt, FaUserPlus, FaTachometerAlt, FaHome } from 'react-icons/fa';

export default function AdminNavigation() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
        aria-label="Admin Navigation"
      >
        <FaUserShield className="h-6 w-6" />
      </button>

      {/* Navigation menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-64 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <FaUserShield className="mr-2 text-blue-600" />
            Admin Navigation
          </h3>
          
          <div className="space-y-2">
            <button
              onClick={() => handleNavigate('/admin/login')}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-blue-50 flex items-center text-gray-700"
            >
              <FaSignInAlt className="mr-2 text-blue-600" />
              Admin Login
            </button>
            
            <button
              onClick={() => handleNavigate('/admin/signup')}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-blue-50 flex items-center text-gray-700"
            >
              <FaUserPlus className="mr-2 text-blue-600" />
              Admin Signup
            </button>
            
            <button
              onClick={() => handleNavigate('/admin/dashboard')}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-blue-50 flex items-center text-gray-700"
            >
              <FaTachometerAlt className="mr-2 text-blue-600" />
              Admin Dashboard
            </button>
            
            <button
              onClick={() => handleNavigate('/')}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-blue-50 flex items-center text-gray-700"
            >
              <FaHome className="mr-2 text-blue-600" />
              Home Page
            </button>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Note: You need admin credentials to access the dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
