'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaMapMarkerAlt, 
  FaRupeeSign, 
  FaSpinner, 
  FaArrowLeft, 
  FaPrint, 
  FaTag,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle
} from 'react-icons/fa';
import BookingManagement from '@/app/components/BookingManagement';
import SimplePrintButton from '@/app/components/SimplePrintButton';

interface Discount {
  _id: string;
  name: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  applicableCategories: string[];
  isActive: boolean;
  startDate: string;
  expiryDate: string;
  usageLimit?: number;
  usageCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface AppliedDiscount {
  _id: string;
  discountId: string;
  bookingId: string;
  orderId: string;
  userId: string;
  discountCode: string;
  discountName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  originalAmount: number;
  discountedAmount: number;
  appliedAt: string;
}

interface Payment {
  _id: string;
  bookingId: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  createdAt: string;
}

interface Booking {
  _id: string;
  bookingId?: string;
  orderId?: string;
  userId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  service: string;
  date: string;
  time?: string;
  address?: string;
  customerAddress?: string;
  status: string;
  paymentStatus: string;
  amount: number;
  createdAt: string;
  notes?: string;
  serviceDetails?: string;
  payment?: Payment;
  appliedDiscount?: AppliedDiscount;
  availableOffers?: Discount[];
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOffers, setShowOffers] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/login?redirect=/bookings/${bookingId}`);
      return;
    }

    fetchBookingDetails();
  }, [bookingId, router]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        router.push(`/login?redirect=/bookings/${bookingId}`);
        return;
      }

      const response = await fetch(`/api/user/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch booking details');
      }

      const data = await response.json();
      if (data.success) {
        setBooking(data.booking);
      } else {
        throw new Error(data.message || 'Failed to fetch booking details');
      }
    } catch (error: any) {
      console.error('Error fetching booking details:', error);
      setError(error.message || 'Failed to load booking details. Please try again later.');
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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

  const getBookingId = (booking: Booking) => {
    return booking.bookingId || booking._id;
  };

  const getOrderId = (booking: Booking) => {
    return booking.orderId || booking.payment?.orderId || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-500 mr-3" />
          <span className="text-lg font-medium text-gray-700">Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <FaTimesCircle className="h-12 w-12" />
          </div>
          <h2 className="text-center text-xl font-bold text-gray-900 mb-2">Error Loading Booking</h2>
          <p className="text-center text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center">
            <Link href="/bookings" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FaArrowLeft className="mr-2" /> Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="flex items-center justify-center text-yellow-500 mb-4">
            <FaInfoCircle className="h-12 w-12" />
          </div>
          <h2 className="text-center text-xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-center text-gray-600 mb-6">The booking you're looking for could not be found.</p>
          <div className="flex justify-center">
            <Link href="/bookings" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <FaArrowLeft className="mr-2" /> Back to Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/bookings" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
          <SimplePrintButton
            booking={booking}
            getBookingId={getBookingId}
            getServiceName={(b) => b.service}
            getBookingDate={(b) => b.date}
            getBookingTime={(b) => b.time || 'Not specified'}
            getBookingStatus={(b) => b.status}
            formatDate={formatDate}
            formatAmount={formatAmount}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white shadow overflow-hidden sm:rounded-lg"
        >
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Booking Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and information about your booking.</p>
            </div>
            <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <span className="mr-2">Booking ID</span>
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{getBookingId(booking)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Service</dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.service}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-400" />
                  Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(booking.date)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaClock className="mr-2 h-4 w-4 text-gray-400" />
                  Time
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.time || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaMapMarkerAlt className="mr-2 h-4 w-4 text-gray-400" />
                  Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{booking.address || booking.customerAddress || 'Not specified'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaRupeeSign className="mr-2 h-4 w-4 text-gray-400" />
                  Amount
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatAmount(booking.amount)}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                <dd className="mt-1 text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    booking.paymentStatus.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </dd>
              </div>

              {/* Applied Discount Section */}
              {booking.appliedDiscount && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FaTag className="mr-2 h-4 w-4 text-gray-400" />
                    Applied Discount
                  </dt>
                  <dd className="mt-1">
                    <div className="bg-green-50 border border-green-100 rounded-md p-3">
                      <div className="flex items-center">
                        <FaCheckCircle className="text-green-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{booking.appliedDiscount.discountName}</p>
                          <p className="text-xs text-green-700">
                            {booking.appliedDiscount.discountType === 'percentage' 
                              ? `${booking.appliedDiscount.discountValue}% off` 
                              : `₹${booking.appliedDiscount.discountValue} off`}
                            {' - '}
                            You saved {formatAmount(booking.appliedDiscount.originalAmount - booking.appliedDiscount.discountedAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </dd>
                </div>
              )}

              {/* Available Offers Section */}
              {booking.availableOffers && booking.availableOffers.length > 0 && !booking.appliedDiscount && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <FaTag className="mr-2 h-4 w-4 text-gray-400" />
                    Available Offers
                  </dt>
                  <dd className="mt-1">
                    <button 
                      onClick={() => setShowOffers(!showOffers)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    >
                      {showOffers ? 'Hide Offers' : `Show ${booking.availableOffers.length} Available Offers`}
                    </button>
                    
                    {showOffers && (
                      <div className="mt-2 space-y-2">
                        {booking.availableOffers.map((offer) => (
                          <div key={offer._id} className="bg-blue-50 border border-blue-100 rounded-md p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <FaTag className="text-blue-500 mr-2" />
                                <div>
                                  <p className="text-sm font-medium text-blue-800">{offer.name}</p>
                                  <p className="text-xs text-blue-700">
                                    {offer.discountType === 'percentage' 
                                      ? `${offer.discountValue}% off` 
                                      : `₹${offer.discountValue} off`}
                                    {offer.minOrderValue ? ` on orders above ₹${offer.minOrderValue}` : ''}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    Use code: <span className="font-medium">{offer.code}</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </dd>
                </div>
              )}

              {/* Notes Section */}
              {booking.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{booking.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Booking Management Section */}
          {booking.status.toLowerCase() !== 'cancelled' && booking.status.toLowerCase() !== 'completed' && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">Manage Your Booking</h4>
              <BookingManagement
                bookingId={getBookingId(booking)}
                orderId={getOrderId(booking)}
                currentDate={booking.date}
                currentTime={booking.time || ''}
                status={booking.status}
                onRescheduleSuccess={() => {
                  toast.success('Your booking has been rescheduled');
                  fetchBookingDetails();
                }}
                onCancelSuccess={() => {
                  toast.success('Your booking has been cancelled');
                  fetchBookingDetails();
                }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
