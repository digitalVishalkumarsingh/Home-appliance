"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaSearch,
  FaCalendarAlt,
  FaEye,
  FaArrowLeft,
  FaDownload,
  FaPrint,
  FaUndo,
  FaExclamationTriangle
} from "react-icons/fa";
import AdminBookingModal from "@/app/components/admin/AdminBookingModal";
import Pagination from "@/app/components/admin/Pagination";
import { toast } from "react-hot-toast";

interface Booking {
  _id: string;
  id?: string;
  bookingId?: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded" | "failed";
  amount: number;
  technician?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  createdAt: string;
}

export default function CancelledBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("cancelledAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCancelledBookings();
  }, []);

  const fetchCancelledBookings = async () => {
    try {
      setLoading(true);
      // Get token from localStorage (only available on client side)
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found in localStorage");
        throw new Error("Authentication token not found");
      }

      // Fetch bookings from the API with status=cancelled
      const response = await fetch("/api/admin/bookings?status=cancelled", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cancelled bookings");
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.bookings)) {
        console.log("Cancelled bookings fetched successfully:", data.bookings);
        setBookings(data.bookings);
        setFilteredBookings(data.bookings);
      } else {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching cancelled bookings:", error);
      toast.error("Failed to load cancelled bookings");
      // If API fails, use mock data for demonstration
      const mockData = [
        {
          _id: "BK004",
          customerName: "Neha Gupta",
          customerPhone: "6543210987",
          service: "Microwave Repair",
          date: "2023-07-18",
          time: "04:00 PM",
          address: "234 River Road, Varanasi",
          status: "cancelled",
          paymentStatus: "refunded",
          amount: 600,
          cancelledAt: "2023-07-17T15:30:00Z",
          cancelledBy: "Customer",
          cancellationReason: "Schedule conflict",
          createdAt: "2023-07-15T10:20:00Z"
        },
        {
          _id: "BK009",
          customerName: "Karan Malhotra",
          customerPhone: "1098765432",
          service: "TV Repair",
          date: "2023-07-23",
          time: "12:00 PM",
          address: "789 BHU, Varanasi",
          status: "cancelled",
          paymentStatus: "refunded",
          amount: 850,
          cancelledAt: "2023-07-22T09:15:00Z",
          cancelledBy: "Admin",
          cancellationReason: "Technician unavailable",
          createdAt: "2023-07-20T14:30:00Z"
        },
      ];
      setBookings(mockData);
      setFilteredBookings(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...bookings];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(searchLower) ||
          booking.service.toLowerCase().includes(searchLower) ||
          booking.customerPhone.includes(searchTerm) ||
          (booking.bookingId && booking.bookingId.toLowerCase().includes(searchLower)) ||
          (booking.id && booking.id.toLowerCase().includes(searchLower)) ||
          (booking.cancellationReason && booking.cancellationReason.toLowerCase().includes(searchLower))
      );
    }

    // Filter by date range
    if (selectedDateRange !== "all") {
      const today = new Date();
      const startDate = new Date();

      if (selectedDateRange === "today") {
        // No adjustment needed for today
      } else if (selectedDateRange === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (selectedDateRange === "month") {
        startDate.setMonth(today.getMonth() - 1);
      }

      filtered = filtered.filter((booking) => {
        const cancelDate = booking.cancelledAt
          ? new Date(booking.cancelledAt)
          : new Date(booking.date);
        return cancelDate >= startDate && cancelDate <= today;
      });
    }

    // Sort bookings
    filtered.sort((a, b) => {
      let fieldA = a[sortField as keyof Booking];
      let fieldB = b[sortField as keyof Booking];

      // Handle nested fields like cancelledAt
      if (sortField === "cancelledAt") {
        fieldA = a.cancelledAt || a.date;
        fieldB = b.cancelledAt || b.date;
      }

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortOrder === "asc"
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }

      // Default sort for non-string fields
      return sortOrder === "asc" ? 1 : -1;
    });

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, selectedDateRange, sortField, sortOrder]);

  // Get current bookings for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Booking ID", "Customer", "Phone", "Service", "Date", "Time", "Amount", "Cancelled At", "Cancelled By", "Reason"];
    const csvContent = [
      headers.join(","),
      ...filteredBookings.map(booking => [
        booking.bookingId || booking.id || booking._id,
        `"${booking.customerName}"`,
        booking.customerPhone,
        `"${booking.service}"`,
        formatDate(booking.date),
        booking.time,
        booking.amount,
        booking.cancelledAt ? formatDate(booking.cancelledAt) : formatDate(booking.date),
        booking.cancelledBy || "Unknown",
        `"${booking.cancellationReason || "No reason provided"}"`
      ].join(","))
    ].join("\n");

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cancelled-bookings-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReactivateBooking = async (bookingId: string) => {
    try {
      setProcessingBookingId(bookingId);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: "pending" })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reactivate booking");
      }

      toast.success("Booking reactivated successfully");
      fetchCancelledBookings();
    } catch (error) {
      console.error("Error reactivating booking:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reactivate booking");
    } finally {
      setProcessingBookingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cancelled Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all cancelled service bookings
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            All Bookings
          </Link>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaDownload className="mr-2 -ml-1 h-5 w-5" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2 text-gray-500" />
              <label htmlFor="dateRange" className="text-sm font-medium text-gray-700 mr-2">
                Date:
              </label>
              <select
                id="dateRange"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No cancelled bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("bookingId")}
                  >
                    Booking ID
                    {sortField === "bookingId" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("customerName")}
                  >
                    Customer
                    {sortField === "customerName" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("service")}
                  >
                    Service
                    {sortField === "service" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("cancelledAt")}
                  >
                    Cancelled Date
                    {sortField === "cancelledAt" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Reason
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    {sortField === "amount" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.bookingId || booking.id || booking._id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {booking.cancelledAt
                          ? formatDate(booking.cancelledAt)
                          : formatDate(booking.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        By: {booking.cancelledBy || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.cancellationReason || "No reason provided"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() +
                          booking.paymentStatus.slice(1)}
                      </span>
                      <div className="text-sm text-gray-500">
                        ₹{new Intl.NumberFormat('en-IN', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(booking.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* View Button */}
                        <button
                          onClick={() => setSelectedBookingId(booking._id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                          title="View Details"
                        >
                          <FaEye />
                        </button>

                        {/* Reactivate Button */}
                        <button
                          onClick={() => handleReactivateBooking(booking._id)}
                          disabled={processingBookingId === booking._id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 p-1 rounded hover:bg-green-100"
                          title="Reactivate Booking"
                        >
                          {processingBookingId === booking._id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                          ) : (
                            <FaUndo />
                          )}
                        </button>

                        {/* Print Button */}
                        <button
                          onClick={() => setSelectedBookingId(booking._id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                          title="Print Booking"
                        >
                          <FaPrint />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredBookings.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredBookings.length}</span> results
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
      <AdminBookingModal
        bookingId={selectedBookingId || ''}
        isOpen={!!selectedBookingId}
        onClose={() => {
          setSelectedBookingId(null);
          // Refresh the bookings list after closing the modal
          fetchCancelledBookings();
        }}
        onStatusChange={(status) => {
          // Refresh the bookings list after status change
          setTimeout(() => {
            fetchCancelledBookings();
          }, 1000);
        }}
      />
    </div>
  );
}
