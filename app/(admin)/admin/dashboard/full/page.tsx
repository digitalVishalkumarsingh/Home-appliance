"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardOverview from "@/app/components/admin/DashboardOverview";
import OrdersManagement from "@/app/components/admin/OrdersManagement";
import DashboardAnalytics from "@/app/components/admin/DashboardAnalytics";
import BookingAlerts from "@/app/components/admin/BookingAlerts";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface User {
  role: string;
  name?: string;
  email?: string;
  id?: string;
}

export default function FullAdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const checkAdminAuth = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      setIsLoading(true);
      setLoadingProgress(10);

      // First check if we have any authentication data
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      // If no localStorage data, immediately redirect to login
      if (!token || !userStr) {
        router.push("/admin/login");
        return;
      }

      let user: User;
      try {
        user = JSON.parse(userStr);
        setLoadingProgress(30);
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        // Clear invalid data and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
        return;
      }

      // Check if user has admin role
      if (user.role !== "admin") {
        // Clear data and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
        return;
      }

      // Validate token with API - cookies are automatically sent
      const response = await fetch(`/api/admin/verify`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      setLoadingProgress(70);

      if (!response.ok) {
        // Clear invalid authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      if (!data.success) {
        // Clear invalid authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/admin/login");
        return;
      }

      setLoadingProgress(100);
      toast.success("Authenticated successfully!", { duration: 2000 });
      setIsLoading(false);
    } catch (error) {
      console.error("Error checking admin auth:", error);
      // Clear authentication data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    checkAdminAuth();

    // Show toast about dashboard
    const toastId = toast.loading("Loading full dashboard with real-time data...");
    return () => {
      toast.dismiss(toastId);
    };
  }, [checkAdminAuth]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading full dashboard...</p>
          <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {loadingProgress < 30
              ? "Checking authentication..."
              : loadingProgress < 70
              ? "Verifying admin access..."
              : "Fetching dashboard data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Full Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Complete overview with real-time data</p>
        </div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Simple Dashboard
        </Link>
      </div>

      {/* Dashboard Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${
            activeTab === "overview"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`py-4 px-6 font-medium text-sm focus:outline-none ${
            activeTab === "analytics"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      {/* Dashboard Content */}
      <div className="space-y-6">
        {activeTab === "overview" && (
          <>
            <BookingAlerts />
            <DashboardOverview />
            <OrdersManagement limit={5} showViewAll={true} />
          </>
        )}
        {activeTab === "analytics" && <DashboardAnalytics />}
      </div>

      {/* Performance Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-medium">Performance Note</p>
        <p className="mt-1">
          The full dashboard loads real-time data from multiple sources, which may affect performance. For a faster
          experience, use the{" "}
          <Link href="/admin/dashboard" className="underline hover:text-yellow-900">
            simple dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  );
}