"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaSpinner,
  FaChartLine,
  FaStar,
  FaCheck,
  FaCalendarAlt,
  FaRupeeSign,
  FaFilter,
  FaArrowLeft,
  FaClock,
  FaThumbsUp,
  FaBell,
  FaExclamationTriangle,
  FaChartBar,
  FaChartPie,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

interface PerformanceData {
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  averageCompletionTime: number; // in minutes
  customerSatisfaction: number; // percentage
  responseRate: number; // percentage
  rating: number;
  monthlyEarnings: {
    month: string;
    earnings: number;
  }[];
  serviceTypes: Record<string, number>;
}

export default function TechnicianPerformance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [performance, setPerformance] = useState<PerformanceData | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      toast.error("Please login to access your performance metrics");
      router.push("/login");
      return;
    }

    // Parse user data
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "technician") {
        toast.error("Unauthorized access");
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Authentication error. Please login again.");
      router.push("/login");
      return;
    }

    fetchPerformanceData();
  }, [router, timeRange]);

  // Function to create a test job offer
  const createTestJobOffer = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch('/api/technicians/jobs/create-test-offer', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to create test job offer: ${response.status}`);
      }

      const data = await response.json();

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

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`/api/technicians/performance?timeRange=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPerformance(data.performance);
      } else {
        throw new Error(data.message || "Failed to fetch performance data");
      }
    } catch (error) {
      console.error("Error fetching performance data:", error);
      setError("Failed to fetch performance data. Please try again later.");

      // Use mock data as fallback
      setPerformance({
        completedBookings: 42,
        pendingBookings: 5,
        cancelledBookings: 2,
        totalEarnings: 52500,
        averageCompletionTime: 120, // 2 hours
        customerSatisfaction: 92,
        responseRate: 95,
        rating: 4.6,
        monthlyEarnings: [
          { month: "Jun", earnings: 8500 },
          { month: "Jul", earnings: 9200 },
          { month: "Aug", earnings: 8700 },
          { month: "Sep", earnings: 10500 },
          { month: "Oct", earnings: 7800 },
          { month: "Nov", earnings: 7800 }
        ],
        serviceTypes: {
          "AC Repair": 18,
          "Refrigerator": 12,
          "Washing Machine": 8,
          "Microwave": 4,
          "Other": 7
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format time in hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${mins} min`;
    }
  };

  // Get color based on rating
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4) return "text-green-500";
    if (rating >= 3.5) return "text-yellow-500";
    if (rating >= 3) return "text-yellow-600";
    return "text-red-500";
  };

  // Get color based on percentage
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your service metrics and performance indicators
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div>
            <label htmlFor="time-range" className="sr-only">Time Range</label>
            <select
              id="time-range"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as "week" | "month" | "year")}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <button
            onClick={createTestJobOffer}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaBell className="mr-2 -ml-1 h-5 w-5" />
            Test Job Alert
          </button>
          <Link
            href="/technician/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <FaExclamationTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      ) : performance ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Bookings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                    <FaCalendarAlt className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed Bookings
                      </dt>
                      <dd className="flex items-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {performance.completedBookings}
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        <span className="font-medium text-amber-600">{performance.pendingBookings}</span> pending,
                        <span className="ml-1 font-medium text-red-600">{performance.cancelledBookings}</span> cancelled
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <FaRupeeSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Earnings
                      </dt>
                      <dd className="flex items-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(performance.totalEarnings)}
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        From {performance.completedBookings} completed services
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <FaStar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Customer Rating
                      </dt>
                      <dd className="flex items-center">
                        <div className={`text-2xl font-bold ${getRatingColor(performance.rating)}`}>
                          {performance.rating.toFixed(1)}
                        </div>
                        <div className="ml-2 flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(performance.rating)
                                  ? "text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        Customer satisfaction: <span className={`font-medium ${getPercentageColor(performance.customerSatisfaction)}`}>{performance.customerSatisfaction}%</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                    <FaClock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg. Completion Time
                      </dt>
                      <dd className="flex items-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatTime(performance.averageCompletionTime)}
                        </div>
                      </dd>
                      <dd className="mt-1 text-sm text-gray-500">
                        Response rate: <span className={`font-medium ${getPercentageColor(performance.responseRate)}`}>{performance.responseRate}%</span>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Monthly Earnings Chart */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Earnings</h2>
              <div className="h-64">
                <div className="h-full flex items-end">
                  {performance.monthlyEarnings.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{
                          height: `${(item.earnings / Math.max(...performance.monthlyEarnings.map(e => e.earnings))) * 100}%`,
                          minHeight: item.earnings > 0 ? '10%' : '0'
                        }}
                      ></div>
                      <div className="mt-2 text-xs font-medium text-gray-500">{item.month}</div>
                      <div className="text-xs text-gray-700">₹{Math.round(item.earnings).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Service Type Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Service Distribution</h2>
              <div className="space-y-4">
                {Object.entries(performance.serviceTypes).map(([service, count], index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{service}</span>
                      <span className="text-sm text-gray-500">{count} bookings</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${(count / Object.values(performance.serviceTypes).reduce((a, b) => a + b, 0)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips for Improvement */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tips for Improvement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <FaThumbsUp className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-md font-medium text-gray-900">What You're Doing Well</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {performance.rating >= 4.5 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      <span>Maintaining excellent customer ratings</span>
                    </li>
                  )}
                  {performance.responseRate >= 90 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      <span>Responding quickly to service requests</span>
                    </li>
                  )}
                  {performance.customerSatisfaction >= 90 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      <span>Providing high customer satisfaction</span>
                    </li>
                  )}
                  {performance.completedBookings >= 30 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
                      <span>Completing a high volume of bookings</span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <FaBell className="h-5 w-5 text-amber-500 mr-2" />
                  <h3 className="text-md font-medium text-gray-900">Areas for Improvement</h3>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {performance.rating < 4.5 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
                      <span>Work on improving your customer ratings</span>
                    </li>
                  )}
                  {performance.responseRate < 90 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
                      <span>Try to respond faster to service requests</span>
                    </li>
                  )}
                  {performance.averageCompletionTime > 180 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
                      <span>Reduce your average service completion time</span>
                    </li>
                  )}
                  {performance.cancelledBookings > 5 && (
                    <li className="flex items-start">
                      <FaCheck className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
                      <span>Try to reduce the number of cancelled bookings</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
