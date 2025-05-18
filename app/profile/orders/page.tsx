"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaCalendarAlt,
  FaClock,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaCreditCard,
} from "react-icons/fa";
import Swal from "sweetalert2";

interface Payment {
  _id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  stripeSessionId?: string;
  stripePaymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  _id: string;
  bookingId: string;
  name: string;
  phone: string;
  service: string;
  serviceName: string;
  description: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid";
  amount: number;
  createdAt: string;
  updatedAt: string;
  payment: Payment | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");
  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    // Show success or cancelled message
    if (success === "true" && bookingId) {
      Swal.fire({
        title: "Payment Successful!",
        text: `Your payment for booking #${bookingId} has been processed successfully.`,
        icon: "success",
        confirmButtonText: "OK",
      });
    } else if (cancelled === "true" && bookingId) {
      Swal.fire({
        title: "Payment Cancelled",
        text: `Your payment for booking #${bookingId} has been cancelled.`,
        icon: "info",
        confirmButtonText: "OK",
      });
    }
  }, [success, cancelled, bookingId]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/user/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();
        setOrders(data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  // Function to load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async (order: Order) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Razorpay SDK failed to load");
      }

      // Create Razorpay order
      const response = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: order.bookingId,
          amount: order.amount,
          notes: {
            service: order.serviceName || order.service,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment order");
      }

      const data = await response.json();

      if (!data.order || !data.key) {
        throw new Error("Invalid response from server");
      }

      // Initialize Razorpay payment
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Dizit Solutions",
        description: `Payment for ${order.serviceName || order.service}`,
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              Swal.fire({
                title: "Payment Successful!",
                text: `Your payment for booking #${order.bookingId} has been processed successfully.`,
                icon: "success",
                confirmButtonText: "OK",
              }).then(() => {
                // Refresh the page to update the order status
                window.location.href = `/profile/orders?success=true&bookingId=${order.bookingId}`;
              });
            }
          } catch (error) {
            console.error("Error verifying payment:", error);
            Swal.fire({
              title: "Verification Error",
              text: "Payment was processed but verification failed. Please contact support.",
              icon: "warning",
              confirmButtonText: "OK",
            });
          }
        },
        prefill: {
          name: order.name,
          contact: order.phone,
        },
        theme: {
          color: "#3399cc",
        },
      };

      // Open Razorpay payment form
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error creating payment:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to process payment. Please try again later.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">You don't have any orders yet.</p>
          <Link
            href="/#services"
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Book a Service
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h2 className="text-xl font-semibold">
                      Booking #{order.bookingId}
                    </h2>
                    <p className="text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()} at{" "}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Service Details</h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-700">
                        <FaCalendarAlt className="mr-2 text-blue-500" />
                        {order.serviceName || order.service}
                      </p>
                      {order.description && (
                        <p className="text-gray-600">{order.description}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Payment Details</h3>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-700">
                        <FaMoneyBillWave className="mr-2 text-green-500" />
                        Amount: ₹{order.amount}
                      </p>
                      <p className="flex items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus === "paid" ? (
                            <span className="flex items-center">
                              <FaCheckCircle className="mr-1" /> Paid
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <FaTimesCircle className="mr-1" /> Pending
                            </span>
                          )}
                        </span>
                      </p>
                      {order.payment && order.payment.paymentMethod && (
                        <p className="text-gray-600">
                          Paid via {order.payment.paymentMethod}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {order.paymentStatus === "pending" && order.amount > 0 && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => handlePayNow(order)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FaCreditCard className="mr-2 -ml-1 h-5 w-5" />
                      Pay Now
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
