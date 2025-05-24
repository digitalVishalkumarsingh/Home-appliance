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
import AvailabilityToggle from "./AvailabilityToggle";
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
      <div className="md:w-64 bg-gradient-to-b from-blue-800 to-indigo-900 text-white h-screen fixed left-0 top-0 shadow-xl z-40">
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-400 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-400 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-400 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 bg-gray-400 rounded-full animate-pulse" />
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
        className={`w-64 bg-gradient-to-b from-blue-800 to-indigo-900 text-white h-screen fixed left-0 top-0 shadow-xl z-40 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        role="navigation"
        aria-label="Technician sidebar"
      >
        {/* User Profile Summary */}
        <div className="p-4 border-b border-blue-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md border-2 border-white/30">
              <FaUser className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-sm">{user.name || user.email}</p>
              <p className="text-xs text-blue-300">Technician</p>
            </div>
          </div>
          <div className="mt-2">
            <AvailabilityToggle />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Link
              href="/technician/notifications"
              className="flex items-center text-blue-200 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="relative mr-2">
                <NotificationBadge />
              </div>
              <span className="text-sm">Notifications</span>
            </Link>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "bg-indigo-700 text-white"
                      : "text-blue-100 hover:bg-blue-700/50"
                  }`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  <span className={isActive(link.href) ? "text-white" : "text-blue-300"}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                  {isActive(link.href) && (
                    <span
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      aria-hidden="true"
                    />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-8 w-full px-4">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 text-blue-200 hover:bg-red-600/20 hover:text-white rounded-lg transition-colors"
          >
            <FaSignOutAlt className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}