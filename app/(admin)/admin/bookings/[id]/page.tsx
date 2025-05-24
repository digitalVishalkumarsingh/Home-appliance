"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaRupeeSign,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaExclamationCircle,
  FaInfoCircle,
  FaClipboardCheck,
} from "react-icons/fa";
import PrintBookingReceipt from "../../../../components/PrintBookingReceipt";

interface Booking {
  _id: string;
  bookingId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  service: string;
  date?: string;
  scheduledDate?: string;
  serviceDate?: string;
  bookingDate?: string;
  time?: string;
  scheduledTime?: string;
  serviceTime?: string;
  bookingTime?: string;
  address?: string;
  customerAddress?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  createdAt: string;
  notes?: { [key: string]: any };
  payment?: any;
}

export default function AdminBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showPaymentStatusDropdown, setShowPaymentStatusDropdown] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPaymentStatusDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest(".payment-status-dropdown")) {
          setShowPaymentStatusDropdown(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPaymentStatusDropdown]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/bookings/${bookingId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch booking details: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        throw new Error(data.message || "Failed to fetch booking details");
      }
    } catch (error: any) {
      console.error("Error fetching booking details:", error);
      setError(error.message || "Failed to load booking details");
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setProcessingAction(status);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update booking status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        setBooking((prev) => (prev ? { ...prev, status: status as Booking["status"] } : null));
        toast.success(`Booking ${status === "confirmed" ? "accepted" : status} successfully`);
      } else {
        throw new Error(data.message || "Failed to update booking status");
      }
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      toast.error(error.message || "Failed to update booking status");
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePaymentStatusUpdate = async (paymentStatus: string) => {
    try {
      setProcessingAction(`payment-${paymentStatus}`);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/bookings/${bookingId}/payment-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ paymentStatus }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update payment status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.success) {
        setBooking((prev) => (prev ? { ...prev, paymentStatus: paymentStatus as Booking["paymentStatus"] } : null));
        toast.success(`Payment status updated to ${paymentStatus.toUpperCase()} successfully`);
        setShowPaymentStatusDropdown(false);
      } else {
        throw new Error(data.message || "Failed to update payment status");
      }
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast.error(error.message || "Failed to update payment status");
    } finally {
      setProcessingAction(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
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
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow">
          <div className="flex h-64 items-center justify-center">
            <FaSpinner className="h-8 w-8 text-indigo-600" aria-hidden="true" />
            <span className="ml-2 text-lg text-gray-600">Loading booking details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow">
          <div className="flex h-64 flex-col items-center justify-center">
            <FaExclamationCircle className="mb-4 h-12 w-12 text-red-500" aria-hidden="true" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">Error Loading Booking</h2>
            <p className="mb-4 text-gray-600">{error}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => fetchBookingDetails()}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Retry loading booking details"
              >
                Try Again
              </button>
              <Link
                href="/admin/bookings"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                aria-label="Return to bookings list"
              >
                Back to Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl rounded-lg bg-white p-6 shadow">
          <div className="flex h-64 flex-col items-center justify-center">
            <FaInfoCircle className="mb-4 h-12 w-12 text-blue-500" aria-hidden="true" />
            <h2 className="mb-2 text-xl font-bold text-gray-900">Booking Not Found</h2>
            <p className="mb-4 text-gray-600">The booking you're looking for could not be found.</p>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Return to bookings list"
            >
              Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label="Return to bookings list"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to Bookings
          </Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900">Booking Details</h1>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200 p-4 sm:p-6 sm:flex sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Booking ID: {booking.bookingId || booking._id}
              </h2>
              <p className="text-sm text-gray-500">Created: {formatDate(booking.createdAt)}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                  booking.status
                )}`}
              >
                Status: {booking.status.toUpperCase()}
              </span>
              <div className="relative payment-status-dropdown">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium cursor-pointer ${getPaymentStatusColor(
                    booking.paymentStatus
                  )}`}
                  onClick={() => setShowPaymentStatusDropdown(!showPaymentStatusDropdown)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setShowPaymentStatusDropdown(!showPaymentStatusDropdown);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={showPaymentStatusDropdown}
                  aria-label="Toggle payment status dropdown"
                >
                  Payment: {booking.paymentStatus.toUpperCase()}
                </span>
                {showPaymentStatusDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-label="Payment status options"
                  >
                    <div className="py-1">
                      {["pending", "paid", "failed", "refunded"].map((status) => (
                        <button
                          key={status}
                          onClick={() => handlePaymentStatusUpdate(status)}
                          disabled={processingAction !== null || booking.paymentStatus === status}
                          className={`w-full px-4 py-2 text-left text-sm ${
                            booking.paymentStatus === status
                              ? `bg-${
                                  status === "pending"
                                    ? "yellow"
                                    : status === "paid"
                                    ? "green"
                                    : status === "failed"
                                    ? "red"
                                    : "blue"
                                }-50 text-${
                                  status === "pending"
                                    ? "yellow"
                                    : status === "paid"
                                    ? "green"
                                    : status === "failed"
                                    ? "red"
                                    : "blue"
                                }-700`
                              : "text-gray-700 hover:bg-gray-100"
                          } disabled:opacity-50`}
                          role="menuitem"
                          aria-disabled={processingAction !== null || booking.paymentStatus === status}
                        >
                          {processingAction === `payment-${status}`
                            ? "Updating..."
                            : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-4 sm:p-6">
            <h3 className="mb-4 flex items-center text-lg font-medium text-gray-900">
              <FaUser className="mr-2 text-gray-500" aria-hidden="true" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-sm text-gray-900">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="flex items-center text-sm text-gray-900">
                  <FaPhone className="mr-1 text-gray-400" aria-hidden="true" />
                  {booking.customerPhone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="flex items-center text-sm text-gray-900">
                  <FaEnvelope className="mr-1 text-gray-400" aria-hidden="true" />
                  {booking.customerEmail || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="flex items-start text-sm text-gray-900">
                  <FaMapMarkerAlt className="mr-1 mt-1 text-gray-400" aria-hidden="true" />
                  <span>{booking.address || booking.customerAddress || "N/A"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 p-4 sm:p-6">
            <h3 className="mb-4 flex items-center text-lg font-medium text-gray-900">
              <FaCalendarAlt className="mr-2 text-gray-500" aria-hidden="true" /> Service Details
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-500">Service</p>
                <p className="text-sm text-gray-900">{booking.service}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="flex items-center text-sm text-gray-900">
                  <FaCalendarAlt className="mr-1 text-gray-400" aria-hidden="true" />
                  {formatDate(booking.date || booking.scheduledDate || booking.serviceDate || booking.bookingDate || "")}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Time</p>
                <p className="flex items-center text-sm text-gray-900">
                  <FaClock className="mr-1 text-gray-400" aria-hidden="true" />
                  {formatTime(booking.time || booking.scheduledTime || booking.serviceTime || booking.bookingTime)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="flex items-center text-sm text-gray-900">
                  <FaRupeeSign className="mr-1 text-gray-400" aria-hidden="true" />
                  {formatAmount(booking.amount || 0)}
                </p>
              </div>
            </div>
          </div>

          {booking.payment && (
            <div className="border-b border-gray-200 p-4 sm:p-6">
              <h3 className="mb-4 flex items-center text-lg font-medium text-gray-900">
                <FaRupeeSign className="mr-2 text-gray-500" aria-hidden="true" /> Payment Details
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment ID</p>
                  <p className="text-sm text-gray-900">{booking.payment.paymentId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Order ID</p>
                  <p className="text-sm text-gray-900">{booking.payment.orderId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Date</p>
                  <p className="text-sm text-gray-900">
                    {booking.payment.createdAt ? formatDate(booking.payment.createdAt) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Method</p>
                  <p className="text-sm text-gray-900">{booking.payment.method || "Online"}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 bg-gray-50 p-4 sm:p-6">
            <button
              onClick={() => handleStatusUpdate("confirmed")}
              disabled={
                !!processingAction ||
                booking.status === "confirmed" ||
                booking.status === "completed" ||
                booking.status === "cancelled"
              }
              className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label="Accept booking"
            >
              {processingAction === "confirmed" ? (
                <FaSpinner className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <FaCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Accept
            </button>
            <button
              onClick={() => handleStatusUpdate("completed")}
              disabled={
                !!processingAction ||
                booking.status === "completed" ||
                booking.status === "cancelled" ||
                booking.status === "pending"
              }
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label="Complete booking"
            >
              {processingAction === "completed" ? (
                <FaSpinner className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <FaClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Complete
            </button>
            <button
              onClick={() => handleStatusUpdate("cancelled")}
              disabled={!!processingAction || booking.status === "cancelled" || booking.status === "completed"}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              aria-label="Cancel booking"
            >
              {processingAction === "cancelled" ? (
                <FaSpinner className="mr-2 h-4 w-4" aria-hidden="true" />
              ) : (
                <FaTimes className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Cancel
            </button>
            <PrintBookingReceipt booking={booking} />
          </div>
        </div>
      </div>
    </div>
  );
}