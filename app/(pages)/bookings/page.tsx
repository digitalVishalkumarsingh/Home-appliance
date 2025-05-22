'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaRupeeSign, FaSpinner, FaSearch, FaEye, FaPrint } from 'react-icons/fa';
import BookingManagement from '@/app/components/BookingManagement';
import SimplePrintButton from '@/app/components/SimplePrintButton';

interface Booking {
  _id: string;
  bookingId?: string;
  orderId?: string;
  service: string;
  serviceName?: string;
  customerName?: string;
  name?: string;
  customerEmail?: string;
  email?: string;
  customerPhone?: string;
  phone?: string;
  address?: string;
  customerAddress?: string;
  date?: string;
  bookingDate?: string;
  time?: string;
  bookingTime?: string;
  status: string;
  bookingStatus?: string;
  paymentStatus: string;
  amount: number;
  createdAt: string;
  notes?: {
    service?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    bookingDate?: string;
    bookingTime?: string;
  };
}

export default function UserBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Define fetchBookings without useCallback to avoid circular dependencies
  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Safely access localStorage only in browser environment
      if (typeof window === 'undefined') {
        return; // Exit early if running on server
      }

      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login?redirect=/bookings');
        return;
      }

      const response = await fetch('/api/user/bookings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load your bookings. Please try again later.');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch bookings on component mount
  useEffect(() => {
    // Safely access localStorage only in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login?redirect=/bookings');
        return;
      }

      fetchBookings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const getServiceName = (booking: Booking) => {
    return booking.service || booking.serviceName || booking.notes?.service || 'Service';
  };

  const getBookingStatus = (booking: Booking) => {
    return booking.bookingStatus || booking.status || 'pending';
  };

  const getBookingDate = (booking: Booking) => {
    return booking.date || booking.bookingDate || booking.notes?.bookingDate;
  };

  const getBookingTime = (booking: Booking) => {
    return booking.time || booking.bookingTime || booking.notes?.bookingTime;
  };

  const getBookingId = (booking: Booking) => {
    return booking.bookingId || booking._id;
  };

  const getOrderId = (booking: Booking) => {
    return booking.orderId || '';
  };

  const filteredBookings = bookings
    .filter((booking) => {
      // Apply status filter
      if (filterStatus !== 'all') {
        const bookingStatus = getBookingStatus(booking).toLowerCase();
        if (bookingStatus !== filterStatus) {
          return false;
        }
      }

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const serviceName = getServiceName(booking).toLowerCase();
        const bookingId = getBookingId(booking).toLowerCase();

        return (
          serviceName.includes(searchLower) ||
          bookingId.includes(searchLower)
        );
      }

      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading your bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={fetchBookings}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
          <p className="text-gray-600 mt-1">View and manage all your service bookings</p>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <label htmlFor="status-filter" className="mr-2 text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                id="status-filter"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="p-8 text-center">
            <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't made any bookings yet.</p>
            <div className="mt-6">
              <Link
                href="/#services"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book a Service
              </Link>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-8 text-center">
            <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matching bookings</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getBookingId(booking).substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getServiceName(booking)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getBookingDate(booking) ? (
                        <div>
                          <div className="flex items-center">
                            <FaCalendarAlt className="mr-1 text-gray-400" />
                            {formatDate(getBookingDate(booking))}
                          </div>
                          {getBookingTime(booking) && (
                            <div className="flex items-center mt-1">
                              <FaClock className="mr-1 text-gray-400" />
                              {getBookingTime(booking)}
                            </div>
                          )}
                        </div>
                      ) : (
                        'Not scheduled'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getBookingStatus(booking))}`}>
                        {getBookingStatus(booking)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAmount(booking.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <SimplePrintButton
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && showBookingDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">Booking Details</h2>
              <div className="flex items-center space-x-4">
                {selectedBooking && (
                  <SimplePrintButton
                    booking={selectedBooking}
                    getBookingId={getBookingId}
                    getServiceName={getServiceName}
                    getBookingDate={getBookingDate}
                    getBookingTime={getBookingTime}
                    getBookingStatus={getBookingStatus}
                    formatDate={formatDate}
                    formatAmount={formatAmount}
                  />
                )}
                <button
                  onClick={() => setShowBookingDetails(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Booking ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{getBookingId(selectedBooking)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Service</h3>
                  <p className="mt-1 text-sm text-gray-900">{getServiceName(selectedBooking)}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {getBookingDate(selectedBooking) ? formatDate(getBookingDate(selectedBooking)) : 'Not scheduled'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Time</h3>
                    <p className="mt-1 text-sm text-gray-900">{getBookingTime(selectedBooking) || 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(getBookingStatus(selectedBooking))}`}>
                      {getBookingStatus(selectedBooking)}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatAmount(selectedBooking.amount)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.address ||
                     selectedBooking.customerAddress ||
                     selectedBooking.notes?.customerAddress ||
                     'No address provided'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Booked On</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedBooking.createdAt)}</p>
                </div>

                {/* Booking Management */}
                {getBookingId(selectedBooking) && getOrderId(selectedBooking) && (
                  <div className="pt-4 border-t border-gray-200">
                    <BookingManagement
                      bookingId={getBookingId(selectedBooking)}
                      orderId={getOrderId(selectedBooking)}
                      currentDate={getBookingDate(selectedBooking)}
                      currentTime={getBookingTime(selectedBooking)}
                      status={getBookingStatus(selectedBooking)}
                      onRescheduleSuccess={() => {
                        toast.success('Your booking has been rescheduled');
                        setShowBookingDetails(false);
                        fetchBookings();
                      }}
                      onCancelSuccess={() => {
                        toast.success('Your booking has been cancelled');
                        setShowBookingDetails(false);
                        fetchBookings();
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
