"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUser,
  FaCalendarAlt,
  FaHistory,
  FaHeart,
  FaBell,
  FaHeadset,
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaSignOutAlt,
  FaTools
} from 'react-icons/fa';
import useAuth from '@/app/hooks/useAuth';
import { toast } from 'react-hot-toast';

const UserNavBar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#user-navbar') && !target.closest('#user-navbar-toggle')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close the menu when navigating to a new page
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  // Don't render if user is not authenticated or is an admin
  if (!isAuthenticated || !user || user.role === 'admin') {
    console.log('UserNavBar not rendering because:', {
      isAuthenticated,
      hasUser: !!user,
      isAdmin: user?.role === 'admin'
    });
    return null;
  }

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: <FaHome className="mr-2" />
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <FaUser className="mr-2" />
    },
    {
      name: 'My Bookings',
      path: '/bookings',
      icon: <FaCalendarAlt className="mr-2" />
    },
    {
      name: 'Order History',
      path: '/orders',
      icon: <FaHistory className="mr-2" />
    },
    {
      name: 'Saved Services',
      path: '/saved-services',
      icon: <FaHeart className="mr-2" />
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: <FaBell className="mr-2" />,
      badge: 3 // Example badge count
    },
    {
      name: 'Support',
      path: '/support',
      icon: <FaHeadset className="mr-2" />
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <FaCog className="mr-2" />
    }
  ];

  // Mobile version
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg z-40 border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          <Link href="/" className={`flex flex-col items-center justify-center text-xs ${pathname === '/' ? 'text-blue-600' : 'text-gray-600'}`}>
            <FaHome className="text-lg mb-1" />
            <span>Home</span>
          </Link>

          <Link href="/bookings" className={`flex flex-col items-center justify-center text-xs ${pathname === '/bookings' ? 'text-blue-600' : 'text-gray-600'}`}>
            <FaCalendarAlt className="text-lg mb-1" />
            <span>Bookings</span>
          </Link>

          <Link href="/services" className={`flex flex-col items-center justify-center text-xs ${pathname === '/services' ? 'text-blue-600' : 'text-gray-600'}`}>
            <FaTools className="text-lg mb-1" />
            <span>Services</span>
          </Link>

          <div
            id="user-navbar-toggle"
            className="flex flex-col items-center justify-center text-xs text-gray-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            <FaUser className="text-lg mb-1" />
            <span>Account</span>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              id="user-navbar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-t border-gray-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{user.name || 'User'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {navItems.filter(item => !['Home', 'Services'].includes(item.name)).map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center py-2 px-3 rounded-md ${pathname === item.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}

                  <button
                    onClick={handleLogout}
                    className="flex items-center py-2 px-3 rounded-md text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <FaSignOutAlt className="mr-2" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          <div className="flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium ${
                  pathname === item.path
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              <FaSignOutAlt className="mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNavBar;
