"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaSearch,
  FaCalendarAlt,
  FaEye,
  FaArrowLeft,
  FaDownload,
  FaUndo,
  FaExclamationTriangle,
} from "react-icons/fa";
import AdminBookingModal from "@/app/components/admin/AdminBookingModal";
import Pagination from "@/app/components/admin/Pagination";
import { toast } from "react-hot-toast";
import PrintBookingReceipt from "@/app/components/PrintBookingReceipt";

interface Booking {
  _id: string;
  id?: string;
  bookingId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
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
  payment?: {
    method: string;
    status: string;
    transactionId?: string;
    amount: number;
  };
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/bookings?status=cancelled`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch cancelled bookings: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
        setFilteredBookings(data.bookings);
      } else {
        throw new Error(data.message || "Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching cancelled bookings:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load cancelled bookings";
      toast.error(errorMessage);
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...bookings];

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

    if (selectedDateRange !== "all") {
      const today = new Date();
      const startDate = new Date();

      if (selectedDateRange === "today") {
        // No adjustment needed
      } else if (selectedDateRange === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (selectedDateRange === "month") {
        startDate.setMonth(today.getMonth() - 1);
      }

      filtered = filtered.filter((booking) => {
        const cancelDate = booking.cancelledAt ? new Date(booking.cancelledAt) : new Date(booking.date);
        return cancelDate >= startDate && cancelDate <= today;
      });
    }

    filtered.sort((a, b) => {
      let fieldA = a[sortField as keyof Booking];
      let fieldB = b[sortField as keyof Booking];

      if (sortField === "cancelledAt") {
        fieldA = a.cancelledAt || a.date;
        fieldB = b.cancelledAt || b.date;
      }

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      }

      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }

      return sortOrder === "asc" ? 1 : -1;
    });

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, selectedDateRange, sortField, sortOrder]);

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
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString("en-IN", options);
    } catch {
      return "N/A";
    }
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
    const headers = [
      "Booking ID",
      "Customer",
      "Phone",
      "Service",
      "Date",
      "Time",
      "Amount",
      "Cancelled At",
      "Cancelled By",
      "Reason",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredBookings.map((booking) =>
        [
          booking.bookingId || booking.id || booking._id,
          `"${booking.customerName}"`,
          booking.customerPhone,
          `"${booking.service}"`,
          formatDate(booking.date),
          booking.time,
          booking.amount,
          booking.cancelledAt ? formatDate(booking.cancelledAt) : formatDate(booking.date),
          booking.cancelledBy || "Unknown",
          `"${booking.cancellationReason || "No reason provided"}"`,
        ].join(",")
      ),
    ].join("\n");

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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "pending" }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reactivate booking");
      }

      toast.success("Booking reactivated successfully");
      fetchCancelledBookings();
    } catch (error) {
      console.error("Error reactivating booking:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reactivate booking";
      toast.error(errorMessage);
    } finally {
      setProcessingBookingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cancelled Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage all cancelled service bookings</p>
        </div>
        <div className="mt-4 flex space-x-3 sm:mt-0">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Return to all bookings"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" aria-hidden="true" />
            All Bookings
          </Link>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Export bookings to CSV"
          >
            <FaDownload className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-md flex-grow">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search bookings by customer, service, or reason"
              />
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2 text-gray-500" aria-hidden="true" />
              <label htmlFor="dateRange" className="mr-2 text-sm font-medium text-gray-700">
                Date:
              </label>
              <select
                id="dateRange"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:w-auto sm:text-sm"
                aria-label="Filter bookings by date range"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 rounded-full border-b-2 border-t-2 border-indigo-500"></div>
            <p className="mt-2 text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <p className="mt-2 text-gray-500">No cancelled bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => handleSort("bookingId")}
                  >
                    Booking ID
                    {sortField === "bookingId" && (
                      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => handleSort("customerName")}
                  >
                    Customer
                    {sortField === "customerName" && (
                      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => handleSort("service")}
                  >
                    Service
                    {sortField === "service" && (
                      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => handleSort("cancelledAt")}
                  >
                    Cancelled Date
                    {sortField === "cancelledAt" && (
                      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Reason
                  </th>
                  <th
                    scope="col"
                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    onClick={() => handleSort("amount")}
                  >
                    Amount
                    {sortField === "amount" && (
                      <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {currentBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {booking.bookingId || booking.id || booking._id.substring(0, 8)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{booking.customerName}</div>
                      <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{booking.service}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {booking.cancelledAt ? formatDate(booking.cancelledAt) : formatDate(booking.date)}
                      </div>
                      <div className="text-sm text-gray-500">By: {booking.cancelledBy || "Unknown"}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {booking.cancellationReason || "No reason provided"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPaymentStatusColor(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                      <div className="text-sm text-gray-500">
                        ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(booking.amount)}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedBookingId(booking._id)}
                          className="rounded p-1 text-blue-600 hover:bg-blue-100 hover:text-blue-900"
                          title="View Details"
                          aria-label={`View details for booking ${booking.bookingId || booking._id}`}
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleReactivateBooking(booking._id)}
                          disabled={processingBookingId === booking._id}
                          className="rounded p-1 text-green-600 hover:bg-green-100 hover:text-green-900 disabled:opacity-50"
                          title="Reactivate Booking"
                          aria-label={`Reactivate booking ${booking.bookingId || booking._id}`}
                        >
                          {processingBookingId === booking._id ? (
                            <div className="h-4 w-4 rounded-full border-2 border-green-500 border-t-transparent"></div>
                          ) : (
                            <FaUndo />
                          )}
                        </button>
                        <PrintBookingReceipt booking={booking} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredBookings.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
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

      <AdminBookingModal
        bookingId={selectedBookingId || ""}
        isOpen={!!selectedBookingId}
        onClose={() => {
          setSelectedBookingId(null);
          fetchCancelledBookings();
        }}
        onStatusChange={() => {
          setTimeout(() => {
            fetchCancelledBookings();
          }, 1000);
        }}
      />
    </div>
  );
}