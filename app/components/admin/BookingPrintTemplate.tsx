"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FaPrint, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Booking {
  _id: string;
  id?: string;
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
  technician?: string;
  completedAt?: string;
  completedBy?: string;
}

interface BookingPrintTemplateProps {
  booking: Booking;
}

const BookingPrintButton: React.FC<{ booking: Booking }> = ({ booking }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Ensure component is mounted before attempting to print
  useEffect(() => {
    setIsReady(true);
  }, []);

  const handlePrint = useReactToPrint({
    // @ts-ignore - content is a valid prop but TypeScript definition might be outdated
    content: () => componentRef.current,
    documentTitle: `Booking_${booking.bookingId || booking._id}`,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500); // Increased timeout to ensure content is ready
      });
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      toast.success("Booking details ready for printing");
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      setIsPrinting(false);
      toast.error("Failed to print booking details. Please try again.");
    },
  });

  const triggerPrint = () => {
    if (!isReady) {
      toast.error("Print component is not ready yet. Please try again.");
      return;
    }

    try {
      handlePrint();
    } catch (error) {
      console.error("Error triggering print:", error);
      toast.error("Failed to generate print preview. Please try again.");
      setIsPrinting(false);
    }
  };

  return (
    <>
      <button
        onClick={triggerPrint}
        className="text-gray-600 hover:text-gray-900"
        title="Print Booking Details"
        disabled={isPrinting}
      >
        {isPrinting ? (
          <span className="inline-block animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></span>
        ) : (
          <FaPrint />
        )}
      </button>
      <div style={{ display: 'none' }}>
        {isReady && <BookingPrintTemplate ref={componentRef} booking={booking} />}
      </div>
    </>
  );
};

const BookingPrintTemplate = React.forwardRef<HTMLDivElement, BookingPrintTemplateProps>(
  ({ booking }, ref) => {
    // We'll use a simpler approach without Image preloading
    // to avoid TypeScript errors and Next.js Image compatibility issues

    const formatDate = (dateString: string) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const formatTime = (dateString: string) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    };

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "pending":
          return "#FEF3C7"; // Yellow background
        case "confirmed":
          return "#DBEAFE"; // Blue background
        case "completed":
          return "#D1FAE5"; // Green background
        case "cancelled":
          return "#FEE2E2"; // Red background
        default:
          return "#F3F4F6"; // Gray background
      }
    };

    const getPaymentStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "paid":
          return "#D1FAE5"; // Green background
        case "pending":
          return "#FEF3C7"; // Yellow background
        case "failed":
          return "#FEE2E2"; // Red background
        default:
          return "#F3F4F6"; // Gray background
      }
    };

    const formatCurrency = (amount: number) => {
      // Ensure amount is a number
      const numAmount = typeof amount === 'number' ? amount : parseFloat(amount as any);

      if (isNaN(numAmount)) {
        return "₹0";
      }

      // Format with Indian Rupee symbol without decimal places
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numAmount);
    };

    return (
      <div ref={ref} className="p-8 bg-white" style={{ width: '210mm', minHeight: '297mm' }}>
        {/* Header with Logo */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="flex items-center">
            <div className="h-16 w-16 mr-4 flex items-center justify-center bg-blue-100 rounded-lg">
              {/* Fallback text in case image fails to load */}
              <div className="text-2xl font-bold text-blue-600">DS</div>
              {/* Image on top with error handling */}
              <img
                src="/Dizit-Solution.webp"
                alt="Dizit Solution Logo"
                className="h-16 mr-4 absolute"
                style={{ objectFit: 'contain' }}
                onError={(e) => {
                  // Hide the image on error
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Dizit Solution</h1>
              <p className="text-sm text-gray-600">Professional Home Services</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">Booking Receipt</h2>
            <p className="text-sm text-gray-600">Date: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        {/* Booking ID and Status */}
        <div className="flex justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Booking ID: {booking.bookingId || booking._id}</h3>
            <p className="text-sm text-gray-600">Created: {formatDate(booking.createdAt)} {formatTime(booking.createdAt)}</p>
          </div>
          <div className="flex space-x-2">
            <div
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: getStatusColor(booking.status), color: '#1F2937' }}
            >
              Status: {booking.status.toUpperCase()}
            </div>
            <div
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: getPaymentStatusColor(booking.paymentStatus), color: '#1F2937' }}
            >
              Payment: {booking.paymentStatus.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="font-medium">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="flex items-center">
                <FaPhone className="mr-1 text-gray-400" size={12} />
                {booking.customerPhone || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="flex items-center">
                <FaEnvelope className="mr-1 text-gray-400" size={12} />
                {booking.customerEmail || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="flex items-start">
                <FaMapMarkerAlt className="mr-1 text-gray-400 mt-1" size={12} />
                <span>{booking.address || "N/A"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Service Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Service</p>
              <p className="font-medium">{booking.service}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount</p>
              <p className="font-medium">
                {formatCurrency(booking.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="flex items-center">
                <FaCalendarAlt className="mr-1 text-gray-400" size={12} />
                {formatDate(booking.date)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Time</p>
              <p className="flex items-center">
                <FaClock className="mr-1 text-gray-400" size={12} />
                {booking.time || "N/A"}
              </p>
            </div>
            {booking.technician && (
              <div>
                <p className="text-sm font-medium text-gray-500">Technician</p>
                <p>{booking.technician}</p>
              </div>
            )}
            {booking.completedAt && (
              <div>
                <p className="text-sm font-medium text-gray-500">Completed At</p>
                <p>{formatDate(booking.completedAt)} {formatTime(booking.completedAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        {(booking.notes || booking.serviceDetails) && (
          <div className="mb-6 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
            {booking.notes && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Customer Notes</p>
                <p className="mt-1">{booking.notes}</p>
              </div>
            )}
            {booking.serviceDetails && (
              <div>
                <p className="text-sm font-medium text-gray-500">Service Details</p>
                <p className="mt-1">{booking.serviceDetails}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-4 border-t text-center">
          <p className="text-sm text-gray-600">Thank you for choosing Dizit Solution for your home service needs.</p>
          <p className="text-sm text-gray-600 mt-1">For any queries, please contact us at: <span className="font-medium">9112564731</span></p>
          <p className="text-sm text-gray-600 mt-1">www.dizitsolution.com</p>
        </div>
      </div>
    );
  }
);

BookingPrintTemplate.displayName = 'BookingPrintTemplate';

export default BookingPrintButton;
