"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaSignOutAlt, FaShoppingBag, FaCog, FaUserCircle, FaQuestionCircle, FaBell, FaHeart } from "react-icons/fa";
import useAuth from "@/app/hooks/useAuth";
import { toast } from "react-hot-toast";

export default function UserProfileDropdown() {
  const { user, logout, fetchUser } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for auth changes to refresh user data
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('UserProfileDropdown - authChange event received, refreshing user data');
      if (fetchUser) {
        fetchUser();
      }
    };

    window.addEventListener("authChange", handleAuthChange);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, [fetchUser]);

  // Handle logout with comprehensive cleanup
  const handleLogout = async () => {
    try {
      console.log('UserProfileDropdown - Starting logout process');
      setIsOpen(false);

      // Show loading toast
      const loadingToast = toast.loading("Logging out...");

      // Call the enhanced logout function from useAuth
      // This will handle all cleanup including cookies, localStorage, sessionStorage, cache, etc.
      await logout();

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Logged out successfully");

      // The logout function will handle the redirect, but add a fallback
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          router.push("/login");
        }
      }, 200);

    } catch (error) {
      console.error("UserProfileDropdown - Logout error:", error);

      // Even if logout fails, still clear everything and redirect
      try {
        localStorage.clear();
        sessionStorage.clear();

        // Clear cookies manually as fallback
        const cookiesToClear = ["token", "auth_token", "token_backup", "__stripe_mid"];
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
          document.cookie = `${cookieName}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
        });
      } catch (cleanupError) {
        console.error("UserProfileDropdown - Cleanup error:", cleanupError);
      }

      toast.success("Logged out successfully");
      router.push("/login");
    }
  };

  if (!user) {
    return (
      <div className="flex space-x-2">
        <Link
          href="/login"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-white rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
          {user && 'profileImage' in user && user.profileImage ? (
            <img
              src={typeof user.profileImage === 'string' ? user.profileImage : ''}
              alt={user.name || user.email}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <FaUserCircle className="w-full h-full" />
          )}
        </div>
        <span className="text-sm font-medium hidden md:block">
          {user.name || user.email.split('@')[0]}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 ring-1 ring-black ring-opacity-5"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name || "User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>

            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FaUser className="mr-2" />
                Your Profile
              </div>
            </Link>



            <Link
              href="/orders"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FaShoppingBag className="mr-2" />
                Your Orders
              </div>
            </Link>

            <Link
              href="/notifications"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FaBell className="mr-2" />
                Notifications
              </div>
            </Link>

            <Link
              href="/saved-services"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FaHeart className="mr-2" />
                Saved Services
              </div>
            </Link>

            <Link
              href="/settings"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FaCog className="mr-2" />
                Settings
              </div>
            </Link>

            <Link
              href="/support"
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <FaQuestionCircle className="mr-2" />
                Support
              </div>
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div className="flex items-center">
                <FaSignOutAlt className="mr-2" />
                Sign out
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


