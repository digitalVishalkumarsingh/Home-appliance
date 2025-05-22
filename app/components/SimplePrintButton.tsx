"use client";

import React, { useState } from 'react';
import { FaPrint } from 'react-icons/fa';
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

interface SimplePrintButtonProps {
  booking: Booking;
  getBookingId: (booking: Booking) => string;
  getServiceName: (booking: Booking) => string;
  getBookingDate: (booking: Booking) => string;
  getBookingTime: (booking: Booking) => string;
  getBookingStatus: (booking: Booking) => string;
  formatDate: (date: string) => string;
  formatAmount: (amount: number) => string;
}

const SimplePrintButton: React.FC<SimplePrintButtonProps> = ({
  booking,
  getBookingId,
  getServiceName,
  getBookingDate,
  getBookingTime,
  getBookingStatus,
  formatDate,
  formatAmount
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const getStatusColor = (status: string | undefined) => {
    switch ((status || '').toLowerCase()) {
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
    } catch (_) {
      return "N/A";
    }
  };

  const getCustomerEmail = () => {
    try {
      return booking?.customerEmail || booking?.email || booking?.notes?.email || "N/A";
    } catch (_) {
      return "N/A";
    }
  };

  const getCustomerPhone = () => {
    try {
      return booking?.customerPhone || booking?.phone || booking?.notes?.phone || "N/A";
    } catch (_) {
      return "N/A";
    }
  };

  const getCustomerAddress = () => {
    try {
      return booking?.address || booking?.customerAddress || booking?.notes?.customerAddress || "N/A";
    } catch (_) {
      return "N/A";
    }
  };

  const handlePrint = () => {
    try {
      setIsPrinting(true);

      // Create a print iframe instead of a new window
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Get the booking ID for the title
      const bookingId = getBookingId(booking) || 'N/A';
      const statusColor = getStatusColor(getBookingStatus(booking) || '');
      const bookingStatus = (getBookingStatus(booking) || 'N/A').toUpperCase();
      const createdDate = booking?.createdAt ? formatDate(booking.createdAt) : 'N/A';
      const currentDate = formatDate(new Date().toISOString());
      const serviceName = getServiceName(booking) || 'N/A';
      const bookingAmount = booking?.amount !== undefined ? formatAmount(booking.amount) : 'N/A';
      const bookingDate = getBookingDate(booking) ? formatDate(getBookingDate(booking)) : 'Not scheduled';
      const bookingTime = getBookingTime(booking) || 'Not specified';
      const customerName = getCustomerName();
      const customerPhone = getCustomerPhone();
      const customerEmail = getCustomerEmail();
      const customerAddress = getCustomerAddress();

      // Create HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Booking Details - ${bookingId}</title>
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
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Date: ${currentDate}</p>
            </div>
          </div>

          <div class="booking-header">
            <div>
              <div class="booking-id">Booking ID: ${bookingId}</div>
              <div class="booking-date">Created: ${createdDate}</div>
            </div>
            <div>
              <span class="status-badge" style="background-color: ${statusColor}; color: #1F2937;">
                Status: ${bookingStatus}
              </span>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Customer Information</h3>
            <div class="grid">
              <div>
                <div class="field-label">Name</div>
                <div class="field-value">${customerName}</div>
              </div>
              <div>
                <div class="field-label">Phone</div>
                <div class="field-value">${customerPhone}</div>
              </div>
              <div>
                <div class="field-label">Email</div>
                <div class="field-value">${customerEmail}</div>
              </div>
              <div>
                <div class="field-label">Address</div>
                <div class="field-value">${customerAddress}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h3 class="section-title">Service Details</h3>
            <div class="grid">
              <div>
                <div class="field-label">Service</div>
                <div class="field-value">${serviceName}</div>
              </div>
              <div>
                <div class="field-label">Amount</div>
                <div class="field-value">${bookingAmount}</div>
              </div>
              <div>
                <div class="field-label">Date</div>
                <div class="field-value">${bookingDate}</div>
              </div>
              <div>
                <div class="field-label">Time</div>
                <div class="field-value">${bookingTime}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Dizit Solution for your home service needs.</p>
            <p>For any queries, please contact us at: <strong>9112564731</strong></p>
            <p>www.dizitsolution.com</p>
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
            setIsPrinting(false);
          }, 1000);
        } catch (error) {
          console.error("Print error:", error);
          toast.error("Failed to print. Please try again.");
          document.body.removeChild(iframe);
          setIsPrinting(false);
        }
      }, 500);
    } catch (error) {
      console.error("Error preparing print view:", error);
      toast.error("Failed to prepare print view. Please try again.");
      setIsPrinting(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
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
  );
};

export default SimplePrintButton;
