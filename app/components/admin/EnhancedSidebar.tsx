"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHome,
  FaCalendarAlt,
  FaUsers,
  FaTools,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes,
  FaBars,
  FaUser,
  FaAngleDown,
  FaAngleRight,
  FaClipboardList,
  FaMoneyBillWave,
  FaBell,
  FaQuestionCircle,
  FaMoon,
  FaSun,
  FaChevronLeft,
  FaChevronRight,
  FaPercent,
  FaPlus,
  FaGift,
  FaHeadset,
} from "react-icons/fa";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
  children?: NavItem[];
}

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onLogout: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

export default function EnhancedSidebar({
  isOpen,
  toggleSidebar,
  onLogout,
  userName = "Admin",
  userRole = "Administrator",
  userAvatar,
  isDarkMode = false,
  toggleDarkMode,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, isOpen, toggleSidebar]);

  // Navigation items with nested structure
  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/admin/dashboard", icon: FaHome },
    {
      name: "Bookings",
      href: "/admin/bookings",
      icon: FaCalendarAlt,
      badge: 5,
      children: [
        { name: "All Bookings", href: "/admin/bookings", icon: FaClipboardList },
        { name: "New Bookings", href: "/admin/bookings/created", icon: FaCalendarAlt, badge: 3 },
        { name: "Completed", href: "/admin/bookings/completed", icon: FaCalendarAlt },
        { name: "Cancelled", href: "/admin/bookings/cancelled", icon: FaCalendarAlt },
      ]
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: FaUsers,
      children: [
        { name: "All Customers", href: "/admin/customers", icon: FaUsers },
        { name: "Active", href: "/admin/customers/active", icon: FaUsers },
        { name: "Inactive", href: "/admin/customers/inactive", icon: FaUsers },
      ]
    },
    {
      name: "Services",
      href: "/admin/services",
      icon: FaTools,
      children: [
        { name: "All Services", href: "/admin/services", icon: FaTools },
        { name: "Categories", href: "/admin/services/categories", icon: FaTools },
        { name: "Pricing", href: "/admin/services/pricing", icon: FaMoneyBillWave },
      ]
    },
    {
      name: "Discounts",
      href: "/admin/discounts",
      icon: FaPercent,
      children: [
        { name: "All Discounts", href: "/admin/discounts", icon: FaPercent },
        { name: "Add New Discount", href: "/admin/discounts/new", icon: FaPlus },
      ]
    },
    {
      name: "Special Offers",
      href: "/admin/special-offers",
      icon: FaGift,
      children: [
        { name: "All Special Offers", href: "/admin/special-offers", icon: FaGift },
        { name: "Add New Offer", href: "/admin/special-offers/new", icon: FaPlus },
      ]
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: FaChartBar,
      children: [
        { name: "Overview", href: "/admin/reports", icon: FaChartBar },
        { name: "Sales", href: "/admin/reports/sales", icon: FaMoneyBillWave },
        { name: "Bookings", href: "/admin/reports/bookings", icon: FaCalendarAlt },
      ]
    },
    {
      name: "Support",
      href: "/admin/support",
      icon: FaHeadset,
      badge: 3,
      children: [
        { name: "All Tickets", href: "/admin/support", icon: FaHeadset },
        { name: "Open Tickets", href: "/admin/support?status=open", icon: FaHeadset, badge: 2 },
        { name: "In Progress", href: "/admin/support?status=in-progress", icon: FaHeadset, badge: 1 },
        { name: "Resolved", href: "/admin/support?status=resolved", icon: FaHeadset },
      ]
    },
    { name: "Settings", href: "/admin/settings", icon: FaCog },
    { name: "My Profile", href: "/admin/profile", icon: FaUser },
  ];

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard" && pathname === "/admin/dashboard") {
      return true;
    }
    return pathname?.startsWith(href) && href !== "/admin/dashboard";
  };

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Animation variants
  const sidebarVariants = {
    open: {
      width: isCollapsed ? "80px" : "280px",
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }
    },
    closed: {
      width: isMobile ? "0px" : "0px",
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    open: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    closed: { opacity: 0, x: -10, transition: { duration: 0.2 } }
  };

  const childVariants = {
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
        when: "beforeChildren"
      }
    },
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren"
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        ref={sidebarRef}
        className="fixed inset-y-0 left-0 flex flex-col bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 text-white z-50 shadow-2xl overflow-hidden"
        variants={sidebarVariants}
        animate={isOpen ? "open" : "closed"}
        initial={false}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-indigo-700/50 bg-indigo-900/30 backdrop-blur-sm">
          {!isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center">
              <div className="relative">
                <img
                  src="/Dizit-Solution.webp"
                  alt="Dizit Solutions Logo"
                  className="h-10 w-auto rounded-md"
                />
                <div className="absolute -inset-0.5 rounded-md bg-blue-500/20 blur-sm -z-10"></div>
              </div>
              <motion.span
                variants={itemVariants}
                className="ml-3 text-lg font-bold text-white tracking-wide"
              >
                Dizit Admin
              </motion.span>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center justify-center w-full">
              <div className="relative">
                <img
                  src="/logo-fallback.svg"
                  alt="Dizit Solutions Logo"
                  className="h-10 w-auto rounded-md"
                />
                <div className="absolute -inset-0.5 rounded-md bg-blue-500/20 blur-sm -z-10"></div>
              </div>
            </Link>
          )}

          {isMobile && (
            <button
              className="text-white p-2 rounded-md hover:bg-indigo-700/50 transition-colors"
              onClick={toggleSidebar}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User profile section */}
        <div className={`px-6 py-5 border-b border-indigo-700/50 bg-indigo-800/20 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center">
              <div className="flex-shrink-0 relative">
                {userAvatar ? (
                  <img
                    className="h-12 w-12 rounded-full ring-2 ring-blue-400/30"
                    src={userAvatar}
                    alt={userName}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-blue-400/30 shadow-lg">
                    <FaUser className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-indigo-900"></span>
              </div>
              <motion.div variants={itemVariants} className="ml-4">
                <p className="text-base font-medium text-white">{userName}</p>
                <p className="text-xs text-blue-200 mt-0.5">{userRole}</p>
              </motion.div>
            </div>
          ) : (
            <div className="flex-shrink-0 relative">
              {userAvatar ? (
                <img
                  className="h-12 w-12 rounded-full ring-2 ring-blue-400/30"
                  src={userAvatar}
                  alt={userName}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-blue-400/30 shadow-lg">
                  <FaUser className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-indigo-900"></span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-4 space-y-1.5">
            {navigation.map((item) => (
              <div key={item.name} className="group">
                {item.children ? (
                  <div>
                    <button
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? "bg-indigo-700/70 text-white shadow-md shadow-indigo-900/20"
                          : "text-blue-100 hover:bg-indigo-800/50 hover:shadow-md hover:shadow-indigo-900/10"
                      }`}
                      onClick={() => toggleSection(item.name)}
                    >
                      <div className="flex items-center">
                        <div className={`${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                          isActive(item.href)
                            ? "bg-indigo-600 text-white"
                            : "bg-indigo-800/50 text-blue-300 group-hover:bg-indigo-700/70 group-hover:text-white"
                          } h-8 w-8 rounded-md flex items-center justify-center transition-colors duration-200`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        {!isCollapsed && (
                          <motion.span variants={itemVariants} className="font-medium">
                            {item.name}
                          </motion.span>
                        )}
                      </div>
                      {!isCollapsed && item.badge && (
                        <motion.span
                          variants={itemVariants}
                          className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
                        >
                          {item.badge}
                        </motion.span>
                      )}
                      {!isCollapsed && (
                        <motion.span variants={itemVariants} className="text-blue-300 group-hover:text-white transition-colors duration-200">
                          {expandedSections[item.name] ? (
                            <FaAngleDown className="h-4 w-4" />
                          ) : (
                            <FaAngleRight className="h-4 w-4" />
                          )}
                        </motion.span>
                      )}
                    </button>
                    {!isCollapsed && (
                      <AnimatePresence>
                        {expandedSections[item.name] && (
                          <motion.div
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={childVariants}
                            className="overflow-hidden"
                          >
                            <div className="pl-12 pr-2 py-1 space-y-1 mt-1">
                              {item.children.map((child) => (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                                    isActive(child.href) && pathname !== "/admin/dashboard"
                                      ? "bg-indigo-700/50 text-white shadow-sm"
                                      : "text-blue-200 hover:bg-indigo-800/30 hover:text-white"
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <child.icon
                                      className={`mr-3 h-4 w-4 ${
                                        isActive(child.href) ? "text-blue-300" : "text-blue-400"
                                      }`}
                                    />
                                    <span>{child.name}</span>
                                  </div>
                                  {child.badge && (
                                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                      {child.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? "bg-indigo-700/70 text-white shadow-md shadow-indigo-900/20"
                        : "text-blue-100 hover:bg-indigo-800/50 hover:shadow-md hover:shadow-indigo-900/10"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                        isActive(item.href)
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-800/50 text-blue-300 group-hover:bg-indigo-700/70 group-hover:text-white"
                        } h-8 w-8 rounded-md flex items-center justify-center transition-colors duration-200`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {!isCollapsed && (
                        <motion.span variants={itemVariants} className="font-medium">
                          {item.name}
                        </motion.span>
                      )}
                    </div>
                    {!isCollapsed && item.badge && (
                      <motion.span
                        variants={itemVariants}
                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full"
                      >
                        {item.badge}
                      </motion.span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="p-6 border-t border-indigo-700/50 bg-indigo-900/30 backdrop-blur-sm">
          {!isCollapsed ? (
            <div className="space-y-3">
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-blue-100 rounded-lg hover:bg-indigo-700/50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="bg-indigo-800/50 h-8 w-8 rounded-md flex items-center justify-center mr-3">
                    {isDarkMode ? (
                      <FaSun className="h-4 w-4 text-blue-300" />
                    ) : (
                      <FaMoon className="h-4 w-4 text-blue-300" />
                    )}
                  </div>
                  <motion.span variants={itemVariants}>
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                  </motion.span>
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-blue-100 rounded-lg hover:bg-indigo-700/50 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="bg-indigo-800/50 h-8 w-8 rounded-md flex items-center justify-center mr-3">
                  <FaSignOutAlt className="h-4 w-4 text-blue-300" />
                </div>
                <motion.span variants={itemVariants}>Sign out</motion.span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              {toggleDarkMode && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-blue-100 rounded-lg hover:bg-indigo-700/50 transition-all duration-200 shadow-sm hover:shadow-md"
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                >
                  <div className="bg-indigo-800/50 h-8 w-8 rounded-md flex items-center justify-center">
                    {isDarkMode ? (
                      <FaSun className="h-4 w-4 text-blue-300" />
                    ) : (
                      <FaMoon className="h-4 w-4 text-blue-300" />
                    )}
                  </div>
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-2 text-blue-100 rounded-lg hover:bg-indigo-700/50 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Sign out"
              >
                <div className="bg-indigo-800/50 h-8 w-8 rounded-md flex items-center justify-center">
                  <FaSignOutAlt className="h-4 w-4 text-blue-300" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle button (desktop only) */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute top-1/2 -right-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-1.5 rounded-full shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 border-2 border-indigo-900/20"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <FaChevronRight className="h-3 w-3" />
            ) : (
              <FaChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}
      </motion.div>
    </>
  );
}
