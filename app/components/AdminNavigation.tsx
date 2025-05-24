"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUserShield, FaSignInAlt, FaUserPlus, FaTachometerAlt, FaHome } from "react-icons/fa";
// Make sure the Button component exists at this path or update the path accordingly
import Button from "./ui/Button";
import { cn } from "@/app/lib/utils";

/**
 * Navigation item interface.
 */
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * Admin navigation component with a toggleable floating menu.
 */
export default function AdminNavigation() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: "Admin Login", path: "/admin/login", icon: <FaSignInAlt className="h-4 w-4" /> },
    { label: "Admin Signup", path: "/admin/signup", icon: <FaUserPlus className="h-4 w-4" /> },
    { label: "Admin Dashboard", path: "/admin/dashboard", icon: <FaTachometerAlt className="h-4 w-4" /> },
    { label: "Home Page", path: "/", icon: <FaHome className="h-4 w-4" /> },
  ];

  /**
   * Handles navigation to the specified path and closes the menu.
   * @param path - The route to navigate to.
   */
  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <Button
        variant="primary"
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-3 shadow-lg"
        aria-label="Toggle admin navigation"
        aria-expanded={isOpen}
        aria-controls="admin-nav-menu"
      >
        <FaUserShield className="h-6 w-6" />
      </Button>

      {/* Navigation Menu */}
      {isOpen && (
        <div
          id="admin-nav-menu"
          className={cn(
            "absolute bottom-16 right-0 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl",
            "transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          role="menu"
          aria-label="Admin navigation menu"
        >
          <h3 className="mb-3 flex items-center text-lg font-semibold text-gray-800">
            <FaUserShield className="mr-2 text-blue-600" />
            Admin Navigation
          </h3>
          <div className="space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                size="md"
                onClick={() => handleNavigate(item.path)}
                leftIcon={item.icon}
                fullWidth
                className="justify-start text-gray-700 hover:bg-blue-50"
                role="menuitem"
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="text-xs text-gray-500">
              Note: Admin credentials required for dashboard access.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}