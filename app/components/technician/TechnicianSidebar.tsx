"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaHome,
  FaCalendarCheck,
  FaRupeeSign,
  FaStar,
  FaChartLine,
  FaUser,
  FaHeadset,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import useAuth  from "../../hooks/useAuth";
// Removed AvailabilityToggle - now only in dashboard
import NotificationBadge from "./NotificationBadge";
import { logger } from "../../config/logger";

// Define types (aligned with auth.ts, AvailabilityToggle, NotificationBadge, TechnicianHeader)
interface UserPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

interface SidebarLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export default function TechnicianSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Validate technician role
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== "technician") {
      logger.warn("Non-technician user accessed TechnicianSidebar", { role: user?.role });
      toast.error("Unauthorized access. Redirecting to login.");
      logout();
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user?.role, logout, router]);

  // Memoized isActive function
  const isActive = useCallback(
    (href: string) => pathname === href,
    [pathname]
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    try {
      logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during logout";
      logger.error(errorMessage);
      toast.error("Failed to log out. Please try again.", { duration: 4000 });
    }
  }, [logout, router]);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Sidebar links
  const links: SidebarLink[] = [
    { href: "/technician/dashboard", icon: <FaHome className="w-5 h-5" />, label: "Dashboard" },
    { href: "/technician/bookings", icon: <FaCalendarCheck className="w-5 h-5" />, label: "Bookings" },
    { href: "/technician/earnings", icon: <FaRupeeSign className="w-5 h-5" />, label: "Earnings" },
    { href: "/technician/reviews", icon: <FaStar className="w-5 h-5" />, label: "Reviews" },
    { href: "/technician/performance", icon: <FaChartLine className="w-5 h-5" />, label: "Performance" },
    { href: "/technician/profile", icon: <FaUser className="w-5 h-5" />, label: "Profile" },
    { href: "/technician/support", icon: <FaHeadset className="w-5 h-5" />, label: "Support" },
    { href: "/technician/settings", icon: <FaCog className="w-5 h-5" />, label: "Settings" },
  ];

  if (authLoading) {
    return (
      <div className="md:w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 shadow-sm z-40">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Redirect handled by useAuth or middleware
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-700 text-white p-2 rounded-lg shadow-lg"
        aria-label={isMobileMenuOpen ? "Close sidebar menu" : "Open sidebar menu"}
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 shadow-sm z-40 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        role="navigation"
        aria-label="Technician sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/technician/dashboard" className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">Technician</span>
          </Link>
        </div>

        {/* User Profile Summary */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <FaUser className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="font-medium text-sm text-gray-900">{user.name || user.email}</p>
              <p className="text-xs text-gray-500">Technician</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <div className="relative mr-2">
                <NotificationBadge />
              </div>
              <span className="text-sm">Notifications</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="px-3 space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  <span className={isActive(link.href) ? "text-blue-600" : "text-gray-400"}>
                    {link.icon}
                  </span>
                  <span className="font-medium">{link.label}</span>
                  {isActive(link.href) && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4 text-gray-400" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}