"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import NotificationBadge from "./NotificationBadge";
import BookingNotification from "./BookingNotification";
import useAuth from "@/app/hooks/useAuth";
// Theme component temporarily disabled
// import ThemeToggle from "./ThemeToggle";
import UserProfileDropdown from "./UserProfileDropdown";

const Header = () => {
  const { user, fetchUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);


  const [isClient, setIsClient] = useState(false);
  const [isOnAuthPage, setIsOnAuthPage] = useState(false);

  // We'll handle this in the LayoutWrapper component instead

  const handleServicesMouseEnter = () => setIsServicesDropdownOpen(true);
  const handleServicesMouseLeave = () => setIsServicesDropdownOpen(false);
  const handleMobileToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Check if we're on an auth page (login/signup) and update client state
  useEffect(() => {
    setIsClient(true);

    const checkAuthPage = () => {
      if (typeof window !== 'undefined') {
        const onAuthPage = sessionStorage.getItem("onAuthPage") === "true";
        setIsOnAuthPage(onAuthPage);
      }
    };

    const handleAuthChange = () => {
      console.log('Header - authChange event received, refreshing user data');
      checkAuthPage();
      // Force refresh user data when auth changes
      if (fetchUser) {
        fetchUser();
      }
    };

    checkAuthPage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "onAuthPage") {
        checkAuthPage();
      }
    };

    // Check auth page status on auth changes and page loads
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("load", checkAuthPage);

    // Log authentication state for debugging
    if (typeof window !== 'undefined') {
      console.log("Auth state in Header:", {
        user: localStorage.getItem("user"),
        token: localStorage.getItem("token") ? "Token exists" : "No token"
      });
    }

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("load", checkAuthPage);
    };
  }, [fetchUser]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close mobile menu when clicking outside
      if (isMobileMenuOpen) {
        const mobileMenu = document.getElementById('navbar-dropdown');
        const mobileMenuButton = document.querySelector('[data-collapse-toggle="navbar-dropdown"]');

        if (mobileMenu && !mobileMenu.contains(target) &&
            mobileMenuButton && !mobileMenuButton.contains(target)) {
          setIsMobileMenuOpen(false);
        }
      }


    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Logout is now handled by the UserProfileDropdown component

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <nav className="bg-gradient-to-r from-blue-800 via-indigo-700 to-blue-900 text-white w-full shadow-none backdrop-blur-sm border-b-0">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto py-1 px-4">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-3 group">
            {/* Logo with fallback system */}
            {isClient ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative h-10 w-auto flex items-center"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-70 blur-xl transition duration-500"></div>
                <img
                  src="/Dizit-Solution.webp"
                  alt="Dizit Solution Logo"
                  className="h-10 w-auto relative z-10"
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const imgElement = e.target as HTMLImageElement;
                    if (imgElement && imgElement.parentElement) {
                      imgElement.style.display = 'none';
                      const textNode = document.createElement('span');
                      textNode.className = 'text-white font-bold text-2xl relative z-10';
                      textNode.textContent = 'Dizit Solution';
                      imgElement.parentElement.appendChild(textNode);
                    }
                  }}
                />
              </motion.div>
            ) : (
              <span className="text-white font-bold text-2xl">Dizit Solution</span>
            )}
          </Link>

          {/* Search Bar removed as per client request */}

          {/* Hamburger Button for Mobile */}
          <button
            data-collapse-toggle="navbar-dropdown"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-white rounded-lg md:hidden hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-white"
            aria-controls="navbar-dropdown"
            aria-expanded={isMobileMenuOpen ? "true" : "false"}
            onClick={handleMobileToggle}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-6 h-6"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>

          {/* Navbar Links */}
          <div
            className={`w-full md:w-auto md:flex ${isMobileMenuOpen ? "block" : "hidden"}`}
            id="navbar-dropdown"
          >
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 bg-indigo-800/95 backdrop-blur-md md:bg-transparent rounded-lg md:flex-row md:space-x-6 md:mt-0 md:items-center">
              <li>
                <Link
                  href="/"
                  className="group flex items-center py-2 px-4 text-white/90 hover:text-white hover:bg-indigo-500/50 rounded-md transition-all duration-300 md:px-3 md:py-1.5 md:hover:bg-white/10 md:backdrop-blur-lg"
                >
                  <span className="relative overflow-hidden">
                    Home
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-yellow-500 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="group flex items-center py-2 px-4 text-white/90 hover:text-white hover:bg-indigo-500/50 rounded-md transition-all duration-300 md:px-3 md:py-1.5 md:hover:bg-white/10 md:backdrop-blur-lg"
                >
                  <span className="relative overflow-hidden">
                    About
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-yellow-500 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </li>
              <li className="relative">
                {/* For desktop: use hover */}
                <div
                  className="hidden md:block"
                  onMouseEnter={handleServicesMouseEnter}
                  onMouseLeave={handleServicesMouseLeave}
                >
                  <motion.button
                    className="group flex items-center py-2 px-4 text-white/90 hover:text-white hover:bg-indigo-500/50 rounded-md transition-all duration-300 md:px-3 md:py-1.5 md:hover:bg-white/10 md:backdrop-blur-lg"
                    type="button"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="relative overflow-hidden flex items-center">
                      Services
                      <svg
                        className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:rotate-180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-yellow-500 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </motion.button>
                  <AnimatePresence>
                    {isServicesDropdownOpen && (
                      <motion.div
                        className="absolute z-10 bg-white/95 backdrop-blur-md text-gray-800 rounded-lg shadow-xl w-56 mt-2 border border-indigo-100 overflow-hidden"
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="py-2">
                          <div className="px-4 py-2 font-medium text-sm text-indigo-600 border-b border-indigo-100">
                            Our Services
                          </div>
                          <Link
                            href="/services"
                            className="flex items-center px-4 py-2.5 hover:bg-indigo-50 text-gray-700 group transition-colors"
                          >
                            <span className="w-8 h-8 mr-3 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">All Services</div>
                              <div className="text-xs text-gray-500">Browse all our services</div>
                            </div>
                          </Link>
                          <Link
                            href="/acrepair"
                            className="flex items-center px-4 py-2.5 hover:bg-indigo-50 text-gray-700 group transition-colors"
                          >
                            <span className="w-8 h-8 mr-3 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">AC Services</div>
                              <div className="text-xs text-gray-500">Repair & maintenance</div>
                            </div>
                          </Link>
                          <Link
                            href="/washingmachine"
                            className="flex items-center px-4 py-2.5 hover:bg-indigo-50 text-gray-700 group transition-colors"
                          >
                            <span className="w-8 h-8 mr-3 flex items-center justify-center rounded-full bg-green-100 text-green-600 group-hover:bg-green-200 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">Washing Machine</div>
                              <div className="text-xs text-gray-500">Repair & installation</div>
                            </div>
                          </Link>
                          <Link
                            href="/refrigeratorrepair"
                            className="flex items-center px-4 py-2.5 hover:bg-indigo-50 text-gray-700 group transition-colors"
                          >
                            <span className="w-8 h-8 mr-3 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">Refrigerator</div>
                              <div className="text-xs text-gray-500">Repair & maintenance</div>
                            </div>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* For mobile: use click */}
                <div className="md:hidden">
                  <motion.button
                    className="flex items-center justify-between w-full py-2 px-4 text-white/90 hover:text-white hover:bg-indigo-500/50 rounded-md transition-all duration-300"
                    type="button"
                    onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                  >
                    <span>Services</span>
                    <svg
                      className={`w-4 h-4 ml-2 transition-transform duration-300 ${isServicesDropdownOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 10 6"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="m1 1 4 4 4-4"
                      />
                    </svg>
                  </motion.button>
                  <AnimatePresence>
                    {isServicesDropdownOpen && (
                      <motion.div
                        className="bg-indigo-700/90 backdrop-blur-sm rounded-md mt-1 overflow-hidden"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="py-2 text-sm">
                          <Link
                            href="/services"
                            className="flex items-center px-6 py-3 text-white hover:bg-indigo-600/70 transition-colors"
                            onClick={() => {
                              setIsServicesDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <span className="w-7 h-7 mr-3 flex items-center justify-center rounded-full bg-white/20 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">All Services</div>
                              <div className="text-xs text-white/70">Browse all our services</div>
                            </div>
                          </Link>
                          <Link
                            href="/acrepair"
                            className="flex items-center px-6 py-3 text-white hover:bg-indigo-600/70 transition-colors"
                            onClick={() => {
                              setIsServicesDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <span className="w-7 h-7 mr-3 flex items-center justify-center rounded-full bg-white/20 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                                <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">AC Services</div>
                              <div className="text-xs text-white/70">Repair & maintenance</div>
                            </div>
                          </Link>
                          <Link
                            href="/washingmachine"
                            className="flex items-center px-6 py-3 text-white hover:bg-indigo-600/70 transition-colors"
                            onClick={() => {
                              setIsServicesDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <span className="w-7 h-7 mr-3 flex items-center justify-center rounded-full bg-white/20 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">Washing Machine</div>
                              <div className="text-xs text-white/70">Repair & installation</div>
                            </div>
                          </Link>
                          <Link
                            href="/refrigeratorrepair"
                            className="flex items-center px-6 py-3 text-white hover:bg-indigo-600/70 transition-colors"
                            onClick={() => {
                              setIsServicesDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <span className="w-7 h-7 mr-3 flex items-center justify-center rounded-full bg-white/20 text-white">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                              </svg>
                            </span>
                            <div>
                              <div className="font-medium">Refrigerator</div>
                              <div className="text-xs text-white/70">Repair & maintenance</div>
                            </div>
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="group flex items-center py-2 px-4 text-white/90 hover:text-white hover:bg-indigo-500/50 rounded-md transition-all duration-300 md:px-3 md:py-1.5 md:hover:bg-white/10 md:backdrop-blur-lg"
                >
                  <span className="relative overflow-hidden">
                    Contact
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-pink-500 to-yellow-500 group-hover:w-full transition-all duration-300"></span>
                  </span>
                </Link>
              </li>

              {/* Admin link removed */}

              {/* Theme Toggle - Temporarily disabled */}

              {/* User Profile or Login/Signup */}
              {!isClient ? null : user && user.email ? (
                <div className="flex items-center space-x-4 ml-4">
                  {/* Notification Icon */}
                  <li className="relative">
                    <NotificationBadge />
                  </li>
                  {/* User Profile Dropdown */}
                  <li className="relative">
                    <UserProfileDropdown />
                  </li>
                </div>
              ) : !isOnAuthPage ? (
                <>
                  {/* Desktop login/signup buttons */}
                  <div className="hidden md:flex md:space-x-4">
                    <li>
                      <Link href="/login">
                        <button className="group relative overflow-hidden py-3 px-8 bg-white/10 text-white rounded-full border border-white/20 hover:border-white/40 transition-all duration-300 font-semibold backdrop-blur-md hover:bg-white/20 hover:scale-105 hover:shadow-lg hover:shadow-white/20">
                          <span className="relative z-10 flex items-center gap-2">
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Login
                          </span>
                          <span className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></span>
                          <span className="absolute inset-0 rounded-full bg-white/5 transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-out"></span>
                        </button>
                      </Link>
                    </li>
                    <li>
                      <Link href="/signup">
                        <button className="group relative overflow-hidden py-3 px-8 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-300 font-semibold border border-white/20">
                          <span className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-full"></span>
                          <span className="relative z-10 flex items-center gap-2">
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Sign Up
                          </span>
                          <span className="absolute inset-0 rounded-full bg-white/10 transform scale-0 group-hover:scale-110 transition-transform duration-500 ease-out"></span>
                        </button>
                      </Link>
                    </li>


                  </div>

                  {/* Mobile login/signup buttons */}
                  <div className="md:hidden w-full mt-4 space-y-3">
                    <li className="w-full">
                      <Link href="/login" className="w-full block">
                        <button
                          className="group w-full py-3 px-4 bg-white/10 backdrop-blur-sm text-white rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 font-semibold flex items-center justify-center relative overflow-hidden"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <span className="relative z-10 flex items-center gap-2">
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            Customer Login
                          </span>
                        </button>
                      </Link>
                    </li>
                    <li className="w-full">
                      <Link href="/signup" className="w-full block">
                        <button
                          className="group w-full py-3 px-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300 font-semibold flex items-center justify-center relative overflow-hidden"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                          <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full transition-transform duration-700 ease-out group-hover:translate-x-full"></span>
                          <span className="relative z-10 flex items-center gap-2">
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                            Sign Up
                          </span>
                        </button>
                      </Link>
                    </li>
                  </div>
                </>
              ) : null}
            </ul>
          </div>
        </div>
      </nav>
      {/* Booking Notification Component - only for regular users */}
      {isClient && user && user.role === 'user' && <BookingNotification />}
    </div>
  );
};

export default Header;
