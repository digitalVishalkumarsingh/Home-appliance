"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaUser, FaSignOutAlt, FaUserPlus } from "react-icons/fa";
import NotificationBadge from "./NotificationBadge";
import BookingNotification from "./BookingNotification";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isServicesDropdownOpen, setIsServicesDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [isOnAuthPage, setIsOnAuthPage] = useState(false);

  const handleServicesMouseEnter = () => setIsServicesDropdownOpen(true);
  const handleServicesMouseLeave = () => setIsServicesDropdownOpen(false);

  // For profile dropdown, we'll use click instead of hover
  const handleProfileMouseEnter = () => {
    // Keep this for better UX, but don't auto-close
    setIsProfileDropdownOpen(true);
  };

  // Remove auto-close on mouse leave
  const handleProfileMouseLeave = () => {
    // Don't auto-close the dropdown
  };

  // Function to toggle profile dropdown
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);
  const handleMobileToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Function to check and update user state
  const checkUserAuth = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      console.log("Header checking auth:", storedUser ? "User found" : "No user", token ? "Token found" : "No token");

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);
          console.log("Setting user in header:", userData.name || userData.email);
          setUser(userData);
        } catch (error) {
          console.error("Error parsing user data:", error);
          // Clear invalid user data
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
        }
      } else {
        console.log("No user data found, clearing user state");
        setUser(null);
      }
    }
  }, []);

  // Listen for storage events and check auth status
  useEffect(() => {
    // Set client-side rendering flag
    setIsClient(true);

    // Check user auth on initial load
    checkUserAuth();

    // Check if we're on an auth page (login/signup)
    const checkAuthPage = () => {
      if (typeof window !== 'undefined') {
        const onAuthPage = sessionStorage.getItem("onAuthPage") === "true";
        setIsOnAuthPage(onAuthPage);
      }
    };

    // Check initially
    checkAuthPage();

    // Listen for storage events (when another tab/window changes localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "token") {
        checkUserAuth();
      }
      if (e.key === "onAuthPage") {
        checkAuthPage();
      }
    };

    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Custom event for same-tab login/logout
    const handleAuthChange = () => {
      console.log("Auth change event detected");
      checkUserAuth();
      checkAuthPage();
    };
    window.addEventListener("authChange", handleAuthChange);

    // Check auth status periodically (every 2 seconds)
    const intervalId = setInterval(() => {
      checkUserAuth();
      checkAuthPage();
    }, 2000);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleAuthChange);
      clearInterval(intervalId);
    };
  }, [checkUserAuth]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close profile dropdown when clicking outside
      if (isProfileDropdownOpen) {
        const target = event.target as HTMLElement;

        // Get all relevant dropdown elements
        const profileDropdown = document.getElementById('profile-dropdown-container');
        const profileDropdownContent = document.getElementById('profile-dropdown-content');
        const mobileProfileDropdown = document.getElementById('profile-dropdown-container-mobile');
        const mobileProfileDropdownContent = document.getElementById('mobile-profile-dropdown-content');
        const profileToggleButton = document.getElementById('profile-toggle-button');
        const mobileProfileToggleButton = document.getElementById('mobile-profile-toggle-button');

        // Check if click is outside all dropdown elements
        const isOutsideDesktop =
          (profileDropdown && !profileDropdown.contains(target)) &&
          (profileDropdownContent && !profileDropdownContent.contains(target)) &&
          (profileToggleButton && !profileToggleButton.contains(target));

        const isOutsideMobile =
          (mobileProfileDropdown && !mobileProfileDropdown.contains(target)) &&
          (mobileProfileDropdownContent && !mobileProfileDropdownContent.contains(target)) &&
          (mobileProfileToggleButton && !mobileProfileToggleButton.contains(target));

        // Only close if click is outside all dropdown elements
        if ((isOutsideDesktop && isOutsideMobile) ||
            (isOutsideDesktop && !mobileProfileDropdown) ||
            (isOutsideMobile && !profileDropdown)) {
          setIsProfileDropdownOpen(false);
        }
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";
    setUser(null);

    // Dispatch custom event to notify other components about auth change
    window.dispatchEvent(new Event("authChange"));

    window.location.href = "/";
  };

  return (
    <div>
      <nav className="bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-900 text-white fixed top-0 left-0 w-full z-50 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-sm">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          {/* Logo Section */}
          <Link href="" className="flex items-center space-x-3">
            {/* Logo with fallback system */}
            {isClient ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative h-12 w-auto flex items-center"
              >
                <img
                  src="/Dizit-Solution.webp"
                  alt="Dizit Solution Logo"
                  className="h-12 w-auto"
                  style={{ objectFit: 'contain' }}
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    const imgElement = e.target as HTMLImageElement;
                    if (imgElement && imgElement.parentElement) {
                      imgElement.style.display = 'none';
                      const textNode = document.createElement('span');
                      textNode.className = 'text-white font-bold text-xl';
                      textNode.textContent = 'Dizit Solution';
                      imgElement.parentElement.appendChild(textNode);
                    }
                  }}
                />
              </motion.div>
            ) : (
              <span className="text-white font-bold text-xl">Dizit Solution</span>
            )}
          </Link>

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
            <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 bg-indigo-800/90 md:bg-transparent rounded-lg md:flex-row md:space-x-8 md:mt-0 md:items-center">
              <li>
                <Link
                  href="/"
                  className="block py-2 px-4 text-white hover:bg-indigo-500 hover:scale-105 rounded-md transition duration-200 md:p-0 md:hover:bg-transparent md:hover:text-yellow-300 relative md:after:absolute md:after:w-0 md:hover:after:w-full md:after:h-0.5 md:after:bg-yellow-300 md:after:bottom-[-5px] md:after:left-0 md:after:transition-all md:after:duration-300"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="block py-2 px-4 text-white hover:bg-indigo-500 hover:scale-105 rounded-md transition duration-200 md:p-0 md:hover:bg-transparent md:hover:text-yellow-300 relative md:after:absolute md:after:w-0 md:hover:after:w-full md:after:h-0.5 md:after:bg-yellow-300 md:after:bottom-[-5px] md:after:left-0 md:after:transition-all md:after:duration-300"
                >
                  About
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
                    className="flex items-center justify-between w-full py-2 px-4 text-white hover:bg-indigo-500 rounded-md md:p-0 md:hover:bg-transparent md:hover:text-yellow-300 transition duration-200 relative md:after:absolute md:after:w-0 md:hover:after:w-full md:after:h-0.5 md:after:bg-yellow-300 md:after:bottom-[-5px] md:after:left-0 md:after:transition-all md:after:duration-300"
                    type="button"
                    whileHover={{ scale: 1.05 }}
                  >
                    Services
                    <svg
                      className="w-4 h-4 ml-2"
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
                  {isServicesDropdownOpen && (
                    <motion.div
                      className="absolute z-10 bg-white text-gray-800 rounded-lg shadow-lg w-48 mt-2 dark:bg-gray-800 dark:text-gray-200"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="py-2 text-sm">
                        <Link
                          href="/acrepair"
                          className="block px-4 py-2 hover:bg-indigo-100 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          AC Services
                        </Link>
                        <Link
                          href="/washingmachine"
                          className="block px-4 py-2 hover:bg-indigo-100 dark:hover:bg-gray-700 dark:hover:text-white"
                        >
                          Washing Machine Services
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* For mobile: use click */}
                <div className="md:hidden">
                  <motion.button
                    className="flex items-center justify-between w-full py-2 px-4 text-white hover:bg-indigo-500 rounded-md transition duration-200"
                    type="button"
                    onClick={() => setIsServicesDropdownOpen(!isServicesDropdownOpen)}
                  >
                    Services
                    <svg
                      className="w-4 h-4 ml-2"
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
                  {isServicesDropdownOpen && (
                    <motion.div
                      className="bg-indigo-700 rounded-md mt-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="py-2 text-sm">
                        <Link
                          href="/services"
                          className="block px-6 py-2 text-white hover:bg-indigo-600 font-medium"
                          onClick={() => {
                            setIsServicesDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          All Services
                        </Link>
                        <Link
                          href="/acrepair"
                          className="block px-6 py-2 text-white hover:bg-indigo-600"
                          onClick={() => {
                            setIsServicesDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          AC Services
                        </Link>
                        <Link
                          href="/washingmachine"
                          className="block px-6 py-2 text-white hover:bg-indigo-600"
                          onClick={() => {
                            setIsServicesDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Washing Machine Services
                        </Link>
                        <Link
                          href="/services/refrigerator-services"
                          className="block px-6 py-2 text-white hover:bg-indigo-600"
                          onClick={() => {
                            setIsServicesDropdownOpen(false);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Refrigerator Services
                        </Link>
                        {/* Admin dashboard link removed from services dropdown */}
                      </div>
                    </motion.div>
                  )}
                </div>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="block py-2 px-4 text-white hover:bg-indigo-500 hover:scale-105 rounded-md transition duration-200 md:p-0 md:hover:bg-transparent md:hover:text-yellow-300 relative md:after:absolute md:after:w-0 md:hover:after:w-full md:after:h-0.5 md:after:bg-yellow-300 md:after:bottom-[-5px] md:after:left-0 md:after:transition-all md:after:duration-300"
                >
                  Contact
                </Link>
              </li>

              {/* Admin link removed */}

              {!isClient ? null : user ? (
                <li className="relative">
                  {/* For desktop: use hover */}
                  <div
                    id="profile-dropdown-container"
                    className="hidden md:block"
                    onMouseEnter={handleProfileMouseEnter}
                    onMouseLeave={handleProfileMouseLeave}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        <NotificationBadge />
                      </div>
                      <Link href="/profile">
                        <motion.div
                          className="flex items-center py-2 px-4 text-white hover:bg-indigo-500 rounded-md md:p-0 md:hover:bg-transparent md:hover:text-yellow-300 transition duration-200 relative md:after:absolute md:after:w-0 md:hover:after:w-full md:after:h-0.5 md:after:bg-yellow-300 md:after:bottom-[-5px] md:after:left-0 md:after:transition-all md:after:duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center justify-center mr-2 shadow-md">
                            <FaUser />
                          </div>
                          <span>{user.name || user.email}</span>
                        </motion.div>
                      </Link>
                      <motion.button
                        id="profile-toggle-button"
                        className="ml-1 p-1 text-white hover:bg-indigo-500 rounded-md md:hover:bg-transparent md:hover:text-yellow-300"
                        type="button"
                        onClick={toggleProfileDropdown}
                        aria-label="Toggle profile menu"
                      >
                        <svg
                          className="w-4 h-4"
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
                    </div>
                    {isProfileDropdownOpen && (
                      <motion.div
                        id="profile-dropdown-content"
                        className="absolute z-10 bg-white text-gray-800 rounded-lg shadow-lg w-48 mt-2 dark:bg-gray-800 dark:text-gray-200"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="py-2 text-sm">
                          <Link
                            href="/profile"
                            className="block px-4 py-2 hover:bg-indigo-100 dark:hover:bg-gray-700 dark:hover:text-white"
                          >
                            My Profile
                          </Link>
                          <Link
                            href="/bookings"
                            className="block px-4 py-2 hover:bg-indigo-100 dark:hover:bg-gray-700 dark:hover:text-white"
                          >
                            My Bookings
                          </Link>
                          {/* Admin dashboard link removed from header dropdown */}
                          <button
                            onClick={handleLogout}
                            className="w-full text-left flex items-center px-4 py-2 hover:bg-indigo-100 dark:hover:bg-gray-700 dark:hover:text-white"
                          >
                            <FaSignOutAlt className="mr-2" /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* For mobile: use click */}
                  <div className="md:hidden" id="profile-dropdown-container-mobile">
                    <div className="flex items-center justify-between w-full">
                      <Link
                        href="/profile"
                        className="flex-grow"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <motion.div
                          className="flex items-center py-2 px-4 text-white hover:bg-indigo-500 rounded-md transition duration-200"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center justify-center mr-2 shadow-md">
                            <FaUser />
                          </div>
                          <span>{user.name || user.email}</span>
                        </motion.div>
                      </Link>
                      <motion.button
                        id="mobile-profile-toggle-button"
                        className="p-2 text-white hover:bg-indigo-500 rounded-md"
                        type="button"
                        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                        aria-label="Toggle profile menu"
                      >
                        <svg
                          className="w-4 h-4"
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
                    </div>
                    {isProfileDropdownOpen && (
                      <motion.div
                        id="mobile-profile-dropdown-content"
                        className="bg-indigo-700 rounded-md mt-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="py-2 text-sm">
                          <Link
                            href="/profile"
                            className="block px-6 py-2 text-white hover:bg-indigo-600"
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            My Profile
                          </Link>
                          <Link
                            href="/bookings"
                            className="block px-6 py-2 text-white hover:bg-indigo-600"
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            My Bookings
                          </Link>
                          {/* Admin dashboard link removed from mobile menu */}
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full text-left flex items-center px-6 py-2 text-white hover:bg-indigo-600"
                          >
                            <FaSignOutAlt className="mr-2" /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </li>
              ) : !isOnAuthPage ? (
                <>
                  {/* Desktop login/signup buttons */}
                  <div className="hidden md:flex md:space-x-4">
                    <li>
                      <Link href="/login">
                        <button className="block py-2 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition duration-300 font-semibold">
                          Login
                        </button>
                      </Link>
                    </li>
                    <li>
                      <Link href="/signup">
                        <button className="block py-2 px-6 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-green-500/30 hover:scale-105 transition duration-300 font-semibold">
                          Sign Up
                        </button>
                      </Link>
                    </li>
                  </div>

                  {/* Mobile login/signup buttons */}
                  <div className="md:hidden w-full mt-4 space-y-2">
                    <li className="w-full">
                      <Link href="/login" className="w-full block">
                        <button
                          className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md shadow-md hover:bg-indigo-700 transition duration-300 font-semibold flex items-center justify-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <FaUser className="mr-2" /> Login
                        </button>
                      </Link>
                    </li>
                    <li className="w-full">
                      <Link href="/signup" className="w-full block">
                        <button
                          className="w-full py-3 px-4 bg-green-600 text-white rounded-md shadow-md hover:bg-green-700 transition duration-300 font-semibold flex items-center justify-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <FaUserPlus className="mr-2" /> Sign Up
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
      {/* Booking Notification Component */}
      {isClient && user && <BookingNotification />}
    </div>
  );
};

export default Header;
