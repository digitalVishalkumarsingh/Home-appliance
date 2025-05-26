"use client";

import { useState, useEffect } from "react";
import { FaSpinner, FaChartBar, FaRupeeSign, FaUsers, FaCheckCircle } from "react-icons/fa";
// import { toast } from "react-hot-toast"; // Removed unused import
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface ReportData {
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  bookingsByStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  revenueByService: {
    [key: string]: number;
  };
  bookingsByMonth: {
    [key: string]: number;
  };
  revenueByMonth: {
    [key: string]: number;
  };
}

export default function DashboardAnalytics() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<"status" | "service" | "bookings" | "revenue">("status");

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      // Get data for the current month by default
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = firstDayOfMonth.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const url = `/api/admin/reports?startDate=${startDate}&endDate=${endDate}`;

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch report data");
      }

      const data = await response.json();

      if (data.success && data.reportData) {
        setReportData(data.reportData);
      } else {
        // If the API is not ready yet, use mock data
        setReportData(generateMockReportData());
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      // Use mock data if the API fails
      setReportData(generateMockReportData());
    } finally {
      setLoading(false);
    }
  };

  const statusChartData = reportData ? {
    labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    datasets: [
      {
        label: 'Bookings by Status',
        data: [
          reportData.bookingsByStatus.pending,
          reportData.bookingsByStatus.confirmed,
          reportData.bookingsByStatus.completed,
          reportData.bookingsByStatus.cancelled,
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : { labels: [], datasets: [] };

  const serviceRevenueChartData = reportData ? {
    labels: Object.keys(reportData.revenueByService),
    datasets: [
      {
        label: 'Revenue by Service',
        data: Object.values(reportData.revenueByService),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : { labels: [], datasets: [] };

  const monthlyBookingsChartData = reportData ? {
    labels: Object.keys(reportData.bookingsByMonth),
    datasets: [
      {
        label: 'Bookings by Month',
        data: Object.values(reportData.bookingsByMonth),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  } : { labels: [], datasets: [] };

  const monthlyRevenueChartData = reportData ? {
    labels: Object.keys(reportData.revenueByMonth),
    datasets: [
      {
        label: 'Revenue by Month',
        data: Object.values(reportData.revenueByMonth),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  } : { labels: [], datasets: [] };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center p-8 text-gray-500">
          <p>Could not load analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {reportData && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FaChartBar className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{reportData.totalBookings}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FaRupeeSign className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">₹{reportData.totalRevenue.toLocaleString()}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <FaUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{reportData.totalCustomers}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <FaCheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed Bookings</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{reportData.bookingsByStatus.completed}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart Selection Tabs */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Business Analytics</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Key performance indicators and trends
          </p>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveChart("status")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeChart === "status"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Booking Status
            </button>
            <button
              onClick={() => setActiveChart("service")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeChart === "service"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Service Revenue
            </button>
            <button
              onClick={() => setActiveChart("bookings")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeChart === "bookings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Monthly Bookings
            </button>
            <button
              onClick={() => setActiveChart("revenue")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeChart === "revenue"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Monthly Revenue
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="h-80">
            {activeChart === "status" && (
              <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />
            )}
            {activeChart === "service" && (
              <Pie data={serviceRevenueChartData} options={{ maintainAspectRatio: false }} />
            )}
            {activeChart === "bookings" && (
              <Bar
                data={monthlyBookingsChartData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            )}
            {activeChart === "revenue" && (
              <Bar
                data={monthlyRevenueChartData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data generator for testing
function generateMockReportData(): ReportData {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  const recentMonths = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);

  const services = ["AC Repair", "AC Installation", "Washing Machine Repair", "Refrigerator Service", "TV Repair"];

  const bookingsByMonth: { [key: string]: number } = {};
  const revenueByMonth: { [key: string]: number } = {};

  recentMonths.forEach(month => {
    bookingsByMonth[month] = Math.floor(Math.random() * 50) + 10;
    revenueByMonth[month] = Math.floor(Math.random() * 50000) + 10000;
  });

  const revenueByService: { [key: string]: number } = {};
  services.forEach(service => {
    revenueByService[service] = Math.floor(Math.random() * 100000) + 20000;
  });

  return {
    totalBookings: Object.values(bookingsByMonth).reduce((sum, count) => sum + count, 0),
    totalRevenue: Object.values(revenueByMonth).reduce((sum, amount) => sum + amount, 0),
    totalCustomers: Math.floor(Math.random() * 100) + 50,
    bookingsByStatus: {
      pending: Math.floor(Math.random() * 20) + 5,
      confirmed: Math.floor(Math.random() * 30) + 10,
      completed: Math.floor(Math.random() * 40) + 20,
      cancelled: Math.floor(Math.random() * 10) + 2,
    },
    revenueByService,
    bookingsByMonth,
    revenueByMonth,
  };
}
