"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaSpinner,
  FaCalendarCheck,
  FaRupeeSign,
  FaStar,
  FaTools,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaCalendarAlt,
  FaChartLine,
  FaHistory,
  FaMapMarkerAlt,
  FaCheck,
  FaBell,
  FaUser,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";
import JobNotificationRinger from "@/app/components/JobNotificationRinger";
import JobNotificationAlert from "@/app/components/technician/JobNotificationAlert";
import SimpleAvailabilityToggle from "@/app/components/technician/SimpleAvailabilityToggle";

// Define Job interface
interface Job {
  id: string;
  bookingId: string;
  appliance: string;
  location: {
    address: string;
    distance: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  earnings: {
    total: number;
    technicianEarnings: number;
    adminCommission: number;
    adminCommissionPercentage: number;
  };
  customer: {
    name: string;
    phone?: string;
  };
  description?: string;
  urgency?: "normal" | "high" | "emergency";
  status?: string;
  createdAt: string;
}

// Define TechnicianStats interface
interface TechnicianStats {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalEarnings: number;
  pendingEarnings: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
  rating: number;
  bookingsChange: number;
  earningsChange: number;
}

// API response interface for type safety
interface ApiResponse {
  success: boolean;
  jobHistory?: Job[];
  bookings?: Job[];
  message?: string;
  totalBookings?: number;
  completedBookings?: number;
  pendingBookings?: number;
  totalEarnings?: number;
  pendingEarnings?: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
  rating?: number;
  bookingsChange?: number;
  earningsChange?: number;
  commissionRate?: number;
}

export default function TechnicianDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobHistory, setJobHistory] = useState<Job[]>([]);
  const [jobHistoryLoading, setJobHistoryLoading] = useState(false);
  const [jobHistoryError, setJobHistoryError] = useState<string | null>(null);
  const [stats, setStats] = useState<TechnicianStats>({
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    rating: 0,
    bookingsChange: 0,
    earningsChange: 0,
  });
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [commissionRate, setCommissionRate] = useState<number>(30);
  const [isAvailable, setIsAvailable] = useState(true);

  // Helper function to safely access localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const getUser = () => {
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Fetch with timeout to handle Vercel serverless limitations
  const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  };

  // Fetch commission rate with fallback
  const fetchCommissionRate = async () => {
    try {
      const response = await fetchWithTimeout(`/api/admin/settings/commission`, {});
      if (!response.ok) {
        console.log(`Commission rate API returned ${response.status}, using default`);
        setCommissionRate(30); // Default fallback
        return;
      }
      const data: ApiResponse = await response.json();
      if (data.success && data.commissionRate) {
        setCommissionRate(data.commissionRate);
        console.log("Commission rate fetched:", data.commissionRate);
      } else {
        console.log("Invalid commission rate response, using default");
        setCommissionRate(30); // Default fallback
      }
    } catch (error) {
      console.log("Commission rate fetch failed, using default 30%");
      setCommissionRate(30); // Default fallback
      // Don't show error toast for commission rate - it's not critical
    }
  };

  // Fetch technician stats with fallback
  const fetchTechnicianStats = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Try main endpoint first
      let response = await fetchWithTimeout(`/api/technicians/stats?timeRange=${timeRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // If main endpoint fails, try simple fallback
      if (!response.ok) {
        console.log("Main stats endpoint failed, trying fallback...");
        response = await fetchWithTimeout(`/api/technicians/stats/simple?timeRange=${timeRange}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      if (data.success) {
        setStats({
          totalBookings: data.totalBookings || 0,
          completedBookings: data.completedBookings || 0,
          pendingBookings: data.pendingBookings || 0,
          totalEarnings: data.totalEarnings || 0,
          pendingEarnings: data.pendingEarnings || 0,
          lastPayoutDate: data.lastPayoutDate,
          lastPayoutAmount: data.lastPayoutAmount,
          rating: data.rating || 0,
          bookingsChange: data.bookingsChange || 0,
          earningsChange: data.earningsChange || 0,
        });

        // Show message if using fallback data
        if (data.fallback) {
          console.log("Using fallback stats data");
          toast.success("Dashboard loaded with demo data");
        }
      } else {
        throw new Error(data.message || "Failed to fetch technician stats");
      }
    } catch (error) {
      console.error("Error fetching technician stats:", error);
      toast.error("Failed to fetch stats. Please try again.");

      // Set default stats if everything fails
      setStats({
        totalBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        lastPayoutDate: null,
        lastPayoutAmount: 0,
        rating: 0,
        bookingsChange: 0,
        earningsChange: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh job history with retry logic and fallback
  const refreshJobHistory = async (retries = 3, delay = 1000): Promise<void> => {
    try {
      setJobHistoryLoading(true);
      setJobHistoryError(null);
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Try main job history endpoint first
      let response = await fetchWithTimeout(`/api/technicians/jobs/history?limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // If main endpoint fails, try bookings API
      if (!response.ok) {
        console.log("Main job history endpoint failed, trying bookings API...");
        response = await fetchWithTimeout(`/api/bookings?limit=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      }

      // If bookings API also fails, try simple fallback
      if (!response.ok) {
        console.log("Bookings API failed, trying simple fallback...");
        response = await fetchWithTimeout(`/api/technicians/jobs/history/simple?limit=10`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch job history: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (data.success && (Array.isArray(data.jobHistory) || Array.isArray(data.bookings))) {
        const bookingsData = data.jobHistory || data.bookings || [];
        const formattedJobs: Job[] = bookingsData.map((booking: any) => {
          if (booking.id && booking.bookingId && booking.earnings) {
            return booking;
          }
          const adminCommissionPercentage = commissionRate;
          const totalAmount = booking.amount || 0;
          const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
          const technicianEarnings = totalAmount - adminCommission;
          return {
            id: booking._id || booking.id || `booking-${Math.random().toString(36).slice(2, 11)}`,
            bookingId: booking.bookingId || booking._id || booking.id || "Unknown",
            appliance: booking.service || booking.appliance || "Appliance Repair",
            location: {
              address: booking.address || booking.customerAddress || "Customer Address",
              distance: booking.distance || 0,
              coordinates: booking.location?.coordinates || booking.customerLocation,
            },
            earnings: {
              total: totalAmount,
              technicianEarnings,
              adminCommission,
              adminCommissionPercentage,
            },
            customer: {
              name: booking.customer?.name || booking.customerName || "Customer",
              phone: booking.customer?.phone || booking.customerPhone || "",
            },
            description: booking.notes || booking.serviceDetails || booking.description || "No description provided",
            urgency: booking.urgency || "normal",
            status: booking.status || "completed",
            createdAt: booking.createdAt || new Date().toISOString(),
          };
        });
        setJobHistory(formattedJobs);

        // Show message if using fallback data
        if (data.fallback) {
          console.log("Using fallback job history data");
          toast.success("Job history loaded with demo data");
        }
      } else if (data.success && Array.isArray(data.jobs)) {
        // Handle simple fallback format
        const formattedJobs: Job[] = data.jobs.map((job: any) => ({
          id: job._id || job.id || `job-${Math.random().toString(36).slice(2, 11)}`,
          bookingId: job.bookingId || job._id || "Unknown",
          appliance: job.serviceName || job.appliance || "Service",
          location: {
            address: job.address || "Customer Address",
            distance: 2.5,
            coordinates: job.location,
          },
          earnings: {
            total: job.amount || job.finalAmount || 0,
            technicianEarnings: Math.round((job.amount || job.finalAmount || 0) * 0.7),
            adminCommission: Math.round((job.amount || job.finalAmount || 0) * 0.3),
            adminCommissionPercentage: 30,
          },
          customer: {
            name: job.customerName || "Customer",
            phone: job.customerPhone || "",
          },
          description: job.notes || job.description || "No description provided",
          urgency: job.urgency || "normal",
          status: job.status || "completed",
          createdAt: job.createdAt || new Date().toISOString(),
        }));
        setJobHistory(formattedJobs);

        if (data.fallback) {
          console.log("Using simple fallback job history data");
          toast.success("Job history loaded with demo data");
        }
      } else {
        throw new Error(data.message || "Invalid job history response");
      }
    } catch (error) {
      console.error("Error fetching job history:", error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshJobHistory(retries - 1, delay * 2);
      }
      setJobHistoryError("Failed to fetch job history. Please try again later.");
      setJobHistory([]);
    } finally {
      setJobHistoryLoading(false);
    }
  };

  // Create test job offer
  const createTestJobOffer = async () => {
    try {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }
      const response = await fetchWithTimeout(`/api/technicians/jobs/create-test-offer`, {
        method: "POST",
        credentials: 'include', // Include cookies in the request
      });
      if (!response.ok) {
        throw new Error(`Failed to create test job offer: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (data.success) {
        toast.success("Test job offer created successfully. You should receive a notification soon.");
      } else {
        throw new Error(data.message || "Failed to create test job offer");
      }
    } catch (error) {
      console.error("Error creating test job offer:", error);
      toast.error("Failed to create test job offer. Please try again later.");
    }
  };

  // Authentication check
  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      toast.error("Please login to access your dashboard");
      router.push("/login");
      return;
    }

    if (user.role !== "technician") {
      toast.error("Unauthorized access");
      router.push("/login");
      return;
    }

    fetchCommissionRate();
    fetchTechnicianStats();
    refreshJobHistory();
  }, [router, timeRange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Job Notification Systems */}
      <JobNotificationRinger />
      <JobNotificationAlert
        isAvailable={isAvailable}
        onJobAccept={async (jobId) => {
          console.log("Job accepted:", jobId);
          toast.success("Job accepted! Check your active jobs.");
        }}
        onJobReject={async (jobId) => {
          console.log("Job rejected:", jobId);
          toast.info("Job declined.");
        }}
      />

      <div className="space-y-6">

      {/* Dashboard Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-gray-600">Monitor your bookings, earnings, and performance metrics</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome back!</p>
            <p className="text-lg font-medium text-gray-900">Ready to work</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaCalendarCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBookings}</p>
              {stats.bookingsChange !== 0 && (
                <p className={`text-sm flex items-center ${stats.bookingsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.bookingsChange > 0 ? <FaArrowUp className="w-3 h-3 mr-1" /> : <FaArrowDown className="w-3 h-3 mr-1" />}
                  {Math.abs(stats.bookingsChange)}% from last period
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaRupeeSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</p>
              {stats.earningsChange !== 0 && (
                <p className={`text-sm flex items-center ${stats.earningsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.earningsChange > 0 ? <FaArrowUp className="w-3 h-3 mr-1" /> : <FaArrowDown className="w-3 h-3 mr-1" />}
                  {Math.abs(stats.earningsChange)}% from last period
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaStar className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.rating.toFixed(1)}</p>
              <p className="text-sm text-gray-500">out of 5.0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaSpinner className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">₹{stats.pendingEarnings.toLocaleString()}</p>
              <p className="text-sm text-gray-500">awaiting payout</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Filter */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-lg font-medium text-gray-900">Performance Overview</h2>
            <p className="text-sm text-gray-600">Track your earnings and bookings over time</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-3 py-2 text-sm font-medium rounded ${timeRange === "week" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-3 py-2 text-sm font-medium rounded ${timeRange === "month" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-3 py-2 text-sm font-medium rounded ${timeRange === "year" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              This Year
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
          <span className="bg-blue-100 p-1.5 rounded-lg mr-2">
            <FaTools className="h-5 w-5 text-blue-700" />
          </span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/technician/bookings/pending"
            className="flex flex-col items-center p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-blue-200"
          >
            <div className="bg-blue-600 p-3 rounded-full mb-3 shadow-md">
              <FaCalendarAlt className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-800">Pending Jobs</span>
          </Link>
          <Link
            href="/technician/earnings/withdraw"
            className="flex flex-col items-center p-5 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-green-200"
          >
            <div className="bg-green-600 p-3 rounded-full mb-3 shadow-md">
              <FaRupeeSign className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-green-800">Request Payout</span>
          </Link>
          <Link
            href="/technician/profile"
            className="flex flex-col items-center p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-purple-200"
          >
            <div className="bg-purple-600 p-3 rounded-full mb-3 shadow-md">
              <FaUser className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-purple-800">Update Profile</span>
          </Link>
          <Link
            href="/technician/performance"
            className="flex flex-col items-center p-5 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-indigo-200"
          >
            <div className="bg-indigo-600 p-3 rounded-full mb-3 shadow-md">
              <FaChartLine className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-medium text-indigo-800">Performance</span>
          </Link>
        </div>
      </div>

      {/* Recent Job History */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <span className="bg-indigo-100 p-1.5 rounded-lg mr-2">
              <FaHistory className="h-5 w-5 text-indigo-700" />
            </span>
            Recent Job Activity
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={createTestJobOffer}
              className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              title="Create a test job notification"
            >
              <FaBell className="h-4 w-4 mr-1.5" />
              Test Job Alert
            </button>
            {jobHistoryLoading ? null : (
              <button
                onClick={() => refreshJobHistory()}
                className="text-sm font-medium text-indigo-700 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 flex items-center px-3 py-1.5 rounded-lg transition-colors"
                title="Refresh job history"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            )}
            <Link
              href="/technician/bookings"
              className="text-sm font-medium text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200 flex items-center px-3 py-1.5 rounded-lg transition-colors"
            >
              View all
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {jobHistoryLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
              </div>
              <p className="text-gray-600 font-medium">Loading job history</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your recent jobs...</p>
            </div>
          </div>
        ) : jobHistoryError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center shadow-sm">
            <div className="bg-red-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <FaExclamationTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-red-700 font-medium">{jobHistoryError}</p>
            <button
              onClick={() => refreshJobHistory()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Try again
            </button>
          </div>
        ) : jobHistory.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-xl bg-gray-50">
            <div className="bg-gray-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
              <FaHistory className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No job history found</p>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">Your completed jobs will appear here. Accept new job offers to start building your history.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobHistory.slice(0, 3).map((job: Job) => (
              <div key={job.id} className="border border-gray-200 rounded-xl p-5 hover:bg-blue-50/30 transition-colors shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <FaTools className="h-4 w-4 text-blue-700" />
                      </span>
                      {job.appliance}
                    </h3>
                    <div className="mt-2 flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-md inline-block">
                      <FaMapMarkerAlt className="h-3 w-3 text-blue-600 mr-1.5" />
                      <span className="font-medium">{job.location.distance} km</span> away
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 px-2 py-1 rounded-md flex items-center">
                        <FaRupeeSign className="h-3 w-3 text-green-600 mr-1.5" />
                        <span className="font-medium text-green-800">₹{job.earnings.technicianEarnings}</span>
                        <span className="text-xs text-green-600 ml-1">(your earnings)</span>
                      </div>
                      <div className="text-xs text-gray-500 ml-2 bg-gray-100 px-2 py-1 rounded-md">
                        Service Price: ₹{job.earnings.total}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 shadow-sm">
                      <FaCheck className="mr-1.5 h-3 w-3" />
                      Completed
                    </span>
                    <span className="text-xs text-gray-500 mt-2 bg-gray-100 px-2 py-1 rounded-md">{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
