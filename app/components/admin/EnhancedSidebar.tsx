"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// Removed framer-motion for better performance
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
  FaUserCog,
  FaUserPlus,
  FaWrench,
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
      name: "Technicians",
      href: "/admin/technicians",
      icon: FaUserCog,
      children: [
        { name: "All Technicians", href: "/admin/technicians", icon: FaUserCog },
        { name: "Add Technician", href: "/admin/technicians/add", icon: FaUserPlus },
        { name: "Performance", href: "/admin/technicians/performance", icon: FaWrench },
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
    {
      name: "Settings",
      href: "/admin/settings",
      icon: FaCog,
      children: [
        { name: "General Settings", href: "/admin/settings", icon: FaCog },
        { name: "Commission Settings", href: "/admin/settings/commission", icon: FaPercent },
        { name: "Technician Management", href: "/admin/technicians", icon: FaUserCog },
      ]
    },
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

  // Removed animation variants for better performance

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 flex flex-col bg-white border-r border-gray-200 z-50 overflow-hidden transition-transform duration-200 ${
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"
        } ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          {!isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="ml-3 text-lg font-semibold text-gray-900">
                  Dizit Admin
                </span>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/admin/dashboard" className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
            </Link>
          )}

          {isMobile && (
            <button
              className="text-gray-500 p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={toggleSidebar}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User profile section */}
        <div className={`px-6 py-4 border-b border-gray-200 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center">
              <div className="flex-shrink-0 relative">
                {userAvatar ? (
                  <img
                    className="h-10 w-10 rounded-full"
                    src={userAvatar}
                    alt={userName}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUser className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userRole}</p>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 relative">
              {userAvatar ? (
                <img
                  className="h-10 w-10 rounded-full"
                  src={userAvatar}
                  alt={userName}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <FaUser className="h-5 w-5 text-gray-500" />
                </div>
              )}
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="px-3 space-y-1">
            {navigation.map((item) => (
              <div key={item.name} className="group">
                {item.children ? (
                  <div>
                    <button
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded ${
                        isActive(item.href)
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSection(item.name)}
                    >
                      <div className="flex items-center">
                        <div className={`${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                          isActive(item.href)
                            ? "text-blue-600"
                            : "text-gray-400"
                          }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        {!isCollapsed && (
                          <span className="font-medium">
                            {item.name}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {!isCollapsed && (
                        <span className="text-gray-400">
                          {expandedSections[item.name] ? (
                            <FaAngleDown className="h-3 w-3" />
                          ) : (
                            <FaAngleRight className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </button>
                    {!isCollapsed && expandedSections[item.name] && (
                      <div className="pl-8 pr-2 py-1 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded ${
                              isActive(child.href) && pathname !== "/admin/dashboard"
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center">
                              <child.icon
                                className={`mr-3 h-3 w-3 ${
                                  isActive(child.href) ? "text-blue-600" : "text-gray-400"
                                }`}
                              />
                              <span>{child.name}</span>
                            </div>
                            {child.badge && (
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 text-sm font-medium rounded ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                        isActive(item.href)
                          ? "text-blue-600"
                          : "text-gray-400"
                        }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {!isCollapsed && (
                        <span className="font-medium">
                          {item.name}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && item.badge && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed ? (
            <div className="space-y-2">
              <button
                onClick={onLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded hover:bg-gray-50"
              >
                <div className="text-gray-400 mr-3">
                  <FaSignOutAlt className="h-4 w-4" />
                </div>
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 rounded hover:bg-gray-50 hover:text-gray-600"
                title="Sign out"
              >
                <FaSignOutAlt className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Collapse toggle button (desktop only) */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute top-1/2 -right-3 bg-white border border-gray-200 text-gray-600 p-1.5 rounded-full shadow-sm hover:shadow-md transition-all duration-200"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <FaChevronRight className="h-3 w-3" />
            ) : (
              <FaChevronLeft className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </>
  );
}
