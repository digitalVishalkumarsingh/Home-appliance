"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "../ui/Toast";
import {
  FaTools,
  FaRupeeSign,
  FaCalendarCheck,
  FaUsers,
  FaArrowUp,
  FaArrowDown,
  FaUserCog
} from "react-icons/fa";
import { motion } from "framer-motion";

// Custom icons for refresh and spinner
const RefreshIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

interface DashboardStats {
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

const DashboardOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    revenueChange: 0,
    bookingsChange: 0,
    customersChange: 0,
    totalTechnicians: 0,
    activeTechnicians: 0,
    techniciansChange: 0,
    avgTechnicianRating: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async (): Promise<void> => {
    try {
      setLoading(true);

      if (typeof window === "undefined") {
        console.warn("Not in browser environment, using mock data");
        setMockData();
        return;
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 5000)
      );

      let token: string | null = null;
      try {
        token = localStorage.getItem("token");
        if (!token) {
          token = document.cookie
            .split(";")
            .find((c) => c.trim().startsWith("token="))
            ?.split("=")[1] || null;
        }
      } catch (tokenError) {
        console.error("Error getting token:", tokenError);
      }

      if (!token) {
        console.warn("No authentication token found, using mock data");
        setMockData();
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const fetchPromise = fetch(`${apiUrl}/admin/stats`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const response = (await Promise.race([fetchPromise, timeoutPromise])) as Response;

        if (!response.ok) {
          let errorMessage = "Failed to fetch dashboard stats";
          try {
            const errorData = await response.json();
            console.error("API error:", errorData);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Dashboard stats fetched successfully:", data);

        if (data.success) {
          setStats({
            totalBookings: data.totalBookings ?? 0,
            pendingBookings: data.pendingBookings ?? 0,
            completedBookings: data.completedBookings ?? 0,
            totalCustomers: data.totalCustomers ?? 0,
            totalRevenue: data.totalRevenue ?? 0,
            revenueChange: data.revenueChange ?? 0,
            bookingsChange: data.bookingsChange ?? 0,
            customersChange: data.customersChange ?? 0,
            totalTechnicians: data.totalTechnicians ?? 0,
            activeTechnicians: data.activeTechnicians ?? 0,
            techniciansChange: data.techniciansChange ?? 0,
            avgTechnicianRating: data.avgTechnicianRating ?? 0,
          });
        } else {
          throw new Error(data.message || "Failed to fetch dashboard stats");
        }
      } catch (fetchError) {
        console.error("Error in fetch operation:", fetchError);
        setMockData();
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setMockData();
    } finally {
      setLoading(false);
    }
  };

  const setMockData = (): void => {
    setStats({
      totalBookings: 156,
      pendingBookings: 23,
      completedBookings: 133,
      totalCustomers: 98,
      totalRevenue: 78500,
      revenueChange: 12.5,
      bookingsChange: 8.3,
      customersChange: 15.2,
      totalTechnicians: 12,
      activeTechnicians: 8,
      techniciansChange: 20.0,
      avgTechnicianRating: 4.5,
    });

    if (typeof window !== "undefined") {
      try {
        toast.info("Using demo data for dashboard");
      } catch (toastError) {
        console.warn("Could not show toast notification:", toastError);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg p-5 animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-300 rounded-md p-3 h-12 w-12"></div>
              <div className="ml-5 w-0 flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-sm text-gray-500">Real-time business metrics and performance indicators</p>
        </div>
        <button
          onClick={fetchDashboardStats}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <SpinnerIcon className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshIcon className="h-4 w-4 mr-2" />
              Refresh Stats
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${stats.pendingBookings > 0 ? "bg-yellow-50 border-yellow-300" : "bg-white border-gray-200"} overflow-hidden shadow-lg rounded-lg border hover:shadow-xl transition-shadow duration-300`}
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-md p-4 shadow-md">
                <FaTools className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-lg font-medium text-gray-700 truncate">Pending Bookings</dt>
                  <dd className="flex items-center mt-2">
                    <div className="text-4xl font-bold text-gray-900">
                      {stats.pendingBookings.toLocaleString()}
                    </div>
                    {stats.pendingBookings > 0 && (
                      <span className="ml-3 px-3 py-1 text-sm font-medium rounded-full bg-yellow-200 text-yellow-800 animate-pulse">
                        Needs Attention
                      </span>
                    )}
                  </dd>
                  <dd className="mt-3 text-sm text-gray-600 font-medium">
                    {stats.pendingBookings === 0
                      ? "No pending bookings to process"
                      : stats.pendingBookings === 1
                        ? "1 booking requires your attention"
                        : `${stats.pendingBookings} bookings require your attention`}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className={`${stats.pendingBookings > 0 ? "bg-yellow-100 border-yellow-200" : "bg-gray-50 border-gray-200"} px-6 py-4 border-t`}>
            <div className="text-sm flex justify-between items-center">
              <Link
                href="/admin/bookings?status=pending"
                className={`font-medium ${stats.pendingBookings > 0 ? "text-amber-600 hover:text-amber-700" : "text-blue-600 hover:text-blue-500"} flex items-center`}
              >
                View pending bookings
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-xs text-gray-500">Real-time data</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-indigo-50 overflow-hidden shadow-lg rounded-lg border border-indigo-200 hover:shadow-xl transition-shadow duration-300"
        >
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-md p-4 shadow-md">
                <FaRupeeSign className="h-8 w-8 text-white" />
              </div>
              <div className="ml-6 w-0 flex-1">
                <dl>
                  <dt className="text-lg font-medium text-gray-700 truncate">Total Revenue</dt>
                  <dd className="flex items-center mt-2">
                    <div className="text-4xl font-bold text-indigo-900">
                      ₹{stats.totalRevenue.toLocaleString()}
                    </div>
                    <div
                      className={`ml-3 flex items-center text-sm ${stats.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {stats.revenueChange >= 0 ? <FaArrowUp className="h-4 w-4 mr-1" /> : <FaArrowDown className="h-4 w-4 mr-1" />}
                      {Math.abs(stats.revenueChange).toFixed(1)}%
                    </div>
                  </dd>
                  <dd className="mt-3 text-sm text-gray-600 font-medium">
                    {stats.revenueChange >= 0
                      ? "Revenue is growing compared to last month"
                      : "Revenue has decreased compared to last month"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-indigo-100 px-6 py-4 border-t border-indigo-200">
            <div className="text-sm flex justify-between items-center">
              <Link
                href="/admin/reports"
                className="font-medium text-indigo-700 hover:text-indigo-800 flex items-center"
              >
                View financial reports
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-xs text-gray-500">Real-time data</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-md p-3 shadow-md">
                <FaCalendarCheck className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                  <dd className="flex items-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalBookings.toLocaleString()}
                    </div>
                    <div
                      className={`ml-2 flex items-center text-sm ${stats.bookingsChange >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {stats.bookingsChange >= 0 ? <FaArrowUp className="h-3 w-3 mr-1" /> : <FaArrowDown className="h-3 w-3 mr-1" />}
                      {Math.abs(stats.bookingsChange).toFixed(1)}%
                    </div>
                  </dd>
                  <dd className="mt-1 text-sm text-gray-500">
                    {stats.bookingsChange >= 0 ? "Bookings are increasing" : "Bookings have decreased"} compared to last month
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
            <div className="text-sm flex justify-between items-center">
              <Link
                href="/admin/bookings"
                className="font-medium text-blue-600 hover:text-blue-500 flex items-center"
              >
                View all bookings
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-xs text-gray-500">Real-time data</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-green-600 rounded-md p-3 shadow-md">
                <FaUsers className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="flex items-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalCustomers.toLocaleString()}
                    </div>
                    <div
                      className={`ml-2 flex items-center text-sm ${stats.customersChange >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {stats.customersChange >= 0 ? <FaArrowUp className="h-3 w-3 mr-1" /> : <FaArrowDown className="h-3 w-3 mr-1" />}
                      {Math.abs(stats.customersChange).toFixed(1)}%
                    </div>
                  </dd>
                  <dd className="mt-1 text-sm text-gray-500">
                    {stats.customersChange >= 0 ? "Growing" : "Declining"} compared to last month
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
            <div className="text-sm flex justify-between items-center">
              <Link
                href="/admin/customers"
                className="font-medium text-blue-600 hover:text-blue-500 flex items-center"
              >
                View all customers
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-xs text-gray-500">Real-time data</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-300"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-md p-3 shadow-md">
                <FaUserCog className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Technicians</dt>
                  <dd className="flex items-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalTechnicians.toLocaleString()}
                    </div>
                    <div
                      className={`ml-2 flex items-center text-sm ${stats.techniciansChange >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {stats.techniciansChange >= 0 ? <FaArrowUp className="h-3 w-3 mr-1" /> : <FaArrowDown className="h-3 w-3 mr-1" />}
                      {Math.abs(stats.techniciansChange).toFixed(1)}%
                    </div>
                  </dd>
                  <dd className="mt-1 text-sm text-gray-500">
                    <span className="font-medium">{stats.activeTechnicians}</span> active technicians,{" "}
                    <span className="font-medium">{stats.avgTechnicianRating.toFixed(1)}</span> avg. rating
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
            <div className="text-sm flex justify-between items-center">
              <Link
                href="/admin/technicians"
                className="font-medium text-blue-600 hover:text-blue-500 flex items-center"
              >
                Manage technicians
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-xs text-gray-500">Real-time data</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardOverview;

