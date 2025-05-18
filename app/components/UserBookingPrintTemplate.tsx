"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FaPrint, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaClock } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Booking {
  _id: string;
  id?: string;
  bookingId?: string;
  customerName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  customerEmail?: string;
  phone?: string;
  customerPhone?: string;
  service?: string;
  serviceName?: string;
  date?: string;
  bookingDate?: string;
  time?: string;
  bookingTime?: string;
  address?: string;
  customerAddress?: string;
  status?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  amount: number;
  createdAt: string;
  notes?: any;
  orderId?: string;
}

interface BookingPrintTemplateProps {
  booking: Booking;
  getBookingId: (booking: Booking) => string;
  getServiceName: (booking: Booking) => string;
  getBookingDate: (booking: Booking) => string;
  getBookingTime: (booking: Booking) => string;
  getBookingStatus: (booking: Booking) => string;
  formatDate: (date: string) => string;
  formatAmount: (amount: number) => string;
}

const UserBookingPrintButton: React.FC<{
  booking: Booking;
  getBookingId: (booking: Booking) => string;
  getServiceName: (booking: Booking) => string;
  getBookingDate: (booking: Booking) => string;
  getBookingTime: (booking: Booking) => string;
  getBookingStatus: (booking: Booking) => string;
  formatDate: (date: string) => string;
  formatAmount: (amount: number) => string;
}> = ({
  booking,
  getBookingId,
  getServiceName,
  getBookingDate,
  getBookingTime,
  getBookingStatus,
  formatDate,
  formatAmount
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Ensure component is mounted before attempting to print
  useEffect(() => {
    setIsReady(true);
  }, []);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Booking_${getBookingId(booking) || 'Details'}`,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000); // Increased timeout to ensure content is fully rendered
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
    removeAfterPrint: true, // Clean up print iframe after printing
  });

  const triggerPrint = () => {
    if (!isReady) {
      toast.error("Print component is not ready yet. Please try again.");
      return;
    }

    if (!componentRef.current) {
      console.error("Print component reference is not available");
      toast.error("Print preparation failed. Please try again later.");
      return;
    }

    try {
      // Wrap in setTimeout to ensure it runs after the current event loop
      setTimeout(() => {
        try {
          handlePrint();
        } catch (innerError) {
          console.error("Inner print error:", innerError);

          // Fallback: Open a new window with the content
          try {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write('<html><head><title>Booking Details</title>');
              printWindow.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; }</style>');
              printWindow.document.write('</head><body>');
              printWindow.document.write('<h1>Booking Details</h1>');
              printWindow.document.write(`<p><strong>Booking ID:</strong> ${getBookingId(booking) || 'N/A'}</p>`);
              printWindow.document.write(`<p><strong>Service:</strong> ${getServiceName(booking) || 'N/A'}</p>`);
              printWindow.document.write(`<p><strong>Amount:</strong> ${formatAmount(booking.amount)}</p>`);
              printWindow.document.write(`<p><strong>Date:</strong> ${getBookingDate(booking) ? formatDate(getBookingDate(booking)) : 'Not scheduled'}</p>`);
              printWindow.document.write(`<p><strong>Time:</strong> ${getBookingTime(booking) || 'Not specified'}</p>`);
              printWindow.document.write(`<p><strong>Status:</strong> ${getBookingStatus(booking) || 'N/A'}</p>`);
              printWindow.document.write('</body></html>');
              printWindow.document.close();
              printWindow.print();
              toast.success("Booking details opened in a new window");
            } else {
              toast.error("Could not open print window. Please check your popup blocker settings.");
            }
          } catch (fallbackError) {
            console.error("Fallback print error:", fallbackError);
            toast.error("All print methods failed. Please try again later.");
          }
        }
      }, 100);
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
        {isReady && booking && (
          <div id="print-container">
            <UserBookingPrintTemplate
              ref={componentRef}
              booking={booking}
              getBookingId={getBookingId}
              getServiceName={getServiceName}
              getBookingDate={getBookingDate}
              getBookingTime={getBookingTime}
              getBookingStatus={getBookingStatus}
              formatDate={formatDate}
              formatAmount={formatAmount}
            />
          </div>
        )}
      </div>
    </>
  );
};

const UserBookingPrintTemplate = React.forwardRef<HTMLDivElement, BookingPrintTemplateProps>(
  ({
    booking,
    getBookingId,
    getServiceName,
    getBookingDate,
    getBookingTime,
    getBookingStatus,
    formatDate,
    formatAmount
  }, ref) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case "pending":
          return "#FEF3C7"; // Yellow background
        case "confirmed":
        case "booked":
          return "#DBEAFE"; // Blue background
        case "completed":
        case "paid":
          return "#D1FAE5"; // Green background
        case "cancelled":
        case "failed":
          return "#FEE2E2"; // Red background
        case "rescheduled":
          return "#E9D5FF"; // Purple background
        default:
          return "#F3F4F6"; // Gray background
      }
    };

    const getCustomerName = () => {
      try {
        if (booking?.customerName) return booking.customerName;
        if (booking?.firstName || booking?.lastName) {
          return `${booking.firstName || ''} ${booking.lastName || ''}`.trim();
        }
        return "N/A";
      } catch (error) {
        console.error("Error getting customer name:", error);
        return "N/A";
      }
    };

    const getCustomerEmail = () => {
      try {
        return booking?.customerEmail || booking?.email || booking?.notes?.email || "N/A";
      } catch (error) {
        console.error("Error getting customer email:", error);
        return "N/A";
      }
    };

    const getCustomerPhone = () => {
      try {
        return booking?.customerPhone || booking?.phone || booking?.notes?.phone || "N/A";
      } catch (error) {
        console.error("Error getting customer phone:", error);
        return "N/A";
      }
    };

    const getCustomerAddress = () => {
      try {
        return booking?.address || booking?.customerAddress || booking?.notes?.customerAddress || "N/A";
      } catch (error) {
        console.error("Error getting customer address:", error);
        return "N/A";
      }
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
            <h3 className="text-lg font-semibold">Booking ID: {getBookingId(booking) || 'N/A'}</h3>
            <p className="text-sm text-gray-600">
              Created: {booking?.createdAt ? formatDate(booking.createdAt) : 'N/A'}
            </p>
          </div>
          <div className="flex space-x-2">
            <div
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: getStatusColor(getBookingStatus(booking) || ''),
                color: '#1F2937'
              }}
            >
              Status: {(getBookingStatus(booking) || 'N/A').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="mb-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="font-medium">{getCustomerName()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="flex items-center">
                <FaPhone className="mr-1 text-gray-400" size={12} />
                {getCustomerPhone()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="flex items-center">
                <FaEnvelope className="mr-1 text-gray-400" size={12} />
                {getCustomerEmail()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="flex items-start">
                <FaMapMarkerAlt className="mr-1 text-gray-400 mt-1" size={12} />
                <span>{getCustomerAddress()}</span>
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
              <p className="font-medium">{getServiceName(booking) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Amount</p>
              <p className="font-medium">
                {booking?.amount !== undefined ? formatAmount(booking.amount) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Date</p>
              <p className="flex items-center">
                <FaCalendarAlt className="mr-1 text-gray-400" size={12} />
                {getBookingDate(booking) ? formatDate(getBookingDate(booking)) : 'Not scheduled'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Time</p>
              <p className="flex items-center">
                <FaClock className="mr-1 text-gray-400" size={12} />
                {getBookingTime(booking) || "Not specified"}
              </p>
            </div>
          </div>
        </div>

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

UserBookingPrintTemplate.displayName = 'UserBookingPrintTemplate';

export default UserBookingPrintButton;
