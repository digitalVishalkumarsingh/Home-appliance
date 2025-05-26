'use client';

// AdminBookingModal - Next.js 15 Compatible
// Handles booking details display and status management for admin users

import { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaSpinner, FaPrint, FaUser, FaCalendarAlt, FaRupeeSign, FaUserCog } from 'react-icons/fa';
import { toast } from '../ui/Toast'; // Fixed import to use local Toast component
import TechnicianAssignmentModal from './TechnicianAssignmentModal';

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
  status: "pending" | "confirmed" | "completed" | "cancelled" | "assigned";
  paymentStatus: "pending" | "paid" | "failed";
  amount: number;
  createdAt: string;
  technician?: string;
  technicianId?: string;
  assignedAt?: string;
  technicianAcceptedAt?: string;
  technicianRejectedAt?: string;
  technicianRejectionReason?: string;
  notes?: {
    customerAddress?: string;
    address?: string;
    date?: string;
    time?: string;
    [key: string]: any;
  };
}

interface AdminBookingModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}

export default function AdminBookingModal({ bookingId, isOpen, onClose, onStatusChange }: AdminBookingModalProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId && bookingId.trim() !== '') {
      fetchBookingDetails();
    }
  }, [isOpen, bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate booking ID
      if (!bookingId || bookingId.trim() === '') {
        setError('Invalid booking ID');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        setLoading(false);
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

      // Debug log to check address field
      if (data.success && data.booking) {
        console.log('Address field check:', {
          address: data.booking.address,
          customerAddress: data.booking.customerAddress,
          addressFromNotes: data.booking.notes?.customerAddress,
          allFields: Object.keys(data.booking)
        });

        // Debug log to check date and time fields
        console.log('Date and Time field check:', {
          date: data.booking.date,
          time: data.booking.time,
          scheduledDate: data.booking.scheduledDate,
          scheduledTime: data.booking.scheduledTime,
          serviceDate: data.booking.serviceDate,
          serviceTime: data.booking.serviceTime,
          bookingDate: data.booking.bookingDate,
          bookingTime: data.booking.bookingTime,
          notesDate: data.booking.notes?.date,
          notesTime: data.booking.notes?.time,
          rawBooking: data.booking
        });
      }

      if (data.success && data.booking) {
        setBooking(data.booking);
      } else {
        throw new Error(data.message || 'Failed to fetch booking details');
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      setError(error.message || 'Failed to fetch booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: Booking['status']) => {
    if (!booking) {
      toast.error('No booking data available');
      return;
    }

    // Validate status transition
    const validStatuses: Booking['status'][] = ['pending', 'confirmed', 'completed', 'cancelled', 'assigned'];
    if (!validStatuses.includes(status)) {
      toast.error('Invalid status provided');
      return;
    }

    try {
      setProcessingAction(status);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      console.log(`Updating booking ${bookingId} status to: ${status}`);

      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        let errorMessage = `Failed to update booking status (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        // Update local booking state with proper type safety
        setBooking(prev => prev ? { ...prev, status } : null);

        // Notify parent component
        onStatusChange(status);

        // Show success message with better messaging
        const statusMessages = {
          confirmed: 'accepted',
          completed: 'marked as completed',
          cancelled: 'cancelled',
          pending: 'set to pending',
          assigned: 'assigned'
        };

        toast.success(`Booking ${statusMessages[status] || status} successfully`);

        console.log(`Booking ${bookingId} status updated to: ${status}`);
      } else {
        throw new Error(data.message || 'Failed to update booking status');
      }
    } catch (error: any) {
      console.error(`Error updating booking status to ${status}:`, error);
      toast.error(error.message || `Failed to update booking status`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handlePrint = () => {
    if (!booking) return;

    try {
      // Create a new window
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Could not open print window. Please check your popup blocker settings.');
        return;
      }

      // Format amount for display
      const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(booking.amount);

      // Format date
      const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      };

      // Create HTML content as a string
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Booking Details - ${booking.bookingId || booking._id}</title>
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
              <div class="booking-id">Booking ID: ${booking.bookingId || booking._id}</div>
              <div class="booking-date">Created: ${formatDate(booking.createdAt)}</div>
            </div>
            <div>
              <span class="status-badge" style="background-color: ${getStatusColor(booking.status)}; color: #1F2937;">
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
                <div class="field-value">${booking.address || booking.customerAddress || booking.notes?.customerAddress || booking.notes?.address || 'N/A'}</div>
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
                <div class="field-value">${formatDateSafely(getBookingDate(booking)) !== 'N/A' ? formatDateSafely(getBookingDate(booking)) : 'Not scheduled'}</div>
              </div>
              <div>
                <div class="field-label">Time</div>
                <div class="field-value">${getBookingTime(booking) || 'Not specified'}</div>
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

      // Write to the document using a safer approach
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Trigger print after a short delay to ensure content is loaded
      setTimeout(() => {
        try {
          printWindow.print();
          toast.success('Booking details ready for printing');
        } catch (error) {
          console.error('Print error:', error);
          toast.error('Failed to print. Please try again.');
        }
      }, 500);

    } catch (error) {
      console.error('Error opening print window:', error);
      toast.error('Failed to prepare print view. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FEF3C7'; // Yellow background
      case 'confirmed':
        return '#DBEAFE'; // Blue background
      case 'completed':
        return '#D1FAE5'; // Green background
      case 'cancelled':
        return '#FEE2E2'; // Red background
      default:
        return '#F3F4F6'; // Gray background
    }
  };

  // Helper function to get booking date from various possible fields - Next.js 15 compatible
  const getBookingDate = (booking: Booking): string | null => {
    const dateFields = [
      booking.date,
      booking.scheduledDate,
      booking.serviceDate,
      booking.bookingDate,
      booking.notes?.date
    ];

    // Return the first non-empty date field
    for (const dateField of dateFields) {
      if (dateField && dateField.trim() !== '') {
        return dateField;
      }
    }

    return null;
  };

  // Helper function to get booking time from various possible fields - Next.js 15 compatible
  const getBookingTime = (booking: Booking): string | null => {
    const timeFields = [
      booking.time,
      booking.scheduledTime,
      booking.serviceTime,
      booking.bookingTime,
      booking.notes?.time
    ];

    // Return the first non-empty time field
    for (const timeField of timeFields) {
      if (timeField && timeField.trim() !== '') {
        return timeField;
      }
    }

    return null;
  };

  // Helper function to safely format dates - Next.js 15 compatible
  const formatDateSafely = (dateString: string | null): string => {
    if (!dateString || dateString.trim() === '') {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Handle technician assignment success
  const handleTechnicianAssignSuccess = () => {
    // Refresh booking details
    fetchBookingDetails();
    // Close technician modal
    setShowTechnicianModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {/* Technician Assignment Modal */}
          {booking && (
            <TechnicianAssignmentModal
              isOpen={showTechnicianModal}
              onClose={() => setShowTechnicianModal(false)}
              bookingId={booking._id.toString()}
              serviceType={booking.service}
              onAssignSuccess={handleTechnicianAssignSuccess}
            />
          )}

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            ) : booking ? (
              <div className="space-y-6">
                {/* Booking ID and Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Booking ID</p>
                    <p className="font-semibold">{booking.bookingId || booking._id}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: getStatusColor(booking.status) }}>
                    Status: {booking.status.toUpperCase()}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FaUser className="mr-2 text-gray-500" /> Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{booking.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{booking.customerPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{booking.customerEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">
                        {booking.address ||
                         booking.customerAddress ||
                         booking.notes?.customerAddress ||
                         booking.notes?.address ||
                         'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-500" /> Service Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Service</p>
                      <p className="font-medium">{booking.service}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium flex items-center">
                        <FaRupeeSign className="h-3 w-3 mr-1" />
                        {new Intl.NumberFormat('en-IN', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(booking.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">
                        {formatDateSafely(getBookingDate(booking)) !== 'N/A' ? formatDateSafely(getBookingDate(booking)) : 'Not scheduled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{getBookingTime(booking) || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Technician Information */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <FaUserCog className="mr-2 text-gray-500" /> Technician Assignment
                    </h3>
                    {!booking.technician && booking.status !== 'cancelled' && (
                      <button
                        onClick={() => setShowTechnicianModal(true)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Assign Technician
                      </button>
                    )}
                  </div>

                  {booking.technician ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Assigned Technician</p>
                        <p className="font-medium">{booking.technician}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Assignment Date</p>
                        <p className="font-medium">
                          {booking.assignedAt ? new Date(booking.assignedAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                      {booking.technicianAcceptedAt && (
                        <div>
                          <p className="text-sm text-gray-500">Accepted Date</p>
                          <p className="font-medium">
                            {new Date(booking.technicianAcceptedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      {booking.technicianRejectedAt && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">Rejected Date</p>
                            <p className="font-medium">
                              {new Date(booking.technicianRejectedAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Rejection Reason</p>
                            <p className="font-medium">{booking.technicianRejectionReason || 'No reason provided'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No technician assigned yet
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">No booking data found</div>
            )}
          </div>

          {/* Footer with Action Buttons */}
          {booking && !loading && !error && (
            <div className="border-t p-4 bg-gray-50 flex flex-wrap gap-2 justify-end">
              {/* Accept Button - Always show for all statuses */}
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
                Accept Booking
              </button>

              {/* Complete Button - Always show for all statuses */}
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={!!processingAction || booking.status === 'completed' || booking.status === 'cancelled'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {processingAction === 'completed' ? (
                  <FaSpinner className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <FaCheck className="h-4 w-4 mr-2" />
                )}
                Mark Completed
              </button>

              {/* Cancel Button - Always show for all statuses */}
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
                Cancel Booking
              </button>

              {/* Print Button - Always show for all statuses */}
              <button
                onClick={handlePrint}
                disabled={!!processingAction}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <FaPrint className="h-4 w-4 mr-2" />
                Print
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

