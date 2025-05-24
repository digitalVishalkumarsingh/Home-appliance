"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaSpinner, FaCalendarCheck, FaUsers, FaRupeeSign, FaUserCog, FaRedo } from "react-icons/fa";
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

      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        throw new Error("No authentication data found. Please log in as admin.");
      }

      let userData: User;
      try {
        userData = JSON.parse(userStr);
        setLoadingProgress(30);
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        throw new Error("Invalid user data. Please log in again.");
      }

      if (userData.role !== "admin") {
        throw new Error("You don't have admin privileges.");
      }

      // Validate token with API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLoadingProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid or expired token.");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error("Token verification failed.");
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
      toast.error(error instanceof Error ? error.message : "An error occurred. Please try again.", {
        duration: 4000,
      });
      router.push("/admin/login");
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      setLoadingProgress(80);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      await checkAdminAuth();
      if (user) {
        await fetchStats();
      }
    };

    loadDashboard();

    const toastId = toast.loading("Loading dashboard with real-time data...");
    return () => {
      toast.dismiss(toastId);
    };
  }, [checkAdminAuth, fetchStats, user]);

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your business performance</p>
        {user && (
          <p className="text-sm text-blue-600">Welcome, {user.name || user.email}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FaCalendarCheck className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalBookings}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/admin/bookings" className="font-medium text-blue-700 hover:text-blue-900">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FaUsers className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalCustomers}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/admin/customers" className="font-medium text-blue-700 hover:text-blue-900">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <FaRupeeSign className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0 }).format(stats.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/admin/reports" className="font-medium text-blue-700 hover:text-blue-900">
                View reports
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <FaUserCog className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Technicians</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.totalTechnicians}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link href="/admin/technicians" className="font-medium text-blue-700 hover:text-blue-900">
                Manage
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/bookings"
            className="inline-block bg-blue-50 hover:bg-blue-100 p-4 rounded-lg text-center transition-colors"
            aria-label="Manage Bookings"
          >
            <FaCalendarCheck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <span className="text-blue-800 font-medium">Manage Bookings</span>
          </Link>
          <Link
            href="/admin/technicians"
            className="inline-block bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg text-center transition-colors"
            aria-label="Manage Technicians"
          >
            <FaUserCog className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <span className="text-yellow-800 font-medium">Manage Technicians</span>
          </Link>
          <Link
            href="/admin/reports"
            className="inline-block bg-purple-50 hover:bg-purple-100 p-4 rounded-lg text-center transition-colors"
            aria-label="View Reports"
          >
            <FaRupeeSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <span className="text-purple-800 font-medium">View Reports</span>
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