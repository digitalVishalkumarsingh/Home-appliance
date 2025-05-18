'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCreditCard, FaWallet, FaUniversity, FaQrcode, FaLock, FaShieldAlt, FaTimes, FaArrowLeft, FaUser } from 'react-icons/fa';
import { RiBankCardFill } from 'react-icons/ri';

interface MockRazorpayCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: (error: string) => void;
  amount: number;
  currency: string;
  orderId: string;
  name: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const MockRazorpayCheckout: React.FC<MockRazorpayCheckoutProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  amount,
  currency,
  orderId,
  name,
  description,
  customerName,
  customerEmail,
  customerPhone,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  // Format amount for display
  // Razorpay sends amount in paise, so we need to convert it back to rupees for display
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount / 100);

  const paymentMethods = [
    { id: 'card', name: 'Card', icon: <FaCreditCard />, description: 'Credit & Debit Cards' },
    { id: 'upi', name: 'UPI', icon: <FaQrcode />, description: 'Google Pay, PhonePe, BHIM UPI' },
    { id: 'netbanking', name: 'Netbanking', icon: <FaUniversity />, description: 'All Indian banks' },
    { id: 'wallet', name: 'Wallet', icon: <FaWallet />, description: 'Paytm, Amazon Pay & more' },
  ];

  const popularUpiApps = [
    { id: 'gpay', name: 'Google Pay', icon: <FaQrcode />, color: 'bg-blue-50 text-blue-600' },
    { id: 'phonepe', name: 'PhonePe', icon: <FaQrcode />, color: 'bg-purple-50 text-purple-600' },
    { id: 'paytm', name: 'Paytm', icon: <FaQrcode />, color: 'bg-blue-50 text-blue-600' },
    { id: 'bhim', name: 'BHIM', icon: <FaQrcode />, color: 'bg-indigo-50 text-indigo-600' },
  ];

  const banks = [
    { id: 'hdfc', name: 'HDFC Bank', icon: <FaUniversity /> },
    { id: 'sbi', name: 'State Bank of India', icon: <FaUniversity /> },
    { id: 'icici', name: 'ICICI Bank', icon: <FaUniversity /> },
    { id: 'axis', name: 'Axis Bank', icon: <FaUniversity /> },
    { id: 'kotak', name: 'Kotak Mahindra Bank', icon: <FaUniversity /> },
    { id: 'yes', name: 'Yes Bank', icon: <FaUniversity /> },
  ];

  const wallets = [
    { id: 'paytm', name: 'Paytm', icon: <FaWallet /> },
    { id: 'phonepe', name: 'PhonePe', icon: <FaWallet /> },
    { id: 'amazonpay', name: 'Amazon Pay', icon: <FaWallet /> },
    { id: 'mobikwik', name: 'MobiKwik', icon: <FaWallet /> },
  ];

  const handlePayment = () => {
    // Prevent multiple submissions
    if (processing) {
      return;
    }

    setProcessing(true);

    // Generate a unique transaction ID
    const transactionId = `txn_${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Store transaction ID in sessionStorage to prevent duplicate submissions
    sessionStorage.setItem('lastTransactionId', transactionId);

    setTimeout(() => {
      const mockPaymentId = `pay_${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const mockSignature = `${Date.now()}${Math.floor(Math.random() * 1000000)}`;
      const isSuccess = Math.random() < 0.9;

      if (isSuccess) {
        // Add transaction ID to the success callback
        onSuccess(mockPaymentId, orderId, mockSignature);
      } else {
        onFailure('Payment failed. Please try again.');
        // Clear processing state on failure
        setProcessing(false);
      }

      // Note: We don't reset processing state on success
      // This is handled by the parent component after the booking is complete
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white rounded-2xl w-full max-w-lg md:max-w-4xl h-[90vh] md:h-auto overflow-y-auto flex flex-col shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0b4faa] p-4 md:p-6 text-white sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <RiBankCardFill className="h-8 w-8" />
                  <span className="font-bold text-xl tracking-tight">Razorpay</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors focus:outline-none"
                  aria-label="Close"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Merchant Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{name}</h2>
                  <p className="text-gray-600 text-sm md:text-base">{description}</p>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{formattedAmount}</div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow p-6 md:p-8 bg-gray-50">
              {/* Customer Info */}
              <div className="mb-8 p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-3">
                  <FaUser className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-semibold text-gray-800">Customer Information</span>
                </div>
                <div className="text-gray-600 ml-7 text-sm">
                  <p className="mb-1">{customerName} • {customerEmail}</p>
                  <p>{customerPhone}</p>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Select a Payment Method</h2>

                {!selectedMethod ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
                        onClick={() => setSelectedMethod(method.id)}
                      >
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4">
                          {method.icon}
                        </div>
                        <div className="text-left">
                          <span className="font-semibold text-gray-800">{method.name}</span>
                          <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : selectedMethod === 'card' ? (
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center mb-6">
                      <button
                        onClick={() => setSelectedMethod(null)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        aria-label="Back"
                      >
                        <FaArrowLeft className="h-5 w-5" />
                      </button>
                      <h3 className="font-semibold text-lg text-gray-800">Card Payment</h3>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry Date</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                          <input
                            type="text"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="123"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name on Card</label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <button
                        onClick={handlePayment}
                        className="w-full bg-[#0b4faa] text-white py-3 px-4 rounded-lg hover:bg-[#093d8a] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={processing}
                      >
                        {processing ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          `Pay ${formattedAmount}`
                        )}
                      </button>

                      <div className="flex items-center justify-center text-sm text-gray-500 mt-3">
                        <FaLock className="h-4 w-4 text-green-500 mr-1.5" />
                        <span>Your card details are secure and encrypted</span>
                      </div>
                    </div>
                  </div>
                ) : selectedMethod === 'upi' ? (
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center mb-6">
                      <button
                        onClick={() => setSelectedMethod(null)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        aria-label="Back"
                      >
                        <FaArrowLeft className="h-5 w-5" />
                      </button>
                      <h3 className="font-semibold text-lg text-gray-800">UPI Payment</h3>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID</label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="username@upi"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center mb-3">
                          <FaQrcode className="h-5 w-5 text-blue-500 mr-2" />
                          <span className="font-semibold text-gray-800">Popular UPI Apps</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          {popularUpiApps.map((app) => (
                            <button
                              key={app.id}
                              className={`flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 transition-all ${app.color}`}
                              onClick={handlePayment}
                            >
                              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mb-1 shadow-sm">
                                {app.icon}
                              </div>
                              <span className="text-xs font-medium">{app.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handlePayment}
                        className="w-full bg-[#0b4faa] text-white py-3 px-4 rounded-lg hover:bg-[#093d8a] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={processing}
                      >
                        {processing ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          `Pay ${formattedAmount}`
                        )}
                      </button>
                    </div>
                  </div>
                ) : selectedMethod === 'netbanking' ? (
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center mb-6">
                      <button
                        onClick={() => setSelectedMethod(null)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        aria-label="Back"
                      >
                        <FaArrowLeft className="h-5 w-5" />
                      </button>
                      <h3 className="font-semibold text-lg text-gray-800">Net Banking</h3>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {banks.map((bank) => (
                          <button
                            key={bank.id}
                            className={`flex items-center p-4 rounded-lg border transition-all ${
                              selectedBank === bank.id
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedBank(bank.id)}
                          >
                            <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              {bank.icon}
                            </div>
                            <span className="font-medium text-gray-800">{bank.name}</span>
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handlePayment}
                        className="w-full bg-[#0b4faa] text-white py-3 px-4 rounded-lg hover:bg-[#093d8a] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={processing || !selectedBank}
                      >
                        {processing ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          `Pay ${formattedAmount}`
                        )}
                      </button>
                    </div>
                  </div>
                ) : selectedMethod === 'wallet' ? (
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center mb-6">
                      <button
                        onClick={() => setSelectedMethod(null)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        aria-label="Back"
                      >
                        <FaArrowLeft className="h-5 w-5" />
                      </button>
                      <h3 className="font-semibold text-lg text-gray-800">Wallet Payment</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {wallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
                          onClick={handlePayment}
                        >
                          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                            {wallet.icon}
                          </div>
                          <span className="font-medium text-gray-800">{wallet.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0">
              <div className="max-w-4xl mx-auto">
                {!selectedMethod && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                      className="text-gray-600 hover:text-gray-800 font-medium flex items-center"
                      onClick={onClose}
                      disabled={processing}
                    >
                      <FaTimes className="h-5 w-5 mr-1.5" />
                      Cancel Payment
                    </button>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <FaShieldAlt className="h-5 w-5 text-green-500 mr-1.5" />
                        <span className="text-sm text-gray-600">100% Secure</span>
                      </div>
                      <div className="flex items-center">
                        <FaLock className="h-5 w-5 text-blue-500 mr-1.5" />
                        <span className="text-sm text-gray-600">Encrypted</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-gray-500">
                  <span>Powered by</span>
                  <div className="flex items-center">
                    <RiBankCardFill className="h-4 w-4 mr-1.5 text-[#0b4faa]" />
                    <span className="font-bold text-[#0b4faa]">Razorpay</span>
                  </div>
                  <span className="hidden sm:inline mx-2">|</span>
                  <div className="flex items-center">
                    <span>Payment methods:</span>
                    <div className="flex ml-2 space-x-2">
                      <span className="font-medium">Cards</span>
                      <span className="font-medium">UPI</span>
                      <span className="font-medium">NetBanking</span>
                      <span className="font-medium">Wallets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MockRazorpayCheckout;