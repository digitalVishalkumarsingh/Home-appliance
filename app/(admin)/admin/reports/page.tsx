"use client";

import { useState, useEffect, useCallback } from "react";
import { FaSpinner, FaDownload, FaCalendarAlt, FaChartBar, FaRupeeSign } from "react-icons/fa";
import { toast } from "react-hot-toast";
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
  revenueByService: { [key: string]: number };
  bookingsByMonth: { [key: string]: number };
  revenueByMonth: { [key: string]: number };
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Use environment variable for API base URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      let url = `${baseUrl}/admin/reports`;
      if (dateRange !== "all") {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Ensure fresh data for serverless
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch report data");
      }

      const data = await response.json();
      if (data.success && data.reportData) {
        setReportData(data.reportData);
      } else {
        throw new Error(data.message || "Failed to fetch report data");
      }
    } catch (error: any) {
      console.error("Error fetching report data:", error);
      setError(error.message || "Failed to fetch report data");
      toast.error(error.message || "Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, dateRange]);

  useEffect(() => {
    // Set default date range
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const range = e.target.value;
    setDateRange(range);

    const today = new Date();
    let start = new Date();

    if (range === "week") {
      start.setDate(today.getDate() - 7);
    } else if (range === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (range === "quarter") {
      start = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    } else if (range === "year") {
      start = new Date(today.getFullYear(), 0, 1);
    } else if (range === "all") {
      setStartDate("");
      setEndDate("");
      return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += `Report Generated on,${new Date().toLocaleString()}\n\n`;
      csvContent += `Summary\n`;
      csvContent += `Total Bookings,${reportData.totalBookings}\n`;
      csvContent += `Total Revenue,₹${reportData.totalRevenue.toFixed(2)}\n`;
      csvContent += `Total Customers,${reportData.totalCustomers}\n\n`;
      csvContent += `Bookings by Status\n`;
      csvContent += `Pending,${reportData.bookingsByStatus.pending}\n`;
      csvContent += `Confirmed,${reportData.bookingsByStatus.confirmed}\n`;
      csvContent += `Completed,${reportData.bookingsByStatus.completed}\n`;
      csvContent += `Cancelled,${reportData.bookingsByStatus.cancelled}\n\n`;
      csvContent += `Revenue by Service\n`;
      Object.entries(reportData.revenueByService).forEach(([service, revenue]) => {
        csvContent += `${service},₹${revenue.toFixed(2)}\n`;
      });
      csvContent += `\n`;
      csvContent += `Bookings by Month\n`;
      Object.entries(reportData.bookingsByMonth).forEach(([month, count]) => {
        csvContent += `${month},${count}\n`;
      });
      csvContent += `\n`;
      csvContent += `Revenue by Month\n`;
      Object.entries(reportData.revenueByMonth).forEach(([month, revenue]) => {
        csvContent += `${month},₹${revenue.toFixed(2)}\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Failed to export CSV");
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  const statusChartData = reportData ? {
    labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    datasets: [{
      label: 'Bookings by Status',
      data: [
        reportData.bookingsByStatus.pending,
        reportData.bookingsByStatus.confirmed,
        reportData.bookingsByStatus.completed,
        reportData.bookingsByStatus.cancelled,
      ],
      backgroundColor: ['#FFCE56', '#36A2EB', '#4BC0C0', '#FF6384'],
      borderColor: ['#FFD700', '#1E90FF', '#20B2AA', '#FF4500'],
      borderWidth: 1,
    }],
  } : { labels: [], datasets: [] };

  const serviceRevenueChartData = reportData ? {
    labels: Object.keys(reportData.revenueByService),
    datasets: [{
      label: 'Revenue by Service',
      data: Object.values(reportData.revenueByService),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      borderColor: ['#FF4500', '#1E90FF', '#FFD700', '#20B2AA', '#8A2BE2'],
      borderWidth: 1,
    }],
  } : { labels: [], datasets: [] };

  const monthlyBookingsChartData = reportData ? {
    labels: Object.keys(reportData.bookingsByMonth),
    datasets: [{
      label: 'Bookings by Month',
      data: Object.values(reportData.bookingsByMonth),
      backgroundColor: '#36A2EB',
      borderColor: '#1E90FF',
      borderWidth: 1,
    }],
  } : { labels: [], datasets: [] };

  const monthlyRevenueChartData = reportData ? {
    labels: Object.keys(reportData.revenueByMonth),
    datasets: [{
      label: 'Revenue by Month',
      data: Object.values(reportData.revenueByMonth),
      backgroundColor: '#4BC0C0',
      borderColor: '#20B2AA',
      borderWidth: 1,
    }],
  } : { labels: [], datasets: [] };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">View and analyze business performance</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleExportCSV}
            disabled={!reportData}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload className="mr-2 -ml-1 h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700">Date Range</label>
              <select
                id="dateRange"
                value={dateRange}
                onChange={handleDateRangeChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
                <option value="all">All Time</option>
              </select>
            </div>
            {dateRange === "custom" && (
              <>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </>
            )}
            <div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaCalendarAlt className="mr-2 -ml-1 h-5 w-5" />
                Apply
              </button>
            </div>
          </form>
        </div>
      </div>

      {reportData && (
        <>
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
                      <dd className="text-2xl font-semibold text-gray-900">{reportData.totalBookings.toLocaleString()}</dd>
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
                      <dd className="text-2xl font-semibold text-gray-900">₹{reportData.totalRevenue.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{reportData.totalCustomers.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Completed Bookings</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{reportData.bookingsByStatus.completed.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Bookings by Status</h3>
                <div className="mt-5 h-64">
                  <Pie data={statusChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Revenue by Service</h3>
                <div className="mt-5 h-64">
                  <Pie data={serviceRevenueChartData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg sm:col-span-2">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Bookings by Month</h3>
                <div className="mt-5 h-64">
                  <Bar data={monthlyBookingsChartData} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} />
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg sm:col-span-2">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Revenue by Month</h3>
                <div className="mt-5 h-64">
                  <Bar data={monthlyRevenueChartData} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}