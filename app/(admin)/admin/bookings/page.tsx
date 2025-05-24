"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaEye,
  FaCheck,
  FaTimes,
  FaPrint,
} from "react-icons/fa";
import AdminBookingModal from "@/app/components/admin/AdminBookingModal";
import Pagination from "@/app/components/admin/Pagination";
import { toast } from "react-hot-toast";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  amount: number;
  technician?: string;
}

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "pending" | "confirmed" | "completed" | "cancelled"
  >(statusFilter as "all" | "pending" | "confirmed" | "completed" | "cancelled");
  const [selectedDateRange, setSelectedDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        } else {
          throw new Error("Invalid response format from server");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load bookings");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Memoized filtered bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((booking) => booking.status === selectedStatus);
    }

    // Filter by date range
    if (selectedDateRange !== "all") {
      const today = new Date();
      const startDate = new Date();

      if (selectedDateRange === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (selectedDateRange === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (selectedDateRange === "month") {
        startDate.setMonth(today.getMonth() - 1);
      }

      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= startDate && bookingDate <= today;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.id.toLowerCase().includes(term) ||
          booking.customerName.toLowerCase().includes(term) ||
          booking.customerPhone.includes(term) ||
          booking.service.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [bookings, selectedStatus, selectedDateRange, searchTerm]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = async (id: string, newStatus: "confirmed" | "cancelled") => {
    if (processingBookingId) return; // Prevent multiple simultaneous requests

    try {
      setProcessingBookingId(id);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update booking status to ${newStatus}`);
      }

      toast.success(`Booking status updated to ${newStatus}`);
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === id ? { ...booking, status: newStatus } : booking
        )
      );
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update booking status");
    } finally {
      setProcessingBookingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all service bookings</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <FaFilter className="mr-2 text-gray-500" />
              <label htmlFor="status" className="text-sm font-medium text-gray-700 mr-2">
                Status:
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(e.target.value as typeof selectedStatus)
                }
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2 text-gray-500" />
              <label htmlFor="dateRange" className="text-sm font-medium text-gray-700 mr-2">
                Date:
              </label>
              <select
                id="dateRange"
                value={selectedDateRange}
                onChange={(e) =>
                  setSelectedDateRange(e.target.value as typeof selectedDateRange)
                }
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Booking ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date & Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Payment
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBookings.length > 0 ? (
                currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                      <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                      <div className="text-sm text-gray-500">
                        ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
                          booking.amount
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/bookings/${booking.id}`}>
                          <div
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 cursor-pointer"
                            title="View Details"
                          >
                            <FaEye />
                          </div>
                        </Link>
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(booking.id, "confirmed")}
                            disabled={processingBookingId === booking.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50 p-1 rounded hover:bg-green-100"
                            title="Accept Booking"
                          >
                            {processingBookingId === booking.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <FaCheck />
                            )}
                          </button>
                        )}
                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <button
                            onClick={() => handleStatusChange(booking.id, "cancelled")}
                            disabled={processingBookingId === booking.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1 rounded hover:bg-red-100"
                            title="Cancel Booking"
                          >
                            {processingBookingId === booking.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <FaTimes />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                          title="Print Booking"
                        >
                          <FaPrint />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(indexOfLastItem, filteredBookings.length)}</span> of{" "}
                  <span className="font-medium">{filteredBookings.length}</span> results
                </p>
              </div>
              <div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  maxPageButtons={5}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBookingId && (
        <AdminBookingModal
          bookingId={selectedBookingId}
          isOpen={!!selectedBookingId}
          onClose={() => {
            setSelectedBookingId(null);
            // Refresh bookings to ensure consistency
            setLoading(true);
            const token = localStorage.getItem("token");
            if (token) {
              fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/bookings`, {
                headers: { Authorization: `Bearer ${token}` },
              })
                .then((response) => response.json())
                .then((data) => {
                  if (data.success && Array.isArray(data.bookings)) {
                    setBookings(data.bookings);
                  }
                })
                .catch((error) => {
                  console.error("Error refreshing bookings:", error);
                  toast.error("Failed to refresh bookings");
                })
                .finally(() => setLoading(false));
            }
          }}
          onStatusChange={(status) => {
            if (selectedBookingId) {
              handleStatusChange(selectedBookingId, status as "confirmed" | "cancelled");
            }
          }}
        />
      )}
    </div>
  );
}