"use client";

import { toast } from "react-hot-toast";

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
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  createdAt: string;
  notes?: { [key: string]: any };
  payment?: any;
}

interface PrintBookingReceiptProps {
  booking: Booking;
}

export default function PrintBookingReceipt({ booking }: PrintBookingReceiptProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "N/A";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FEF3C7";
      case "confirmed":
        return "#D1FAE5";
      case "completed":
        return "#DBEAFE";
      case "cancelled":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-ups blocked. Please allow pop-ups or copy details to clipboard.");
      const textContent = `
        Booking ID: ${booking.bookingId || booking._id}
        Customer: ${booking.customerName}
        Service: ${booking.service}
        Amount: ₹${(booking.amount || 0).toLocaleString("en-IN")}
        Status: ${booking.status.toUpperCase()}
        Payment Status: ${booking.paymentStatus.toUpperCase()}
      `;
      navigator.clipboard.writeText(textContent).then(() => {
        toast.success("Booking details copied to clipboard");
      });
      return;
    }

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
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
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
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">
              Date: ${formatDate(new Date().toISOString())}
            </p>
          </div>
        </div>
        <div class="booking-header">
          <div>
            <div class="booking-id">Booking ID: ${booking.bookingId || booking._id}</div>
            <div class="booking-date">Created: ${booking.createdAt ? formatDate(booking.createdAt) : "N/A"}</div>
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
              <div class="info-value">${booking.customerPhone || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${booking.customerEmail || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Address</div>
              <div class="info-value">${booking.address || booking.customerAddress || "N/A"}</div>
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
              <div class="info-value">
                ${formatDate(booking.date || booking.scheduledDate || booking.serviceDate || booking.bookingDate || "")}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Time</div>
              <div class="info-value">
                ${booking.time || booking.scheduledTime || booking.serviceTime || booking.bookingTime || "N/A"}
              </div>
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
            <div>₹${(booking.amount || 0).toLocaleString("en-IN")}</div>
          </div>
          <div class="amount-row total-row">
            <div>Total Amount</div>
            <div>₹${(booking.amount || 0).toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div class="footer">
          <p>Thank you for choosing Dizit Solution for your home service needs.</p>
          <p>For any queries, please contact us at support@dizitsolution.com or call 9112564731.</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      aria-label="Print booking receipt"
    >
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
      Print
    </button>
  );
}