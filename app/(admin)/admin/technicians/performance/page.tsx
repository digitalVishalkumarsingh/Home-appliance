"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaUserCog,
  FaSpinner,
  FaStar,
  FaRupeeSign,
  FaDownload,
  FaArrowLeft,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

interface TechnicianPerformance {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  status: string;
  rating: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalEarnings: number;
  averageCompletionTime: number; // in minutes
  customerSatisfaction: number; // percentage
  responseRate: number; // percentage
}

export default function TechnicianPerformancePage() {
  const [technicians, setTechnicians] = useState<TechnicianPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");
  const [sortField, setSortField] = useState<keyof TechnicianPerformance>("completedBookings");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const router = useRouter();


  const handleSort = (field: keyof TechnicianPerformance) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedTechnicians = [...technicians].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue == null || bValue == null) return 0;

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  const exportToCSV = async () => {
    try {
      setExportLoading(true);
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Specializations",
        "Status",
        "Rating",
        "Completed Bookings",
        "Pending Bookings",
        "Cancelled Bookings",
        "Total Earnings (₹)",
        "Avg. Completion Time (min)",
        "Customer Satisfaction (%)",
        "Response Rate (%)",
      ];

      const rows = sortedTechnicians.map((tech) => [
        tech.name,
        tech.email,
        tech.phone,
        tech.specializations.join(", "),
        tech.status,
        tech.rating.toString(),
        tech.completedBookings.toString(),
        tech.pendingBookings.toString(),
        tech.cancelledBookings.toString(),
        tech.totalEarnings.toString(),
        tech.averageCompletionTime.toString(),
        tech.customerSatisfaction.toString(),
        tech.responseRate.toString(),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `technician-performance-${timeRange}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Performance data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Technician Performance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and analyze technician performance metrics
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/admin/technicians"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Back to Technicians
          </Link>
          <button
            onClick={exportToCSV}
            disabled={exportLoading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              exportLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {exportLoading ? (
              <FaSpinner className="animate-spin mr-2 -ml-1 h-5 w-5" />
            ) : (
              <FaDownload className="mr-2 -ml-1 h-5 w-5" />
            )}
            Export Data
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-gray-900 mb-4 sm:mb-0">Performance Overview</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeRange("week")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeRange === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setTimeRange("month")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeRange === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeRange("year")}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                timeRange === "year"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              This Year
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : sortedTechnicians.length === 0 ? (
          <div className="text-center py-12">
            <FaUserCog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No technicians found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No technician performance data available for the selected time period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    Technician
                    {sortField === "name" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("rating")}
                  >
                    Rating
                    {sortField === "rating" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("completedBookings")}
                  >
                    Bookings
                    {sortField === "completedBookings" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("totalEarnings")}
                  >
                    Earnings
                    {sortField === "totalEarnings" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("customerSatisfaction")}
                  >
                    Satisfaction
                    {sortField === "customerSatisfaction" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("responseRate")}
                  >
                    Response Rate
                    {sortField === "responseRate" && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTechnicians.map((technician) => (
                  <tr key={technician._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUserCog className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link
                              href={`/admin/technicians/${technician._id}`}
                              className="hover:text-blue-600"
                            >
                              {technician.name}
                            </Link>
                          </div>
                          <div className="text-xs text-gray-500">
                            {technician.specializations.join(", ")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-900">{technician.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {technician.completedBookings} completed
                      </div>
                      <div className="text-xs text-gray-500">
                        {technician.pendingBookings} pending, {technician.cancelledBookings} cancelled
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FaRupeeSign className="h-3 w-3 mr-1" />
                        {technician.totalEarnings.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${technician.customerSatisfaction}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {technician.customerSatisfaction}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{ width: `${technician.responseRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{technician.responseRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}