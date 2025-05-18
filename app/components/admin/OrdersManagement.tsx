"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaTimes, FaEye, FaSpinner, FaClock, FaPrint } from "react-icons/fa";
import Link from "next/link";
import { toast } from "react-hot-toast";
import AdminBookingModal from "./AdminBookingModal";

interface Order {
  id: string;
  bookingId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  service: string;
  date: string;
  time?: string;
  address?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  amount: number;
  createdAt: string;
}

interface OrdersManagementProps {
  limit?: number;
  showViewAll?: boolean;
}

export default function OrdersManagement({ limit = 5, showViewAll = true }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        throw new Error("Not in browser environment");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        // Use mock data if no token is found
        setOrders(generateMockOrders(limit));
        return;
      }

      // Use the dedicated recent bookings endpoint
      const response = await fetch("/api/admin/bookings/recent", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch recent orders";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Fetched orders data:", data);

      if (Array.isArray(data)) {
        // If the API returns an array directly
        const formattedOrders = data.map((booking: any) => ({
          id: booking._id || booking.id,
          bookingId: booking.bookingId || booking.id,
          customerName: booking.customerName || `${booking.firstName || ""} ${booking.lastName || ""}`.trim(),
          customerEmail: booking.email || booking.customerEmail,
          customerPhone: booking.phone || booking.customerPhone,
          service: booking.service || booking.serviceName,
          date: booking.date || booking.bookingDate,
          time: booking.time || booking.bookingTime,
          address: booking.address,
          status: booking.status || "pending",
          paymentStatus: booking.paymentStatus || "pending",
          amount: booking.amount || 0,
          createdAt: booking.createdAt || new Date().toISOString(),
        }));

        // Sort by date (newest first) and limit if needed
        const sortedOrders = formattedOrders
          .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);

        setOrders(sortedOrders);
      } else if (data.bookings && Array.isArray(data.bookings)) {
        // If the API returns a wrapper object with bookings array
        const formattedOrders = data.bookings.map((booking: any) => ({
          id: booking._id || booking.id,
          bookingId: booking.bookingId || booking.id,
          customerName: booking.customerName || `${booking.firstName || ""} ${booking.lastName || ""}`.trim(),
          customerEmail: booking.email || booking.customerEmail,
          customerPhone: booking.phone || booking.customerPhone,
          service: booking.service || booking.serviceName,
          date: booking.date || booking.bookingDate,
          time: booking.time || booking.bookingTime,
          address: booking.address,
          status: booking.status || "pending",
          paymentStatus: booking.paymentStatus || "pending",
          amount: booking.amount || 0,
          createdAt: booking.createdAt || new Date().toISOString(),
        }));

        // Sort by date (newest first) and limit if needed
        const sortedOrders = formattedOrders
          .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);

        setOrders(sortedOrders);
      } else if (data.success === false) {
        // Handle explicit error response
        throw new Error(data.message || "Failed to fetch orders");
      } else {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Use mock data for demonstration
      setOrders(generateMockOrders(limit));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "pending" | "confirmed" | "completed" | "cancelled") => {
    try {
      setProcessingOrder(id);

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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      // Update the order status in the state
      setOrders(
        orders.map((order) =>
          order.id === id ? { ...order, status: newStatus } : order
        )
      );

      // Show appropriate success message based on the new status
      let successMessage = "";
      switch (newStatus) {
        case "pending":
          successMessage = "Order marked as pending";
          break;
        case "confirmed":
          successMessage = "Order accepted successfully";
          break;
        case "completed":
          successMessage = "Order marked as completed";
          break;
        case "cancelled":
          successMessage = "Order cancelled successfully";
          break;
        default:
          successMessage = "Order status updated successfully";
      }

      toast.success(successMessage);

      // Refresh the orders list after a short delay
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    } catch (error: any) {
      console.error(`Error updating order status:`, error);
      toast.error(error.message || `Failed to update order status. Please try again.`);
    } finally {
      setProcessingOrder(null);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage customer orders and bookings
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
          disabled={loading}
        >
          {loading ? (
            <FaSpinner className="animate-spin h-4 w-4 mr-1" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center p-8">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No orders found</p>
          <p className="text-sm mt-1">New orders will appear here when customers make bookings</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.service}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(order.date).toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500">{order.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{order.amount.toLocaleString()}</div>
                    <div className={`text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {/* View Details Button (always visible) */}
                      <button
                        onClick={() => setSelectedBookingId(order.id)}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
                        title="View Details"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>

                      {/* Print Button (always visible) */}
                      <button
                        onClick={() => setSelectedBookingId(order.id)}
                        className="p-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
                        title="Print Order"
                      >
                        <FaPrint className="h-4 w-4" />
                      </button>

                      {/* Status-specific action buttons */}
                      {order.status === "pending" && (
                        <>
                          {/* Accept Button */}
                          <button
                            onClick={() => handleStatusChange(order.id, "confirmed")}
                            disabled={processingOrder === order.id}
                            className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 disabled:opacity-50 transition-colors"
                            title="Accept Order"
                          >
                            {processingOrder === order.id ? (
                              <FaSpinner className="animate-spin h-4 w-4" />
                            ) : (
                              <FaCheck className="h-4 w-4" />
                            )}
                          </button>

                          {/* Cancel Button */}
                          <button
                            onClick={() => handleStatusChange(order.id, "cancelled")}
                            disabled={processingOrder === order.id}
                            className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50 transition-colors"
                            title="Cancel Order"
                          >
                            <FaTimes className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {order.status === "confirmed" && (
                        <>
                          {/* Complete Button */}
                          <button
                            onClick={() => handleStatusChange(order.id, "completed")}
                            disabled={processingOrder === order.id}
                            className="p-1.5 bg-green-100 text-green-600 rounded-full hover:bg-green-200 disabled:opacity-50 transition-colors"
                            title="Mark as Completed"
                          >
                            {processingOrder === order.id ? (
                              <FaSpinner className="animate-spin h-4 w-4" />
                            ) : (
                              <FaCheck className="h-4 w-4" />
                            )}
                          </button>

                          {/* Cancel Button */}
                          <button
                            onClick={() => handleStatusChange(order.id, "cancelled")}
                            disabled={processingOrder === order.id}
                            className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 disabled:opacity-50 transition-colors"
                            title="Cancel Order"
                          >
                            <FaTimes className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {(order.status === "completed" || order.status === "cancelled") && (
                        <>
                          {/* Mark as Pending Button */}
                          <button
                            onClick={() => handleStatusChange(order.id, "pending")}
                            disabled={processingOrder === order.id}
                            className="p-1.5 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 disabled:opacity-50 transition-colors"
                            title="Mark as Pending"
                          >
                            {processingOrder === order.id ? (
                              <FaSpinner className="animate-spin h-4 w-4" />
                            ) : (
                              <FaClock className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showViewAll && (
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
          <Link
            href="/admin/bookings"
            className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            View All Orders
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      )}

      {/* Booking Details Modal */}
      <AdminBookingModal
        bookingId={selectedBookingId || ''}
        isOpen={!!selectedBookingId}
        onClose={() => {
          setSelectedBookingId(null);
          // Refresh the orders list after closing the modal
          setTimeout(() => {
            fetchOrders();
          }, 500);
        }}
        onStatusChange={(status) => {
          // Handle status change
          if (selectedBookingId) {
            handleStatusChange(selectedBookingId, status as any);
          }
        }}
      />
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
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
}

function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "paid":
      return "text-green-600";
    case "pending":
      return "text-yellow-600";
    case "failed":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

// Mock data generator for testing
function generateMockOrders(count: number): Order[] {
  const services = ["AC Repair", "AC Installation", "Washing Machine Repair", "Refrigerator Service"];
  const statuses = ["pending", "confirmed", "completed", "cancelled"] as const;
  const paymentStatuses = ["pending", "paid", "failed"] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `order-${i + 1}`,
    customerName: `Customer ${i + 1}`,
    customerPhone: `98765${i}${i}${i}${i}${i}`,
    service: services[Math.floor(Math.random() * services.length)],
    date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    time: `${Math.floor(Math.random() * 12) + 1}:00 ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    paymentStatus: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
    amount: Math.floor(Math.random() * 5000) + 1000,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
