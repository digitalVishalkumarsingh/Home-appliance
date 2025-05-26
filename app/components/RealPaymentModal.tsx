'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FaCreditCard, FaMoneyBillWave, FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface RealPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle: string;
  servicePrice: string;
  onPaymentSuccess: (paymentId: string, orderId: string) => void;
  userProfile?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RealPaymentModal: React.FC<RealPaymentModalProps> = ({
  isOpen,
  onClose,
  serviceTitle,
  servicePrice,
  onPaymentSuccess,
  userProfile
}) => {
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  // Extract numeric price from string
  const numericPrice = parseFloat(servicePrice.replace(/[^0-9.]/g, ''));

  useEffect(() => {
    // Load Razorpay script when modal is opened
    if (isOpen && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  // Update form fields when user profile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  const validateForm = () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setStep('payment');
  };

  const handlePaymentMethodSelect = async (method: 'cash' | 'online') => {
    setPaymentMethod(method);
    setLoading(true);
    setError('');

    try {
      if (method === 'cash') {
        await handleCashPayment();
      } else {
        await handleOnlinePayment();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment');
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    try {
      const bookingData = {
        service: serviceTitle,
        amount: numericPrice,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        bookingStatus: 'confirmed'
      };

      const response = await fetch('/api/save-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save booking');
      }

      // Show success animation
      setStep('success');
      setLoading(false);

      // Call success callback after animation
      setTimeout(() => {
        onPaymentSuccess('cash_payment', data.bookingId || 'cash_booking');
        toast.success('Booking confirmed! You can pay cash when the technician arrives.');
        onClose();
      }, 3000);

    } catch (error) {
      throw error;
    }
  };

  const handleOnlinePayment = async () => {
    try {
      // Create order with Razorpay
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: numericPrice,
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            service: serviceTitle,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            customerAddress: address
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create order');
      }

      // Real Razorpay implementation
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Dizit Solutions',
        description: `Payment for ${serviceTitle}`,
        order_id: data.order.id,
        handler: function (response: any) {
          console.log('Payment successful:', response);
          handlePaymentSuccess(response);
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: '#2563EB'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setStep('payment');
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      // Handle payment object events
      paymentObject.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
        setStep('payment');
      });

      setLoading(false);

    } catch (error) {
      throw error;
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      setLoading(true);

      // Save payment details to database
      const paymentData = {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        service: serviceTitle,
        amount: numericPrice,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        customerAddress: address,
        paymentMethod: 'online',
        paymentStatus: 'completed'
      };

      const saveResponse = await fetch('/api/save-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData.message || 'Failed to save payment details');
      }

      // Show success animation
      setStep('success');
      setLoading(false);

      // Call success callback after animation
      setTimeout(() => {
        onPaymentSuccess(response.razorpay_payment_id, response.razorpay_order_id);
        toast.success('Payment successful! Booking confirmed.');
        onClose();
      }, 3000);

    } catch (error) {
      console.error('Save payment error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save payment details');
      setLoading(false);
      setStep('payment');
    }
  };

  const resetModal = () => {
    setStep('form');
    setPaymentMethod(null);
    setShowSuccess(false);
    setLoading(false);
    setError('');
  };

  useEffect(() => {
    if (isOpen) {
      resetModal();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Success Animation */}
            {step === 'success' && (
              <div className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="mb-6"
                >
                  <FaCheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-800 mb-4"
                >
                  Booking Confirmed!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-gray-600"
                >
                  {paymentMethod === 'cash'
                    ? 'You can pay cash when the technician arrives.'
                    : 'Payment successful! A confirmation email has been sent.'
                  }
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-6"
                >
                  <FaSpinner className="h-6 w-6 text-blue-500 mx-auto animate-spin" />
                  <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
                </motion.div>
              </div>
            )}

            {/* Payment Method Selection */}
            {step === 'payment' && (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Choose Payment Method</h2>
                    <button
                      onClick={() => setStep('form')}
                      className="text-white/80 hover:text-white focus:outline-none transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                  </div>

                  {/* Service details */}
                  <div className="mt-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white/90">Total Amount:</span>
                      <span className="font-bold text-yellow-300 text-xl">{servicePrice}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Error message */}
                  {error && (
                    <motion.div
                      className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">Error:</span>
                        <span className="ml-1">{error}</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    {/* Online Payment Option */}
                    <motion.button
                      onClick={() => handlePaymentMethodSelect('online')}
                      disabled={loading}
                      className="w-full p-6 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-3 rounded-full mr-4">
                            <FaCreditCard className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-800">Pay Online</h3>
                            <p className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Secure
                          </div>
                        </div>
                      </div>
                    </motion.button>

                    {/* Cash Payment Option */}
                    <motion.button
                      onClick={() => handlePaymentMethodSelect('cash')}
                      disabled={loading}
                      className="w-full p-6 border-2 border-green-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-green-100 p-3 rounded-full mr-4">
                            <FaMoneyBillWave className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-800">Pay with Cash</h3>
                            <p className="text-sm text-gray-600">Pay when technician arrives</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                            On Service
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  </div>

                  {/* Loading State */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 text-center"
                    >
                      <FaSpinner className="h-8 w-8 text-blue-500 mx-auto animate-spin mb-2" />
                      <p className="text-gray-600">
                        {paymentMethod === 'cash' ? 'Confirming your booking...' : 'Initializing payment...'}
                      </p>
                    </motion.div>
                  )}

                  {/* Security Notice */}
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-600 text-sm">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Your data is secure and encrypted. Online payments processed by Razorpay.</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Form Step */}
            {step === 'form' && (
              <>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-t-xl">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Book Your Service</h2>
                    <button
                      onClick={onClose}
                      className="text-white/80 hover:text-white focus:outline-none transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Service details */}
                  <div className="mt-4 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/90">Service:</span>
                      <span className="font-semibold text-white">{serviceTitle}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/90">Price:</span>
                      <span className="font-bold text-yellow-300 text-xl">{servicePrice}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Error message */}
                  {error && (
                    <motion.div
                      className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-md"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">Error:</span>
                        <span className="ml-1">{error}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleFormSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-gray-700 font-medium mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="9876543210"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-gray-700 font-medium mb-1">
                        Service Address
                      </label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your complete address"
                        required
                      ></textarea>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none transition-colors font-medium order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none transition-colors font-medium flex items-center justify-center order-1 sm:order-2 flex-1"
                        disabled={loading}
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RealPaymentModal;
