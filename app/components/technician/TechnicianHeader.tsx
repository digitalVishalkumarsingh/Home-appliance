"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { FaUser, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { toast } from "react-hot-toast";
import  useAuth  from "../../hooks/useAuth";
import SimpleAvailabilityToggle from "./SimpleAvailabilityToggle";
import NotificationBadge from "./NotificationBadge";
import { logger } from "../../config/logger";

// Define types (aligned with auth.ts and AvailabilityToggle)
interface UserPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

export default function TechnicianHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Close menus on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  // Validate technician role
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== "technician") {
      logger.warn("Non-technician user accessed TechnicianHeader", { role: user?.role });
      toast.error("Unauthorized access. Redirecting to login.");
      // logout(); // Remove or replace with appropriate logout logic
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user?.role, router]);

  // Memoized isActive function
  const isActive = useCallback(
    (path: string) => pathname === path,
    [pathname]
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    try {
      // logout(); // Remove or replace with appropriate logout logic
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during logout";
      logger.error(errorMessage);
      toast.error("Failed to log out. Please try again.", { duration: 4000 });
    }
  }, [router]);

  if (authLoading) {
    return (
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white shadow-lg border-b border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <div className="bg-white p-1 rounded-full shadow-md">
                  <Image
                    src="/images/logo.png"
                    alt="Dizit Solutions"
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                </div>
                <span className="ml-3 text-xl font-bold tracking-tight">Dizit Solutions</span>
              </Link>
            </div>
            <div className="flex items-center">
              <div className="h-9 w-9 rounded-full bg-gray-400 animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Redirect handled by useAuth or middleware
  }

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white shadow-lg border-b border-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="bg-white p-1 rounded-full shadow-md">
                <Image
                  src="/images/logo.png"
                  alt="Dizit Solutions"
                  width={36}
                  height={36}
                  className="rounded-full"
                  unoptimized // Assuming local image, adjust if using external
                />
              </div>
              <span className="ml-3 text-xl font-bold tracking-tight">Dizit Solutions</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6 items-center">
            {/* Duty Toggle */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-white">Duty:</span>
                <SimpleAvailabilityToggle variant="header" />
              </div>
            </div>
            <NotificationBadge />
          </nav>

          {/* User profile and mobile menu button */}
          <div className="flex items-center">
            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
                aria-label="Open user menu"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md border-2 border-white/30">
                  <FaUser className="h-4 w-4 text-white" />
                </div>
                <span className="ml-2 text-sm font-medium text-white hidden md:block">
                  {user.name || user.email}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <Link
                    href="/technician/profile"
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive("/technician/profile") ? "bg-gray-100" : ""}`}
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="/technician/settings"
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${isActive("/technician/settings") ? "bg-gray-100" : ""}`}
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="ml-2 -mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-label={isMobileMenuOpen ? "Close main menu" : "Open main menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <FaTimes className="block h-6 w-6" /> : <FaBars className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-indigo-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <div className="px-3 py-2 space-y-3">
              {/* Mobile Duty Toggle */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Duty Status:</span>
                  <SimpleAvailabilityToggle variant="header" />
                </div>
              </div>

              {/* Mobile Notifications */}
              <div className="flex justify-center">
                <NotificationBadge />
              </div>
            </div>
            <div className="border-t border-indigo-700 pt-2">
              <Link
                href="/technician/profile"
                className={`block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-700 ${isActive("/technician/profile") ? "bg-indigo-700" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Your Profile
              </Link>
              <Link
                href="/technician/notifications"
                className={`block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-700 ${isActive("/technician/notifications") ? "bg-indigo-700" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Notifications
              </Link>
              <Link
                href="/technician/settings"
                className={`block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-700 ${isActive("/technician/settings") ? "bg-indigo-700" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-indigo-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}