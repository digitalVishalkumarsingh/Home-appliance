"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaCalendarCheck, FaUsers, FaRupeeSign, FaUserCog, FaRedo } from "react-icons/fa";
import Link from "next/link";

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalCustomers: number;
  totalRevenue: number;
  revenueChange: number;
  bookingsChange: number;
  customersChange: number;
  totalTechnicians: number;
  activeTechnicians: number;
  techniciansChange: number;
  avgTechnicianRating: number;
}

interface User {
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function AdminDashboardOptimized() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdminAuth = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      setLoadingProgress(10);

      // First check if we have any authentication data
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      // If no localStorage data, immediately redirect to login
      if (!token || !userStr) {
        router.push("/admin/login");
        return;
      }

      let userData: User;
      try {
        userData = JSON.parse(userStr);
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
      if (userData.role !== "admin") {
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

      setUser(userData);
      setLoadingProgress(100);

      // Show welcome message for fresh login
      const freshLogin = localStorage.getItem("freshAdminLogin");
      if (freshLogin === "true") {
        localStorage.removeItem("freshAdminLogin");
        toast.success(`Welcome to the admin dashboard, ${userData.name || userData.email}!`, {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error checking admin auth:", error);
      // Clear authentication data and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/admin/login");
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingProgress(80);

      // Use cookies for authentication instead of localStorage token
      const response = await fetch(`/api/admin/stats`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.stats) {
        setStats(data.stats);
        setLoadingProgress(100);
        setIsLoading(false);
      } else {
        throw new Error("Invalid stats response.");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard data.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      // Run authentication and stats fetching in parallel for faster loading
      const authPromise = checkAdminAuth();
      const statsPromise = fetchStats();

      try {
        await Promise.all([authPromise, statsPromise]);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    };

    loadDashboard();
  }, [checkAdminAuth, fetchStats]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
              : "Fetching dashboard stats..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || "Failed to load dashboard data"}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  setLoadingProgress(0);
                  fetchStats();
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaRedo className="mr-2" /> Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Welcome back! Here's what's happening with your business today.</p>
          </div>
          {user && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back,</p>
              <p className="text-lg font-medium text-gray-900">{user.name || user.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaCalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalBookings}</p>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/admin/bookings" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaUsers className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalCustomers}</p>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/admin/customers" className="text-sm text-green-600 hover:text-green-800">
              View all →
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaRupeeSign className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-semibold text-gray-900">
                ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0 }).format(stats.totalRevenue)}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/admin/reports" className="text-sm text-purple-600 hover:text-purple-800">
              View reports →
            </Link>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaUserCog className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-gray-600">Technicians</p>
              <p className="text-xl font-semibold text-gray-900">{stats.totalTechnicians}</p>
            </div>
          </div>
          <div className="mt-3">
            <Link href="/admin/technicians" className="text-sm text-orange-600 hover:text-orange-800">
              Manage →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/admin/bookings"
            className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50"
            aria-label="Manage Bookings"
          >
            <FaCalendarCheck className="h-4 w-4 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Manage Bookings</p>
              <p className="text-xs text-gray-600">View and manage all bookings</p>
            </div>
          </Link>
          <Link
            href="/admin/technicians"
            className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50"
            aria-label="Manage Technicians"
          >
            <FaUserCog className="h-4 w-4 text-orange-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">Manage Technicians</p>
              <p className="text-xs text-gray-600">Add and manage technicians</p>
            </div>
          </Link>
          <Link
            href="/admin/reports"
            className="flex items-center p-3 border border-gray-200 rounded hover:bg-gray-50"
            aria-label="View Reports"
          >
            <FaRupeeSign className="h-4 w-4 text-purple-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-900">View Reports</p>
              <p className="text-xs text-gray-600">Analytics and insights</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Load Full Dashboard Link */}
      <div className="text-center">
        <Link
          href="/admin/dashboard/full"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Load Full Dashboard
        </Link>
        <p className="mt-2 text-xs text-gray-500">
          The full dashboard includes detailed analytics and real-time data
        </p>
      </div>
    </div>
  );
}