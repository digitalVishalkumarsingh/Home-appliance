"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaSpinner,
  FaArrowLeft,
  FaHistory,
  FaCheck,
  FaTimes,
  FaClock,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  role: string;
  createdAt: string;
  stats: {
    bookingCount: number;
    completedBookingCount: number;
    totalSpent: number;
    lastBookingDate: string | null;
  };
}

interface Booking {
  _id: string;
  bookingId?: string;
  service: string;
  date: string;
  time?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  amount: number;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) {
      setError("Invalid customer ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please log in to view customer details");
          router.push("/admin/login");
          return;
        }

        // Fetch customer details
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/customers/${customerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch customer details: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.customer) {
          setCustomer(data.customer);

          // Fetch customer bookings
          const bookingsResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/customers/${customerId}/bookings`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!bookingsResponse.ok) {
            throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
          }

          const bookingsData = await bookingsResponse.json();
          if (bookingsData.success && Array.isArray(bookingsData.bookings)) {
            setBookings(bookingsData.bookings);
          } else {
            throw new Error("Invalid bookings response format");
          }
        } else {
          throw new Error(data.message || "Invalid customer data");
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch customer details");
        toast.error(error instanceof Error ? error.message : "Failed to fetch customer details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [customerId, router]);

  const formatDate = useMemo(
    () => (dateString: string | null) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    []
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
    switch (status.toLowerCase()) {
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

  const handleStatusChange = async (bookingId: string, newStatus: "pending" | "completed" | "cancelled") => {
    if (processingBooking) return; // Prevent multiple simultaneous requests

    try {
      setProcessingBooking(bookingId);

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
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `Failed to update booking status to ${newStatus}`;
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

      setBookings((prev) =>
        prev.map((booking) => (booking._id === bookingId ? { ...booking, status: newStatus } : booking))
      );
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating booking status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update booking status");
    } finally {
      setProcessingBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || "Failed to load customer details"}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => router.push("/admin/customers")}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaArrowLeft className="mr-2" /> Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/admin/customers")}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaArrowLeft className="mr-2" /> Back to Customers
        </button>
      </div>

      {/* Customer Profile */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Profile</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and booking history.</p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaUser className="h-8 w-8 text-gray-500" />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
                  <p className="text-sm text-gray-500">Customer since {formatDate(customer.createdAt)}</p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaEnvelope className="mr-2 text-gray-400" /> Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{customer.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaPhone className="mr-2 text-gray-400" /> Phone
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{customer.phone}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-gray-400" /> Address
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{customer.address || "No address provided"}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Customer Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-500">Total Bookings</div>
                  <div className="mt-1 flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{customer.stats.bookingCount}</div>
                    <div className="ml-2 text-sm text-gray-500">bookings</div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-500">Completed</div>
                  <div className="mt-1 flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{customer.stats.completedBookingCount}</div>
                    <div className="ml-2 text-sm text-gray-500">services</div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-500">Total Spent</div>
                  <div className="mt-1 flex items-baseline">
                    <FaRupeeSign className="text-gray-500" />
                    <div className="text-2xl font-semibold text-gray-900">
                      {new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0 }).format(customer.stats.totalSpent)}
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-sm font-medium text-gray-500">Last Booking</div>
                  <div className="mt-1">
                    <div className="text-sm font-medium text-gray-900">{formatDate(customer.stats.lastBookingDate)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Booking History</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} found
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="p-6 text-center">
            <FaHistory className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
            <p className="mt-1 text-sm text-gray-500">This customer hasn&apos;t made any bookings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
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
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{booking.service}</div>
                      <div className="text-sm text-gray-500">ID: {booking.bookingId || booking._id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                      <div className="text-sm text-gray-500">{booking.time || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaRupeeSign className="mr-1" />
                        {new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0 }).format(booking.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {booking.status !== "completed" && (
                          <button
                            onClick={() => handleStatusChange(booking._id, "completed")}
                            disabled={processingBooking === booking._id}
                            className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 disabled:opacity-50 transition-colors"
                            title="Mark as Completed"
                          >
                            {processingBooking === booking._id ? (
                              <FaSpinner className="animate-spin h-4 w-4" />
                            ) : (
                              <FaCheck className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {booking.status !== "pending" && (
                          <button
                            onClick={() => handleStatusChange(booking._id, "pending")}
                            disabled={processingBooking === booking._id}
                            className="p-1.5 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                            title="Mark as Pending"
                          >
                            {processingBooking === booking._id ? (
                              <FaSpinner className="animate-spin h-4 w-4" />
                            ) : (
                              <FaClock className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() => handleStatusChange(booking._id, "cancelled")}
                            disabled={processingBooking === booking._id}
                            className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50 transition-colors"
                            title="Cancel Booking"
                          >
                            {processingBooking === booking._id ? (
                              <FaSpinner className="animate-spin h-4 w-4" />
                            ) : (
                              <FaTimes className="h-4 w-4" />
                            )}
                          </button>
                        )}
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