'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import MockRazorpayCheckout from './MockRazorpayCheckout';
import DiscountSelector from './DiscountSelector';
import FirstTimeOfferBanner from './FirstTimeOfferBanner';
import useAuth from '@/app/hooks/useAuth';

interface BookingPageProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    price: string;
    features?: string[];
  };
  serviceType: 'ac' | 'washingmachine' | 'service';
  onPaymentSuccess: (paymentId: string, orderId: string) => void;
  userProfile?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

const BookingPage: React.FC<BookingPageProps> = ({
  isOpen,
  onClose,
  service,
  serviceType, // Keep this parameter for future use
  onPaymentSuccess,
  userProfile
}) => {
  const { user, isAdmin } = useAuth();
  const [step, setStep] = useState(1); // 1: Details, 2: Payment
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Extract numeric price from string (e.g., "₹499.1 onwards" -> 499.1)
  // Use parseFloat to preserve decimal values
  const originalPrice = parseFloat(service.price.replace(/[^0-9.]/g, ''));

  // Calculate final price after discount
  // Keep decimal precision for accurate calculations
  const numericPrice = appliedDiscount ? appliedDiscount.discountedPrice : originalPrice;

  // Update form fields when user profile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');

      // Only set address if it exists in the user profile
      if (userProfile.address) {
        setAddress(userProfile.address);
      }
    }
  }, [userProfile]);

  // Set category ID based on service type
  useEffect(() => {
    if (serviceType) {
      // Map service type to category ID
      const categoryMap: Record<string, string> = {
        'ac': 'ac-services',
        'washingmachine': 'washing-machine-services',
        'refrigerator': 'refrigerator-services',
        'microwave': 'microwave-services',
        'tv': 'tv-services',
        'service': 'general-services'
      };

      // Default to general-services if no mapping found
      setCategoryId(categoryMap[serviceType] || 'general-services');
    } else {
      // If no service type is provided, use general-services as fallback
      setCategoryId('general-services');
    }
  }, [serviceType]);

  // Handle discount application
  const handleDiscountApplied = (discount: any) => {
    setAppliedDiscount(discount);
  };

  // Generate available time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      const hourStr = hour > 12 ? (hour - 12) : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      slots.push(`${hourStr}:00 ${ampm}`);
      if (hour < 20) {
        slots.push(`${hourStr}:30 ${ampm}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      // Validate first step
      if (!name || !email || !phone || !address || !date || !time) {
        setError('Please fill in all fields');
        return;
      }

      // Move to payment step
      setStep(2);
      return;
    }

    // Handle payment step
    setLoading(true);
    setError('');

    try {
      console.log('Creating order with price:', numericPrice);

      // Debug log to help troubleshoot amount issues
      if (appliedDiscount) {
        console.log('Discount details:', {
          originalPrice,
          discountType: appliedDiscount.discountType,
          discountValue: appliedDiscount.discountValue,
          discountAmount: appliedDiscount.discountAmount,
          discountedPrice: appliedDiscount.discountedPrice,
          numericPrice
        });
      }

      // Create order on server
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericPrice,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            service: service.title,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            customerAddress: address,
            bookingDate: date,
            bookingTime: time,
            originalPrice: originalPrice,
            discountApplied: appliedDiscount ? true : false,
            discountId: appliedDiscount ? appliedDiscount._id : null,
            discountName: appliedDiscount ? appliedDiscount.name : null,
            discountAmount: appliedDiscount ? appliedDiscount.discountAmount : 0
          }
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing response:', jsonError);
        throw new Error('Invalid response from server');
      }

      console.log('Create order response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || `Failed to create order: ${response.status}`);
      }

      // Store order data and show mock Razorpay checkout
      setOrderData(data.order);
      setShowRazorpay(true);
      setLoading(false);

    } catch (error) {
      console.error('Payment initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paymentId: string, orderId: string, signature: string) => {
    console.log('Payment successful:', { paymentId, orderId, signature });

    // Get the last transaction ID to prevent duplicate submissions
    const lastTransactionId = sessionStorage.getItem('lastTransactionId');

    // Save payment details to database
    savePaymentDetails({
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature,
      transactionId: lastTransactionId, // Add transaction ID to prevent duplicates
      service: service.title,
      amount: numericPrice,
      originalPrice: originalPrice,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: address,
      bookingDate: date,
      bookingTime: time,
      discountApplied: appliedDiscount ? true : false,
      discountId: appliedDiscount ? appliedDiscount._id : null,
      discountName: appliedDiscount ? appliedDiscount.name : null,
      discountAmount: appliedDiscount ? appliedDiscount.discountAmount : 0
    });
  };

  const handlePaymentFailure = (errorMessage: string) => {
    console.error('Payment failed:', errorMessage);
    setError(errorMessage);
    setShowRazorpay(false);
    setLoading(false);
  };

  const savePaymentDetails = async (paymentData: any) => {
    try {
      // Check if we already have a booking with this transaction ID in sessionStorage
      const completedTransactions = sessionStorage.getItem('completedTransactions');
      const completedTransactionsArray = completedTransactions ? JSON.parse(completedTransactions) : [];

      // If this transaction was already completed, don't process it again
      if (paymentData.transactionId && completedTransactionsArray.includes(paymentData.transactionId)) {
        console.log('Transaction already processed, preventing duplicate booking');

        // Show success toast but don't create another booking
        toast.success('Your booking has already been confirmed!');

        // Close modal
        onClose();

        // Reset processing state in the Razorpay component
        setShowRazorpay(false);
        return;
      }

      const response = await fetch('/api/save-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save payment details');
      }

      // Mark this transaction as completed
      if (paymentData.transactionId) {
        completedTransactionsArray.push(paymentData.transactionId);
        sessionStorage.setItem('completedTransactions', JSON.stringify(completedTransactionsArray));
      }

      // Call success callback
      onPaymentSuccess(paymentData.razorpay_payment_id, paymentData.razorpay_order_id);

      // Close modal
      onClose();

      // Reset Razorpay state
      setShowRazorpay(false);

      // Show success toast
      toast.success('Booking confirmed! A confirmation email has been sent to your email address.');

    } catch (error) {
      console.error('Save payment error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save payment details');
      setLoading(false);

      // Reset Razorpay processing state on error
      setShowRazorpay(false);
    }
  };

  // Get tomorrow's date in YYYY-MM-DD format for min date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mock Razorpay Checkout */}
          {showRazorpay && orderData && (
            <MockRazorpayCheckout
              isOpen={showRazorpay}
              onClose={() => setShowRazorpay(false)}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
              amount={orderData.amount}
              currency={orderData.currency}
              orderId={orderData.id}
              name="Dizit Solutions"
              description={`Payment for ${service.title}`}
              customerName={name}
              customerEmail={email}
              customerPhone={phone}
            />
          )}

          {/* Booking Form */}
          {!showRazorpay && (
            <motion.div
              className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="min-h-screen flex flex-col">
                {/* Header */}
                <div className="bg-white shadow-md">
                  <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="text-2xl font-bold text-blue-600">Dizit Solutions</Link>
                    <button
                      onClick={onClose}
                      className="text-gray-600 hover:text-gray-800 focus:outline-none"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow container mx-auto px-4 py-8">
                  <div className="max-w-6xl mx-auto">
                    {/* Progress Steps */}
                    <div className="mb-8">
                      <div className="flex items-center justify-center">
                        <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'}`}>
                            1
                          </div>
                          <span className="ml-2 font-medium">Service Details</span>
                        </div>
                        <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                        <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                          <div className={`rounded-full h-10 w-10 flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-400'}`}>
                            2
                          </div>
                          <span className="ml-2 font-medium">Payment</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
                      <div className="md:flex">
                        {/* Service Info */}
                        <div className="md:w-1/3 bg-blue-900 text-white p-6">
                          <h2 className="text-2xl font-bold mb-4">{service.title}</h2>
                          <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                            <Image
                              src={service.imageUrl}
                              alt={service.title}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="rounded-lg"
                            />
                          </div>
                          <p className="mb-4">{service.description}</p>
                          <div className="text-2xl font-bold text-yellow-400 mb-4">{service.price}</div>

                          {service.features && (
                            <div className="mt-6">
                              <h3 className="font-semibold mb-2">What's Included:</h3>
                              <ul className="space-y-1">
                                {service.features.slice(0, 4).map((feature, index) => (
                                  <li key={index} className="flex items-start text-sm">
                                    <svg className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Form */}
                        <div className="md:w-2/3 p-6">
                          <h2 className="text-2xl font-bold text-gray-800 mb-6">
                            {step === 1 ? 'Enter Booking Details' : 'Review and Pay'}
                          </h2>

                          {error && (
                            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md">
                              <div className="flex items-center">
                                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                              </div>
                            </div>
                          )}

                          <form onSubmit={handleSubmit}>
                            {step === 1 ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-gray-700 font-medium mb-1">Full Name</label>
                                    <input
                                      type="text"
                                      value={name}
                                      onChange={(e) => setName(e.target.value)}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="John Doe"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-700 font-medium mb-1">Phone Number</label>
                                    <input
                                      type="tel"
                                      value={phone}
                                      onChange={(e) => setPhone(e.target.value)}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="9876543210"
                                      required
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-gray-700 font-medium mb-1">Email Address</label>
                                  <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="your@email.com"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-gray-700 font-medium mb-1">
                                    Service Address
                                    {userProfile?.address && (
                                      <span className="ml-2 text-sm text-green-600 font-normal">
                                        (Using address from your profile)
                                      </span>
                                    )}
                                  </label>
                                  <textarea
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Enter your complete address"
                                    required
                                  ></textarea>
                                  <p className="mt-1 text-xs text-gray-500">
                                    You can edit this address for this booking without changing your profile.
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-gray-700 font-medium mb-1">Preferred Date</label>
                                    <input
                                      type="date"
                                      value={date}
                                      onChange={(e) => setDate(e.target.value)}
                                      min={getTomorrowDate()}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-gray-700 font-medium mb-1">Preferred Time</label>
                                    <select
                                      value={time}
                                      onChange={(e) => setTime(e.target.value)}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      required
                                    >
                                      <option value="">Select a time</option>
                                      {timeSlots.map((slot, index) => (
                                        <option key={index} value={slot}>{slot}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* First-Time Offer Banner - Only show for non-admin users */}
                                {!isAdmin && (
                                  <FirstTimeOfferBanner
                                    serviceId={service.id}
                                    originalPrice={originalPrice}
                                    onOfferApplied={handleDiscountApplied}
                                  />
                                )}

                                {/* Discount Selector */}
                                {categoryId && (
                                  <div className="mt-6 border-t border-gray-200 pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Available Offers</h3>
                                    <DiscountSelector
                                      serviceId={service.id}
                                      categoryId={categoryId}
                                      originalPrice={originalPrice}
                                      onDiscountApplied={handleDiscountApplied}
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h3 className="font-semibold text-gray-800 mb-2">Booking Summary</h3>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Service:</span>
                                      <span className="font-medium">{service.title}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Date & Time:</span>
                                      <span className="font-medium">{date}, {time}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Customer:</span>
                                      <span className="font-medium">{name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Contact:</span>
                                      <span className="font-medium">{phone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Email:</span>
                                      <span className="font-medium">{email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Address:</span>
                                      <span className="font-medium">{address}</span>
                                    </div>
                                    {userProfile?.address && userProfile.address !== address && (
                                      <div className="mt-1 text-xs text-gray-500 text-right">
                                        (Different from profile address)
                                      </div>
                                    )}

                                    {/* Price breakdown */}
                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Base Price:</span>
                                        <span className="font-medium">₹{Math.round(originalPrice)}</span>
                                      </div>

                                      {appliedDiscount && (
                                        <div className="flex justify-between text-green-600">
                                          <span>Discount ({appliedDiscount.name}):</span>
                                          <span>-{appliedDiscount.formattedDiscountAmount}</span>
                                        </div>
                                      )}

                                      <div className="flex justify-between text-lg font-bold mt-1">
                                        <span>Total:</span>
                                        <span className="text-blue-600">
                                          ₹{Math.round(numericPrice)}
                                          {appliedDiscount && (
                                            <span className="ml-2 text-sm text-green-600 font-normal">
                                              (Saved {appliedDiscount.formattedDiscountAmount})
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                  <div className="flex items-center text-blue-800">
                                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-medium">Payment will be processed securely via Razorpay</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="mt-8 flex justify-between">
                              {step === 1 ? (
                                <div className="flex justify-end w-full">
                                  <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition-colors font-medium"
                                  >
                                    Continue to Payment
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none transition-colors font-medium"
                                  >
                                    Back
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition-colors font-medium flex items-center"
                                    disabled={loading}
                                  >
                                    {loading ? (
                                      <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                      </>
                                    ) : (
                                      <>
                                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Proceed to Pay {service.price}
                                      </>
                                    )}
                                  </button>
                                </>
                              )}
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default BookingPage;
