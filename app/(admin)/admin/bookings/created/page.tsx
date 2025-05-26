"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FaSearch,
  FaCalendarAlt,
  FaEye,
  FaArrowLeft,
  FaDownload,
  FaPrint,
  FaCheck,
  FaTimes,
  FaExclamationCircle,
} from "react-icons/fa";
import AdminBookingModal from "@/app/components/admin/AdminBookingModal";
import Pagination from "@/app/components/admin/Pagination";
import { toast } from "react-hot-toast";

interface Booking {
  _id: string;
  bookingId?: string;
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
  createdAt: string;
}

export default function CreatedBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedDateRange, setSelectedDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Booking>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  // Fetch pending bookings
  useEffect(() => {
    const fetchCreatedBookings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication token not found. Please log in again.");
        }

        const response = await fetch(`/api/admin/bookings?status=pending`, {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
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
        console.error("Error fetching pending bookings:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load pending bookings");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatedBookings();
  }, []);

  // Memoized filtered and sorted bookings
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(searchLower) ||
          booking.service.toLowerCase().includes(searchLower) ||
          booking.customerPhone.includes(searchTerm) ||
          (booking.bookingId && booking.bookingId.toLowerCase().includes(searchLower))
      );
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
        const createDate = new Date(booking.createdAt);
        return createDate >= startDate && createDate <= today;
      });
    }

    // Sort bookings
    filtered.sort((a, b) => {
      const fieldA = a[sortField];
      const fieldB = b[sortField];

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      }
      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }
      return sortOrder === "asc" ? 1 : -1;
    });

    return filtered;
  }, [bookings, searchTerm, selectedDateRange, sortField, sortOrder]);

  // Pagination
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

  const formatTime = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Booking ID", "Customer", "Phone", "Service", "Date", "Time", "Amount", "Created At"];
    const csvContent = [
      headers.join(","),
      ...filteredBookings.map((booking) =>
        [
          booking.bookingId || booking._id,
          `"${booking.customerName}"`,
          booking.customerPhone,
          `"${booking.service}"`,
          formatDate(booking.date),
          booking.time,
          booking.amount,
          `${formatDate(booking.createdAt)} ${formatTime(booking.createdAt)}`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pending-bookings-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (bookingId: string, status: "confirmed" | "cancelled") => {
    if (processingBookingId) return; // Prevent multiple simultaneous requests

    try {
      setProcessingBookingId(bookingId);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${status} booking`);
      }

      toast.success(`Booking ${status} successfully`);
      // Refresh bookings
      const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/bookings?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await fetchResponse.json();
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error(`Error updating booking status to ${status}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${status} booking`);
    } finally {
      setProcessingBookingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">New Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all newly created service bookings
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
                onChange={(e) => setSelectedDateRange(e.target.value as typeof selectedDateRange)}
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

        {/* Alert for new bookings */}
        {filteredBookings.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You have {filteredBookings.length} new booking{filteredBookings.length !== 1 ? "s" : ""} that need
                  {filteredBookings.length === 1 ? "s" : ""} to be confirmed or assigned.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Table */}
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No new bookings found</p>
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
                    {sortField === "bookingId" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("customerName")}
                  >
                    Customer
                    {sortField === "customerName" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("service")}
                  >
                    Service
                    {sortField === "service" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("date")}
                  >
                    Appointment Date
                    {sortField === "date" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created At
                    {sortField === "createdAt" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    {sortField === "amount" && <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>}
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
                      {booking.bookingId || booking._id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                      <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.service}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                      <div className="text-sm text-gray-500">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedBookingId(booking._id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking._id, "confirmed")}
                          disabled={processingBookingId === booking._id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50 p-1 rounded hover:bg-green-100"
                          title="Accept Booking"
                        >
                          {processingBookingId === booking._id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                          ) : (
                            <FaCheck />
                          )}
                        </button>
                        <button
                          onClick={() => handleStatusChange(booking._id, "cancelled")}
                          disabled={processingBookingId === booking._id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 p-1 rounded hover:bg-red-100"
                          title="Cancel Booking"
                        >
                          <FaTimes />
                        </button>
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
            // Refresh bookings
            setLoading(true);
            const token = localStorage.getItem("token");
            if (token) {
              fetch(`/api/admin/bookings?status=pending`, {
                method: 'GET',
                credentials: 'include', // Include cookies in the request
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