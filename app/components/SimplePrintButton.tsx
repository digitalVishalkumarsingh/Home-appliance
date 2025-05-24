'use client';

import { useState } from 'react';
import { FaPrint } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface Booking {
  _id: string;
  bookingId?: string;
  orderId?: string;
  service?: string;
  serviceName?: string;
  customerName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  customerEmail?: string;
  email?: string;
  customerPhone?: string;
  phone?: string;
  address?: string;
  customerAddress?: string;
  date?: string;
  scheduledDate?: string;
  serviceDate?: string;
  bookingDate?: string;
  time?: string;
  scheduledTime?: string;
  serviceTime?: string;
  bookingTime?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | string;
  bookingStatus?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | string;
  amount: number;
  createdAt: string;
  notes?: { [key: string]: any };
}

interface SimplePrintButtonProps {
  booking: Booking;
}

export default function SimplePrintButton({ booking }: SimplePrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FEF3C7'; // Yellow
      case 'confirmed':
      case 'booked':
        return '#DBEAFE'; // Blue
      case 'completed':
      case 'paid':
        return '#D1FAE5'; // Green
      case 'cancelled':
      case 'failed':
        return '#FEE2E2'; // Red
      case 'rescheduled':
        return '#E9D5FF'; // Purple
      default:
        return '#F3F4F6'; // Gray
    }
  };

  const getBookingId = () => {
    return booking.bookingId || booking.orderId || booking._id || 'N/A';
  };

  const getServiceName = () => {
    return booking.service || booking.serviceName || booking.notes?.service || 'N/A';
  };

  const getBookingDate = () => {
    return (
      booking.date ||
      booking.scheduledDate ||
      booking.serviceDate ||
      booking.bookingDate ||
      booking.notes?.date ||
      ''
    );
  };

  const getBookingTime = () => {
    return (
      booking.time ||
      booking.scheduledTime ||
      booking.serviceTime ||
      booking.bookingTime ||
      booking.notes?.time ||
      'Not specified'
    );
  };

  const getBookingStatus = () => {
    return booking.status || booking.bookingStatus || 'N/A';
  };

  const getCustomerName = () => {
    try {
      return (
        booking.customerName ||
        booking.name ||
        booking.notes?.customerName ||
        (booking.firstName || booking.lastName
          ? `${booking.firstName || ''} ${booking.lastName || ''}`.trim()
          : 'N/A')
      );
    } catch {
      return 'N/A';
    }
  };

  const getCustomerEmail = () => {
    try {
      return booking.customerEmail || booking.email || booking.notes?.customerEmail || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const getCustomerPhone = () => {
    try {
      return booking.customerPhone || booking.phone || booking.notes?.customerPhone || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const getCustomerAddress = () => {
    try {
      return booking.address || booking.customerAddress || booking.notes?.customerAddress || 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const handlePrint = () => {
    try {
      setIsPrinting(true);

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const bookingId = getBookingId();
      const statusColor = getStatusColor(getBookingStatus());
      const bookingStatus = getBookingStatus().toUpperCase();
      const createdDate = formatDate(booking.createdAt);
      const currentDate = formatDate(new Date().toISOString());
      const serviceName = getServiceName();
      const bookingAmount = formatAmount(booking.amount);
      const bookingDate = formatDate(getBookingDate()) || 'Not scheduled';
      const bookingTime = getBookingTime();
      const customerName = getCustomerName();
      const customerPhone = getCustomerPhone();
      const customerEmail = getCustomerEmail();
      const customerAddress = getCustomerAddress();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Booking Receipt - ${bookingId}</title>
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
              margin: 5px 0 0 0;
              font-size: 14px;
              color: #6b7280;
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
              color: #6b7280;
            }
            .status-badge {
              padding: 6px 12px;
              border-radius: 9999px;
              font-size: 14px;
              font-weight: 500;
            }
            .section {
              margin-bottom: 25px;
              padding: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #4b5563;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .field-label {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 4px;
              font-weight: 500;
            }
            .field-value {
              font-size: 15px;
              font-weight: 500;
            }
            .amount-section {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
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
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 14px;
              color: #6b7280;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
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
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
                Date: ${currentDate}
              </p>
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
                <div class="field-label">Date</div>
                <div class="field-value">${bookingDate}</div>
              </div>
              <div>
                <div class="field-label">Time</div>
                <div class="field-value">${bookingTime}</div>
              </div>
              <div>
                <div class="field-label">Payment Status</div>
                <div class="field-value">${booking.paymentStatus.toUpperCase()}</div>
              </div>
            </div>
          </div>
          <div class="amount-section">
            <div class="amount-row">
              <div>Service Charge</div>
              <div>${bookingAmount}</div>
            </div>
            <div class="amount-row total-row">
              <div>Total Amount</div>
              <div>${bookingAmount}</div>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for choosing Dizit Solution for your home service needs.</p>
            <p>For any queries, please contact us at support@dizitsolution.com or call 9112564731.</p>
            <p>www.dizitsolution.com</p>
          </div>
        </body>
        </html>
      `;

      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDocument) {
        throw new Error('Could not access iframe document');
      }

      iframeDocument.open();
      iframeDocument.write(htmlContent);
      iframeDocument.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          toast.success('Booking details ready for printing');
          setTimeout(() => {
            document.body.removeChild(iframe);
            setIsPrinting(false);
          }, 1000);
        } catch (error) {
          console.error('Print error:', error);
          toast.error('Failed to print. Copying to clipboard instead.');
          const textContent = `
            Booking ID: ${bookingId}
            Customer: ${customerName}
            Service: ${serviceName}
            Amount: ${bookingAmount}
            Status: ${bookingStatus}
            Payment Status: ${booking.paymentStatus.toUpperCase()}
            Date: ${bookingDate}
            Time: ${bookingTime}
            Address: ${customerAddress}
            Email: ${customerEmail}
            Phone: ${customerPhone}
          `;
          navigator.clipboard.writeText(textContent).then(() => {
            toast.success('Booking details copied to clipboard');
          });
          document.body.removeChild(iframe);
          setIsPrinting(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error preparing print view:', error);
      toast.error('Failed to prepare print view. Copying to clipboard instead.');
      const textContent = `
        Booking ID: ${getBookingId()}
        Customer: ${getCustomerName()}
        Service: ${getServiceName()}
        Amount: ${formatAmount(booking.amount)}
        Status: ${getBookingStatus().toUpperCase()}
        Payment Status: ${booking.paymentStatus.toUpperCase()}
      `;
      navigator.clipboard.writeText(textContent).then(() => {
        toast.success('Booking details copied to clipboard');
      });
      setIsPrinting(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      aria-label="Print booking receipt"
      disabled={isPrinting}
    >
      {isPrinting ? (
        <span className="inline-block animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></span>
      ) : (
        <FaPrint className="mr-2 h-4 w-4" />
      )}
      Print
    </button>
  );
}