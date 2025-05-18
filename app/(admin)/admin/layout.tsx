"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { toast } from "react-hot-toast";
import AdminHeader from "@/app/components/admin/AdminHeader";
import EnhancedSidebar from "@/app/components/admin/EnhancedSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    setIsClient(true);

    // Load dark mode preference from localStorage
    if (typeof window !== 'undefined') {
      const savedDarkMode = localStorage.getItem('adminDarkMode');
      if (savedDarkMode) {
        setIsDarkMode(savedDarkMode === 'true');
      }
    }

    const checkAuth = () => {
      // Simplified authentication check
      if (typeof window === 'undefined') {
        return;
      }

      setIsAuthChecking(true);

      try {
        const storedUser = localStorage.getItem("user");
        let token = localStorage.getItem("token");
        const freshLogin = localStorage.getItem("freshAdminLogin");

        console.log("Checking admin authentication...");

        // Check for fresh admin login flag
        if (freshLogin === "true") {
          console.log("Fresh admin login detected");
          // Clear the flag to prevent it from being used again
          localStorage.removeItem("freshAdminLogin");
        }

        // Check for token in both localStorage and cookies
        const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];

        if (!storedUser || (!token && !cookieToken)) {
          console.log("No user data or token found, redirecting to admin login");
          // Use direct location change instead of router
          window.location.href = "/admin/login";
          return;
        }

        // If token is in cookie but not in localStorage, sync them
        if (!token && cookieToken) {
          localStorage.setItem('token', cookieToken);
          token = cookieToken;
        }

        // Parse user data
        let userData;
        try {
          userData = JSON.parse(storedUser);
          console.log("User data found:", {
            email: userData.email,
            role: userData.role,
            name: userData.name
          });
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          // Clear potentially corrupted data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/admin/login";
          return;
        }

        // For demo purposes, we'll accept any token and user data with admin role
        // Set user data
        setUser(userData);
      } catch (error) {
        console.error("Error verifying authentication:", error);
        // Clear any potentially corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/admin/login";
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    console.log("Logging out admin user");

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear cookies
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict";

    // Show logout message
    toast.success("Logged out successfully");

    // Redirect to login page
    console.log("Redirecting to admin login page");
    window.location.href = "/admin/login";
  };

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You could also save this preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminDarkMode', (!isDarkMode).toString());
    }
  };

  if (!isClient) {
    return null; // Prevent hydration errors
  }

  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the user will be redirected in the useEffect
  // Dark mode preference is loaded in the first useEffect hook

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      {/* Admin Header */}
      <AdminHeader userName={user?.name} />

      {/* Sidebar toggle button - visible on mobile only */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <button
          className={`p-2 rounded-md ${isDarkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-500 bg-white'} shadow-md hover:bg-gray-100 focus:outline-none transition-all duration-200`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <FaBars className="h-6 w-6" />
        </button>
      </div>

      {/* Enhanced Sidebar */}
      <EnhancedSidebar
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        userName={user?.name || "Admin"}
        userRole={user?.role === "admin" ? "Administrator" : "User"}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content */}
      <main className={`pt-20 flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'
      } ${
        sidebarOpen ? 'ml-0 lg:ml-[280px]' : 'ml-0'
      }`}>
        {children}
      </main>
    </div>
  );
}
