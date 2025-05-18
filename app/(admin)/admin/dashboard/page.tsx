"use client";

import { useState, useEffect } from "react";
import DashboardOverview from "@/app/components/admin/DashboardOverview";
import OrdersManagement from "@/app/components/admin/OrdersManagement";
import DashboardAnalytics from "@/app/components/admin/DashboardAnalytics";
import BookingAlerts from "@/app/components/admin/BookingAlerts";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simplified authentication check
    const checkAdminAuth = () => {
      try {
        // Check if we're in the browser environment
        if (typeof window === 'undefined') {
          return;
        }

        setIsLoading(true);

        // Check for token in both localStorage and cookies
        let token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");
        const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1];

        // If no token in localStorage but found in cookies, sync them
        if (!token && cookieToken) {
          localStorage.setItem('token', cookieToken);
          token = cookieToken;
        }

        if ((!token && !cookieToken) || !userStr) {
          console.log("No authentication data found");
          toast.error("Please login as admin to access the dashboard");

          // Redirect to admin login
          window.location.href = "/admin/login";
          return;
        }

        // Parse user data
        let user;
        try {
          user = JSON.parse(userStr);
          console.log("User data found:", user);
        } catch (parseError) {
          console.error("Error parsing user data:", parseError);
          toast.error("Authentication error. Please login again.");
          window.location.href = "/admin/login";
          return;
        }

        // Check if this is a fresh login and show welcome message
        const freshLogin = localStorage.getItem("freshAdminLogin");
        if (freshLogin === "true") {
          // Clear the flag
          localStorage.removeItem("freshAdminLogin");
          // Show welcome toast
          toast.success(`Welcome to the admin dashboard, ${user.name || user.email}!`);
        }

        // Set loading to false to show the dashboard
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking admin auth:", error);
        toast.error("An error occurred. Please try again.");
      }
    };

    // Call the authentication check
    checkAdminAuth();
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your business performance
        </p>
      </div>

      {/* Dashboard Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${
            activeTab === "analytics"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <BookingAlerts />
            <DashboardOverview />
            <OrdersManagement limit={5} showViewAll={true} />
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <>
            <DashboardAnalytics />
          </>
        )}
      </div>
    </div>
  );
}
