"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaRupeeSign,
  FaCheck,
  FaSpinner,
  FaPrint
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import BookingPrintButton from "./BookingPrintTemplate";

interface Booking {
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
  notes?: string;
  serviceDetails?: string;
}

interface BookingDetailsModalProps {
  bookingId: string | null;
  onClose: () => void;
  onStatusChange: (id: string, status: "confirmed" | "cancelled" | "completed" | "pending") => Promise<void>;
}

export default function BookingDetailsModal({ bookingId, onClose, onStatusChange }: BookingDetailsModalProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      console.log("BookingDetailsModal: Fetching details for booking ID:", bookingId);
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    if (!bookingId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Authentication token not found in localStorage");
        setError("Authentication token not found");
        return;
      }

      console.log("Fetching booking details for ID:", bookingId, "with token:", token.substring(0, 10) + "...");

      // Make sure we're using the correct API endpoint
      console.log(`Making API request to: /api/admin/bookings/${bookingId}`);

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMessage = "Failed to fetch booking details";

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

      const data = await response.json();
      console.log("Booking data received:", data);

      // Log the response status and headers for debugging
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries([...response.headers]));

      if (data && data.success && data.booking) {
        const bookingData = data.booking;

        setBooking({
          id: bookingData._id || bookingData.id,
          bookingId: bookingData.bookingId || bookingData._id || bookingData.id,
          customerName: bookingData.customerName || `${bookingData.firstName || ""} ${bookingData.lastName || ""}`.trim(),
          customerEmail: bookingData.email || bookingData.customerEmail,
          customerPhone: bookingData.phone || bookingData.customerPhone,
          service: bookingData.service || bookingData.serviceName,
          date: bookingData.date || bookingData.bookingDate,
          time: bookingData.time || bookingData.bookingTime,
          address: bookingData.address,
          status: bookingData.status || "pending",
          paymentStatus: bookingData.paymentStatus || "pending",
          amount: bookingData.amount || 0,
          createdAt: bookingData.createdAt || new Date().toISOString(),
          notes: bookingData.notes || "",
          serviceDetails: bookingData.serviceDetails || "",
        });
      } else if (data && !data.success) {
        throw new Error(data.message || "Failed to fetch booking details");
      } else {
        throw new Error("Invalid booking data received");
      }
    } catch (error: any) {
      console.error("Error fetching booking details:", error);
      setError(error.message || "Failed to fetch booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!booking) return;

    try {
      setProcessingStatus(status);
      console.log(`Changing booking status: ID=${booking.id}, New Status=${status}`);

      // Call the parent component's onStatusChange function
      await onStatusChange(booking.id, status as any);

      // Update the local booking state with the new status
      setBooking(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: status as "pending" | "confirmed" | "completed" | "cancelled"
        };
      });

      // Show success message
      toast.success(`Booking ${status === "confirmed" ? "accepted" : status} successfully`);
    } catch (error) {
      console.error(`Error changing booking status to ${status}:`, error);
      toast.error(`Failed to ${status === "confirmed" ? "accept" : status} booking. Please try again.`);
    } finally {
      setProcessingStatus(null);
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

  // Function to handle printing directly
  const handlePrint = () => {
    if (!booking) return;

    try {
      console.log("Printing booking:", booking);

      // Create a print iframe instead of a new window
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Format amount for display
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(booking.amount);

      // Create HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Booking Details - ${booking.bookingId || booking.id}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eaeaea;
            }
            .logo-container {
              display: flex;
              align-items: center;
            }
            .logo-fallback {
              width: 60px;
              height: 60px;
              background-color: #e6f2ff;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #0066cc;
              margin-right: 15px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .company-tagline {
              font-size: 14px;
              color: #666;
              margin: 5px 0 0 0;
            }
            .booking-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
            }
            .booking-id {
              font-size: 18px;
              font-weight: bold;
            }
            .booking-date {
              font-size: 14px;
              color: #666;
            }
            .status-badge {
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: bold;
              display: inline-block;
            }
            .section {
              margin-bottom: 25px;
              padding: 15px;
              border: 1px solid #eaeaea;
              border-radius: 8px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 0;
              margin-bottom: 15px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .field-label {
              font-size: 14px;
              color: #666;
              margin-bottom: 5px;
            }
            .field-value {
              font-weight: 500;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eaeaea;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-container">
              <div class="logo-fallback">DS</div>
              <div>
                <h1 class="company-name">Dizit Solution</h1>
                <p class="company-tagline">Professional Home Services</p>
              </div>
            </div>
            <div>
              <h2 style="margin: 0; font-size: 20px;">Booking Receipt</h2>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Date: ${formatDate(new Date().toISOString())}</p>
            </div>
          </div>

          <div class="booking-header">
            <div>
              <div class="booking-id">Booking ID: ${booking.bookingId || booking.id}</div>
              <div class="booking-date">Created: ${booking.createdAt ? formatDate(booking.createdAt) : 'N/A'}</div>
            </div>
            <div>
              <span class="status-badge" style="background-color: ${getStatusColor(booking.status).split(' ')[0].replace('bg-', '#')}; color: #1F2937;">
                Status: ${booking.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Customer Information</h3>
            <div class="grid">
              <div>
                <div class="field-label">Name</div>
                <div class="field-value">${booking.customerName}</div>
              </div>
              <div>
                <div class="field-label">Phone</div>
                <div class="field-value">${booking.customerPhone || 'N/A'}</div>
              </div>
              <div>
                <div class="field-label">Email</div>
                <div class="field-value">${booking.customerEmail || 'N/A'}</div>
              </div>
              <div>
                <div class="field-label">Address</div>
                <div class="field-value">${booking.address || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Service Details</h3>
            <div class="grid">
              <div>
                <div class="field-label">Service</div>
                <div class="field-value">${booking.service}</div>
              </div>
              <div>
                <div class="field-label">Amount</div>
                <div class="field-value">${formattedAmount}</div>
              </div>
              <div>
                <div class="field-label">Date</div>
                <div class="field-value">${booking.date ? formatDate(booking.date) : 'Not scheduled'}</div>
              </div>
              <div>
                <div class="field-label">Time</div>
                <div class="field-value">${booking.time || 'Not specified'}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Dizit Solution for your home service needs.</p>
            <p>For any queries, please contact us at: <strong>9112564731</strong></p>
            <p>www.dizitsolution.com</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print(); setTimeout(() => window.close(), 500);" style="padding: 10px 20px; background-color: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
              Print Receipt
            </button>
          </div>
        </body>
        </html>
      `;

      // Write to the iframe
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDocument) {
        throw new Error("Could not access iframe document");
      }

      iframeDocument.open();
      iframeDocument.write(htmlContent);
      iframeDocument.close();

      // Wait for the iframe to load
      setTimeout(() => {
        try {
          // Print the iframe
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();

          // Show success message
          toast.success("Booking details ready for printing");

          // Clean up
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        } catch (error) {
          console.error("Print error:", error);
          toast.error("Failed to print. Please try again.");
          document.body.removeChild(iframe);
        }
      }, 500);

    } catch (error) {
      console.error("Error opening print window:", error);
      toast.error("Failed to prepare print view. Please try again.");
    }
  };

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

  return (
    <AnimatePresence>
      {bookingId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop - improved to reduce blur effect */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-800 bg-opacity-75" onClick={onClose}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
              style={{ backdropFilter: 'none' }} /* Prevent backdrop blur */
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Details</h3>
                      <button
                        onClick={onClose}
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        <FaTimes className="h-5 w-5" />
                      </button>
                    </div>

                    {loading ? (
                      <div className="flex justify-center items-center h-64">
                        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
                      </div>
                    ) : error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>{error}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : booking ? (
                      <div className="mt-4 grid grid-cols-1 gap-6">
                        {/* Customer Information */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <FaUser className="mr-2 text-gray-500" /> Customer Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Name</p>
                              <p className="text-sm text-gray-900">{booking.customerName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Phone</p>
                              <p className="text-sm text-gray-900">{booking.customerPhone || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Email</p>
                              <p className="text-sm text-gray-900">{booking.customerEmail || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Address</p>
                              <p className="text-sm text-gray-900">{booking.address || "N/A"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                            <FaCalendarAlt className="mr-2 text-gray-500" /> Booking Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Service</p>
                              <p className="text-sm text-gray-900">{booking.service}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Date</p>
                              <p className="text-sm text-gray-900">{formatDate(booking.date)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Time</p>
                              <p className="text-sm text-gray-900">{booking.time || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Booking ID</p>
                              <p className="text-sm text-gray-900">{booking.bookingId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Created At</p>
                              <p className="text-sm text-gray-900">{new Date(booking.createdAt).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Amount</p>
                              <p className="text-sm text-gray-900 flex items-center">
                                <FaRupeeSign className="mr-1 text-xs" />
                                {new Intl.NumberFormat('en-IN', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0
                                }).format(booking.amount)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Information */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Status Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Booking Status</p>
                              <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                                {booking.status.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Payment Status</p>
                              <span className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                {booking.paymentStatus.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Information */}
                        {(booking.notes || booking.serviceDetails) && (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <h4 className="text-md font-medium text-gray-900 mb-3">Additional Information</h4>
                            {booking.notes && (
                              <div className="mb-4">
                                <p className="text-sm font-medium text-gray-500">Customer Notes</p>
                                <p className="text-sm text-gray-900 mt-1">{booking.notes}</p>
                              </div>
                            )}
                            {booking.serviceDetails && (
                              <div>
                                <p className="text-sm font-medium text-gray-500">Service Details</p>
                                <p className="text-sm text-gray-900 mt-1">{booking.serviceDetails}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {booking && !loading && !error && (
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                  <div className="flex flex-wrap gap-2 justify-end">
                    {/* Accept Button (Confirm) */}
                    {booking.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("confirmed")}
                        disabled={processingStatus === "confirmed"}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {processingStatus === "confirmed" ? (
                          <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <FaCheck className="h-4 w-4 mr-2" />
                        )}
                        Accept Booking
                      </button>
                    )}

                    {/* Cancel Button */}
                    {booking.status !== "cancelled" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("cancelled")}
                        disabled={processingStatus === "cancelled"}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        {processingStatus === "cancelled" ? (
                          <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <FaTimes className="h-4 w-4 mr-2" />
                        )}
                        Cancel Booking
                      </button>
                    )}

                    {/* Mark Completed Button */}
                    {(booking.status === "confirmed" || booking.status === "pending") && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange("completed")}
                        disabled={processingStatus === "completed"}
                        className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {processingStatus === "completed" ? (
                          <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <FaCheck className="h-4 w-4 mr-2" />
                        )}
                        Mark Completed
                      </button>
                    )}

                    {/* Print Button */}
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FaPrint className="h-4 w-4 mr-2" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
