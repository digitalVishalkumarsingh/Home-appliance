"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaSpinner,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaEye,
  FaTools,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaUser,
  FaPhone,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface Booking {
  _id: string;
  bookingId: string;
  service: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  customerName: string;
  customerPhone: string;
  address: string;
  amount: number;
  scheduledDate?: string;
  createdAt: string;
  notes?: string;
  urgency?: "normal" | "high" | "emergency";
}

interface Props {
  initialBookings: Booking[];
  token: string;
}

export default function TechnicianBookingsClient({ initialBookings, token }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(initialBookings);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      let response = await fetch(`${apiUrl}/technicians/jobs/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.log("Falling back to /api/bookings...");
        response = await fetch(`${apiUrl}/bookings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch bookings");
      }

      const bookingsData = data.jobHistory || data.bookings || [];
      const formattedBookings = bookingsData.map((booking: any) => ({
        _id: booking._id || booking.id || `booking-${Math.random().toString(36).slice(2, 11)}`,
        bookingId: booking.bookingId || booking._id || booking.id || "Unknown",
        service: booking.service || booking.appliance || "Appliance Repair",
        status: booking.status || "pending",
        customerName: booking.customerName || booking.customer?.name || "Customer",
        customerPhone: booking.customerPhone || booking.customer?.phone || "",
        address: booking.address || booking.location?.address || "Customer Address",
        amount: booking.amount || booking.earnings?.total || 0,
        scheduledDate: booking.scheduledDate || booking.appointmentDate,
        createdAt: booking.createdAt || new Date().toISOString(),
        notes: booking.notes || booking.description,
        urgency: booking.urgency || "normal",
      }));

      setBookings(formattedBookings);
      setFilteredBookings(formattedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Failed to fetch bookings. Please try again later.");
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let filtered = bookings;

    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.customerName.toLowerCase().includes(query) ||
          booking.service.toLowerCase().includes(query) ||
          booking.address.toLowerCase().includes(query) ||
          (booking.bookingId && booking.bookingId.toLowerCase().includes(query)),
      );
    }

    setFilteredBookings(filtered);
  }, [statusFilter, searchQuery, bookings]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage all your service bookings</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <div className="relative">
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Bookings</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FaFilter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Bookings
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by name, service, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <FaExclamationTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchBookings}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <FaCalendarCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter !== "all"
              ? "Try changing your filters or search query"
              : "You don't have any bookings yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <li key={booking._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">{booking.service}</p>
                      <div
                        className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                          booking.status,
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                      {booking.urgency === "high" && (
                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <Link
                        href={`/technician/bookings/${booking._id}`}
                        className="ml-2 px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                      >
                        <FaEye className="inline-block mr-1" /> View Details
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaUser className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {booking.customerName}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        <FaPhone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        {booking.customerPhone}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <FaRupeeSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      ₹{booking.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {booking.address}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <FaClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {booking.scheduledDate ? formatDate(booking.scheduledDate) : formatDate(booking.createdAt)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}