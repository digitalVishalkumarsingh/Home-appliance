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
  FaPrint,
  FaExclamationCircle,
  FaInfoCircle,
  FaClipboardCheck
} from "react-icons/fa";

interface Booking {
  _id: string;
  id?: string;
  bookingId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  service: string;
  date?: string;
  time?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  serviceDate?: string;
  serviceTime?: string;
  bookingDate?: string;
  bookingTime?: string;
  address?: string;
  customerAddress?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed";
  amount: number;
  createdAt: string;
  notes?: {
    customerAddress?: string;
    address?: string;
    date?: string;
    time?: string;
    [key: string]: any;
  };
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

  // Add click outside handler to close the payment status dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPaymentStatusDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.payment-status-dropdown')) {
          setShowPaymentStatusDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPaymentStatusDropdown]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        toast.error('Please log in to view booking details');
        router.push('/admin/login');
        return;
      }

      console.log(`Fetching booking details for ID: ${bookingId}`);

      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch booking details: ${response.status}`);
      }

      const data = await response.json();
      console.log('Booking data received:', data);

      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        throw new Error(data.message || 'Failed to fetch booking details');
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      setError(error.message || 'An error occurred while fetching booking details');
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      setProcessingAction(status);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update booking status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update local booking state
        setBooking(prev => prev ? { ...prev, status } : null);

        // Show success message
        toast.success(`Booking ${status === 'confirmed' ? 'accepted' : status} successfully`);
      } else {
        throw new Error(data.message || 'Failed to update booking status');
      }
    } catch (error: any) {
      console.error(`Error updating booking status:`, error);
      toast.error(error.message || `Failed to update booking status`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePaymentStatusUpdate = async (paymentStatus: string) => {
    try {
      setProcessingAction(`payment-${paymentStatus}`);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log(`Updating payment status to ${paymentStatus} for booking ${bookingId}`);

      // Make sure we're using the correct URL format
      const apiUrl = `/api/admin/bookings/${bookingId}/payment-status`;
      console.log(`API URL: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to update payment status: ${response.status}`);
      }

      // Try to parse the response as JSON, with error handling
      let data;
      try {
        const responseText = await response.text();
        console.log(`Response text: ${responseText}`);
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Error parsing JSON response: ${parseError}`);
        throw new Error(`Invalid response from server: ${parseError.message}`);
      }

      if (data && data.success) {
        // Update local booking state
        setBooking(prev => prev ? { ...prev, paymentStatus } : null);

        // Show success message
        toast.success(`Payment status updated to ${paymentStatus.toUpperCase()} successfully`);

        // Hide the dropdown
        setShowPaymentStatusDropdown(false);
      } else {
        throw new Error((data && data.message) || 'Failed to update payment status');
      }
    } catch (error: any) {
      console.error(`Error updating payment status:`, error);
      toast.error(error.message || `Failed to update payment status`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePrint = () => {
    if (!booking) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print booking details');
      return;
    }

    // Format date for display
    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    // Get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return '#FEF3C7'; // yellow-100
        case 'confirmed': return '#D1FAE5'; // green-100
        case 'completed': return '#DBEAFE'; // blue-100
        case 'cancelled': return '#FEE2E2'; // red-100
        default: return '#F3F4F6'; // gray-100
      }
    };

    // Generate print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Booking Receipt - ${booking.bookingId || booking._id}</title>
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
            border-bottom: 1px solid #e5e7eb;
          }
          .logo-container {
            display: flex;
            align-items: center;
          }
          .logo-fallback {
            width: 60px;
            height: 60px;
            background-color: #4f46e5;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            border-radius: 50%;
            margin-right: 15px;
          }
          .company-name {
            margin: 0;
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
          }
          .company-tagline {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
          }
          .booking-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .booking-id {
            font-weight: bold;
            font-size: 16px;
          }
          .booking-date {
            color: #6b7280;
            font-size: 14px;
          }
          .status-badge {
            padding: 6px 12px;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 14px;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
            color: #4b5563;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: 500;
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 15px;
          }
          .amount-section {
            margin-top: 30px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .total-row {
            font-weight: bold;
            font-size: 18px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed #e5e7eb;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
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
            <div class="booking-id">Booking ID: ${booking.bookingId || booking._id}</div>
            <div class="booking-date">Created: ${booking.createdAt ? formatDate(booking.createdAt) : 'N/A'}</div>
          </div>
          <div>
            <span class="status-badge" style="background-color: ${getStatusColor(booking.status)}; color: #1F2937;">
              Status: ${booking.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">${booking.customerName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${booking.customerPhone || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${booking.customerEmail || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Address</div>
              <div class="info-value">${booking.address || booking.customerAddress || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Service Details</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Service</div>
              <div class="info-value">${booking.service}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${formatDate(booking.date || booking.scheduledDate || booking.serviceDate || booking.bookingDate || '')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Time</div>
              <div class="info-value">${booking.time || booking.scheduledTime || booking.serviceTime || booking.bookingTime || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Payment Status</div>
              <div class="info-value">${booking.paymentStatus.toUpperCase()}</div>
            </div>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-row">
            <div>Service Charge</div>
            <div>₹${(booking.amount || 0).toLocaleString('en-IN')}</div>
          </div>
          <div class="amount-row total-row">
            <div>Total Amount</div>
            <div>₹${(booking.amount || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing Dizit Solution for your home service needs.</p>
          <p>For any queries, please contact us at support@dizitsolution.com or call 9112564731.</p>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window and print
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // Helper functions
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-lg text-gray-600">Loading booking details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <FaExclamationCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Booking</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => fetchBookingDetails()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Try Again
              </button>
              <Link href="/admin/bookings">
                <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Back to Bookings
                </div>
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
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center justify-center h-64">
            <FaInfoCircle className="h-12 w-12 text-blue-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-4">The booking you're looking for could not be found.</p>
            <Link href="/admin/bookings">
              <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Back to Bookings
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main content when booking is loaded
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-4 flex items-center">
          <Link href="/admin/bookings">
            <div className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </div>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-4">Booking Details</h1>
        </div>

        {/* Booking ID and Status */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Booking ID: {booking.bookingId || booking._id}
              </h2>
              <p className="text-sm text-gray-500">
                Created: {formatDate(booking.createdAt)}
              </p>
            </div>
            <div className="mt-2 sm:mt-0 flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                Status: {booking.status.toUpperCase()}
              </span>
              <div className="relative payment-status-dropdown">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(booking.paymentStatus)} cursor-pointer`}
                  onClick={() => setShowPaymentStatusDropdown(!showPaymentStatusDropdown)}
                >
                  Payment: {booking.paymentStatus.toUpperCase()}
                </span>

                {/* Payment Status Dropdown */}
                {showPaymentStatusDropdown && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <button
                        onClick={() => handlePaymentStatusUpdate('pending')}
                        disabled={processingAction !== null || booking.paymentStatus === 'pending'}
                        className={`w-full text-left px-4 py-2 text-sm ${booking.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        role="menuitem"
                      >
                        {processingAction === 'payment-pending' ? 'Updating...' : 'Pending'}
                      </button>
                      <button
                        onClick={() => handlePaymentStatusUpdate('paid')}
                        disabled={processingAction !== null || booking.paymentStatus === 'paid'}
                        className={`w-full text-left px-4 py-2 text-sm ${booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        role="menuitem"
                      >
                        {processingAction === 'payment-paid' ? 'Updating...' : 'Paid'}
                      </button>
                      <button
                        onClick={() => handlePaymentStatusUpdate('failed')}
                        disabled={processingAction !== null || booking.paymentStatus === 'failed'}
                        className={`w-full text-left px-4 py-2 text-sm ${booking.paymentStatus === 'failed' ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        role="menuitem"
                      >
                        {processingAction === 'payment-failed' ? 'Updating...' : 'Failed'}
                      </button>
                      <button
                        onClick={() => handlePaymentStatusUpdate('refunded')}
                        disabled={processingAction !== null || booking.paymentStatus === 'refunded'}
                        className={`w-full text-left px-4 py-2 text-sm ${booking.paymentStatus === 'refunded' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        role="menuitem"
                      >
                        {processingAction === 'payment-refunded' ? 'Updating...' : 'Refunded'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaUser className="mr-2 text-gray-500" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Name</p>
                <p className="text-sm text-gray-900">{booking.customerName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <FaPhone className="mr-1 text-gray-400" />
                  {booking.customerPhone || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <FaEnvelope className="mr-1 text-gray-400" />
                  {booking.customerEmail || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Address</p>
                <p className="text-sm text-gray-900 flex items-start">
                  <FaMapMarkerAlt className="mr-1 mt-1 text-gray-400" />
                  <span>{booking.address || booking.customerAddress || 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FaCalendarAlt className="mr-2 text-gray-500" /> Service Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Service</p>
                <p className="text-sm text-gray-900">{booking.service}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <FaCalendarAlt className="mr-1 text-gray-400" />
                  {formatDate(booking.date || booking.scheduledDate || booking.serviceDate || booking.bookingDate || '')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Time</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <FaClock className="mr-1 text-gray-400" />
                  {formatTime(booking.time || booking.scheduledTime || booking.serviceTime || booking.bookingTime)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="text-sm text-gray-900 flex items-center">
                  <FaRupeeSign className="mr-1 text-gray-400" />
                  {formatAmount(booking.amount || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {booking.payment && (
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaRupeeSign className="mr-2 text-gray-500" /> Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment ID</p>
                  <p className="text-sm text-gray-900">{booking.payment.paymentId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Order ID</p>
                  <p className="text-sm text-gray-900">{booking.payment.orderId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Date</p>
                  <p className="text-sm text-gray-900">{booking.payment.createdAt ? formatDate(booking.payment.createdAt) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Method</p>
                  <p className="text-sm text-gray-900">{booking.payment.method || 'Online'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-4 sm:p-6 bg-gray-50 flex flex-wrap gap-2 justify-end">
            {/* Accept Button */}
            <button
              onClick={() => handleStatusUpdate('confirmed')}
              disabled={!!processingAction || booking.status === 'confirmed' || booking.status === 'completed' || booking.status === 'cancelled'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {processingAction === 'confirmed' ? (
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <FaCheck className="h-4 w-4 mr-2" />
              )}
              Accept
            </button>

            {/* Complete Button */}
            <button
              onClick={() => handleStatusUpdate('completed')}
              disabled={!!processingAction || booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'pending'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {processingAction === 'completed' ? (
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <FaClipboardCheck className="h-4 w-4 mr-2" />
              )}
              Complete
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => handleStatusUpdate('cancelled')}
              disabled={!!processingAction || booking.status === 'cancelled' || booking.status === 'completed'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {processingAction === 'cancelled' ? (
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <FaTimes className="h-4 w-4 mr-2" />
              )}
              Cancel
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaPrint className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
