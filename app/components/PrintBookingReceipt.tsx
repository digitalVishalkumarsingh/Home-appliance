'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  amount: number;
  createdAt: string;
  notes?: { [key: string]: any };
  payment?: any;
}

interface PrintBookingReceiptProps {
  booking: Booking;
}

export default function PrintBookingReceipt({ booking }: PrintBookingReceiptProps) {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FEF3C7'; // Yellow
      case 'confirmed':
        return '#D1FAE5'; // Green
      case 'completed':
        return '#DBEAFE'; // Blue
      case 'cancelled':
        return '#FEE2E2'; // Red
      default:
        return '#F3F4F6'; // Gray
    }
  };

  const getBookingDate = (booking: Booking) => {
    return (
      booking.date ||
      booking.scheduledDate ||
      booking.serviceDate ||
      booking.bookingDate ||
      booking.notes?.date ||
      ''
    );
  };

  const getBookingTime = (booking: Booking) => {
    return (
      booking.time ||
      booking.scheduledTime ||
      booking.serviceTime ||
      booking.bookingTime ||
      booking.notes?.time ||
      ''
    );
  };

  const getCustomerAddress = () => {
    return booking.address || booking.customerAddress || booking.notes?.customerAddress || 'N/A';
  };

  const handlePrint = () => {
    try {
      setIsPrinting(true);

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const bookingId = booking.bookingId || booking._id;
      const statusColor = getStatusColor(booking.status);
      const bookingStatus = booking.status.toUpperCase();
      const createdDate = formatDate(booking.createdAt);
      const currentDate = formatDate(new Date().toISOString());
      const serviceName = booking.service || booking.notes?.service || 'N/A';
      const bookingAmount = booking.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
      const bookingDate = formatDate(getBookingDate(booking)) || 'Not scheduled';
      const bookingTime = getBookingTime(booking) || 'Not specified';
      const customerName = booking.customerName || 'N/A';
      const customerPhone = booking.customerPhone || booking.notes?.customerPhone || 'N/A';
      const customerEmail = booking.customerEmail || booking.notes?.customerEmail || 'N/A';
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
        Booking ID: ${booking.bookingId || booking._id}
        Customer: ${booking.customerName || 'N/A'}
        Service: ${booking.service || 'N/A'}
        Amount: ${booking.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}
        Status: ${booking.status.toUpperCase()}
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
      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
      aria-label="Print booking receipt"
      disabled={isPrinting}
    >
      {isPrinting ? (
        <span className="inline-block animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full mr-2"></span>
      ) : (
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
          />
        </svg>
      )}
      Print
    </button>
  );
}