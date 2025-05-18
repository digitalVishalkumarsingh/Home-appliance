"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaBell, FaCheck, FaTimes, FaSpinner, FaExclamationTriangle } from "react-icons/fa";
import Link from "next/link";

interface Booking {
  id: string;
  bookingId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  service: string;
  date: string;
  time?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export default function BookingAlerts() {
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      // Check if token exists before fetching
      const token = localStorage.getItem("token");
      if (token) {
        fetchRecentBookings();

        // Set up polling to check for new bookings every 2 minutes
        const intervalId = setInterval(fetchRecentBookings, 2 * 60 * 1000);

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
      } else {
        // If no token, set appropriate error state but don't show error immediately
        setLoading(false);
        setError("Authentication token not found");

        // Set up retry mechanism - try up to 5 times with increasing delay
        if (retryCount < 5) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`No auth token found. Retrying in ${retryDelay/1000} seconds...`);

          const retryTimeout = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);

          return () => clearTimeout(retryTimeout);
        }
      }
    }
  }, [retryCount]);

  const fetchRecentBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      const response = await fetch("/api/admin/bookings/recent", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Check if response has content before trying to parse it
        const text = await response.text();
        let errorMessage = "Failed to fetch recent bookings";

        if (text) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
        }

        throw new Error(errorMessage);
      }

      // Check if response has content before trying to parse it
      const text = await response.text();
      const data = text ? JSON.parse(text) : { success: true, bookings: [] };

      // Filter for only pending bookings
      let pendingBookings: Booking[] = [];

      // Handle the new API response format
      if (data.success && data.bookings && Array.isArray(data.bookings)) {
        pendingBookings = data.bookings
          .filter((booking: any) => booking.status === "pending")
          .map((booking: any) => ({
            id: booking._id || booking.id,
            bookingId: booking.bookingId || booking.id,
            customerName: booking.customerName || `${booking.firstName || ""} ${booking.lastName || ""}`.trim(),
            customerEmail: booking.email || booking.customerEmail,
            customerPhone: booking.phone || booking.customerPhone,
            service: booking.service || booking.serviceName,
            date: booking.date || booking.bookingDate,
            time: booking.time || booking.bookingTime,
            status: booking.status || "pending",
            createdAt: booking.createdAt || new Date().toISOString(),
          }));
      }
      // Fallback for old API format (array response)
      else if (Array.isArray(data)) {
        pendingBookings = data
          .filter((booking: any) => booking.status === "pending")
          .map((booking: any) => ({
            id: booking._id || booking.id,
            bookingId: booking.bookingId || booking.id,
            customerName: booking.customerName || `${booking.firstName || ""} ${booking.lastName || ""}`.trim(),
            customerEmail: booking.email || booking.customerEmail,
            customerPhone: booking.phone || booking.customerPhone,
            service: booking.service || booking.serviceName,
            date: booking.date || booking.bookingDate,
            time: booking.time || booking.bookingTime,
            status: booking.status || "pending",
            createdAt: booking.createdAt || new Date().toISOString(),
          }));
      }

      // Sort by creation date (newest first)
      pendingBookings.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Filter out dismissed alerts
      const filteredBookings = pendingBookings.filter(
        booking => !dismissedAlerts.includes(booking.id)
      );

      setRecentBookings(filteredBookings);
    } catch (error: any) {
      console.error("Error fetching recent bookings:", error);
      setError(error.message || "Failed to fetch recent bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "confirmed" | "cancelled") => {
    try {
      setProcessingBooking(id);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Check if response has content before trying to parse it
        const text = await response.text();
        let errorMessage = "Failed to update booking status";

        if (text) {
          try {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
          }
        }

        throw new Error(errorMessage);
      }

      // Remove the booking from the alerts list
      setRecentBookings(recentBookings.filter(booking => booking.id !== id));

    } catch (error: any) {
      console.error(`Error ${newStatus === "confirmed" ? "accepting" : "declining"} booking:`, error);
      setError(error.message || `Failed to ${newStatus === "confirmed" ? "accept" : "decline"} booking`);
    } finally {
      setProcessingBooking(null);
    }
  };

  const dismissAlert = (id: string) => {
    setDismissedAlerts([...dismissedAlerts, id]);
    setRecentBookings(recentBookings.filter(booking => booking.id !== id));
  };

  if (loading && recentBookings.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-4 animate-pulse">
        <div className="flex items-center mb-4">
          <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error && recentBookings.length === 0) {
    // Don't show the authentication error prominently, as it might just be that the user isn't logged in yet
    if (error === "Authentication token not found") {
      return null;
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3" />
          <p className="text-red-700">Error loading booking alerts: {error}</p>
        </div>
      </div>
    );
  }

  if (recentBookings.length === 0) {
    return null; // Don't show anything if there are no pending bookings
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-yellow-200">
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 py-3 border-b border-yellow-200">
        <div className="flex items-center">
          <FaBell className="text-amber-500 mr-2" />
          <h3 className="text-lg font-medium text-amber-800">Booking Alerts</h3>
          <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            {recentBookings.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        <AnimatePresence>
          {recentBookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                  <p className="text-sm text-gray-500">
                    {booking.service} - {new Date(booking.date).toLocaleDateString()} {booking.time}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Booked {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusChange(booking.id, "confirmed")}
                    disabled={processingBooking === booking.id}
                    className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 disabled:opacity-50 transition-colors"
                    title="Accept Booking"
                  >
                    {processingBooking === booking.id ? (
                      <FaSpinner className="animate-spin h-4 w-4" />
                    ) : (
                      <FaCheck className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleStatusChange(booking.id, "cancelled")}
                    disabled={processingBooking === booking.id}
                    className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50 transition-colors"
                    title="Decline Booking"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => dismissAlert(booking.id)}
                    disabled={processingBooking === booking.id}
                    className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    title="Dismiss Alert"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {recentBookings.length > 0 && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <Link
            href="/admin/bookings?status=pending"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center"
          >
            View all pending bookings
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
