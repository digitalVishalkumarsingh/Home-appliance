'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import MockRazorpayCheckout from './MockRazorpayCheckout';

interface PaymentModalProps {
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

const PaymentModal: React.FC<PaymentModalProps> = ({
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
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  // Extract numeric price from string (e.g., "₹499.1 onwards" -> 499.1)
  // Use parseFloat to preserve decimal values
  const numericPrice = parseFloat(servicePrice.replace(/[^0-9.]/g, ''));

  useEffect(() => {
    // Load Razorpay script when modal is opened
    if (isOpen) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (loading) {
      return;
    }

    setLoading(true);
    setError('');

    // Generate a unique transaction ID
    const transactionId = `txn_${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Store transaction ID in sessionStorage to prevent duplicate submissions
    sessionStorage.setItem('lastTransactionId', transactionId);

    try {
      console.log('Creating order with price:', numericPrice, 'Transaction ID:', transactionId);

      // Create order on server
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


      // Real Razorpay implementation (commented out for testing)
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Dizit Solutions',
        description: `Payment for ${serviceTitle}`,
        order_id: data.order.id,
        handler: function (response: any) {
          console.log('Payment successful:', response);
          // Save payment details to database
          savePaymentDetails({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            service: serviceTitle,
            amount: numericPrice,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            customerAddress: address
          });
        },
        prefill: {
          name: name,
          email: email,
          contact: phone
        },
        theme: {
          color: '#2563EB'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      // Handle payment object events
      paymentObject.on('payment.failed', function (response: any) {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });


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
      service: serviceTitle,
      amount: numericPrice,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      customerAddress: address
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

        // Reset processing state
        setShowRazorpay(false);
        setLoading(false);
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

      // If this is a duplicate payment detected by the server
      if (data.isDuplicate) {
        console.log('Server detected duplicate payment:', data.payment);
        toast.success('Your booking has already been confirmed!');
        onClose();
        setShowRazorpay(false);
        setLoading(false);
        return;
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
      setLoading(false);

      // Show success toast
      toast.success('Booking confirmed! A confirmation email has been sent to your email address.');

    } catch (error) {
      console.error('Save payment error:', error);
      setError(error instanceof Error ? error.message : 'Failed to save payment details');
      setLoading(false);
      setShowRazorpay(false);
    }
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
              description={`Payment for ${serviceTitle}`}
              customerName={name}
              customerEmail={email}
              customerPhone={phone}
            />
          )}

          {/* Booking Form Modal */}
          {!showRazorpay && (
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
                onClick={(e) => e.stopPropagation()}
              >
            {/* Header with gradient background */}
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

              {/* Service details in header */}
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
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {/* Payment security notice */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center text-gray-600 text-sm">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Secure payment processed by Razorpay</span>
                  </div>
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
                        Proceed to Payment
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;

