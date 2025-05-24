"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaSpinner,
  FaRupeeSign,
  FaArrowLeft,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaCreditCard,
  FaUniversity,
  FaWallet,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface PayoutSummary {
  pendingEarnings: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
  minPayoutAmount: number;
  payoutFee: number;
}

interface ApiResponse {
  success: boolean;
  summary?: {
    pendingEarnings?: number;
    lastPayoutDate?: string;
    lastPayoutAmount?: number;
  };
  message?: string;
}

export default function RequestPayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<PayoutSummary>({
    pendingEarnings: 0,
    minPayoutAmount: 500,
    payoutFee: 0,
  });
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "upi" | "wallet">("bank");
  const [accountDetails, setAccountDetails] = useState({
    accountName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    walletProvider: "",
    walletNumber: "",
  });

  // Helper function to safely access localStorage
  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  };

  const getUser = () => {
    if (typeof window !== "undefined") {
      try {
        const userStr = localStorage.getItem("user");
        return userStr ? JSON.parse(userStr) : null;
      } catch {
        return null;
      }
    }
    return null;
  };

  // Fetch with timeout for Vercel serverless environment
  const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  };

  // Fetch payout summary
  const fetchPayoutSummary = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetchWithTimeout(`${API_URL}/api/technicians/earnings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch earnings: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (data.success && data.summary) {
        setSummary({
          pendingEarnings: data.summary.pendingEarnings || 0,
          lastPayoutDate: data.summary.lastPayoutDate,
          lastPayoutAmount: data.summary.lastPayoutAmount,
          minPayoutAmount: 500, // Hardcoded as per original
          payoutFee: 0, // Hardcoded as per original
        });
      } else {
        throw new Error(data.message || "Failed to fetch earnings data");
      }
    } catch (error: any) {
      console.error("Error fetching payout summary:", error);
      toast.error(error.message || "Failed to fetch payout summary. Please try again.");
      setSummary({
        pendingEarnings: 0,
        minPayoutAmount: 500,
        payoutFee: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Authentication check
  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      toast.error("Please login to access this page");
      router.push("/login");
      return;
    }

    if (user.role !== "technician") {
      toast.error("Unauthorized access");
      router.push("/login");
      return;
    }

    fetchPayoutSummary();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAccountDetails(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (summary.pendingEarnings < summary.minPayoutAmount) {
      toast.error(`Minimum payout amount is ₹${summary.minPayoutAmount}`);
      return false;
    }

    if (paymentMethod === "bank") {
      if (!accountDetails.accountName || !accountDetails.accountNumber || !accountDetails.ifscCode || !accountDetails.bankName) {
        toast.error("Please fill in all bank account details");
        return false;
      }
      if (accountDetails.accountNumber.length < 9 || accountDetails.accountNumber.length > 18) {
        toast.error("Please enter a valid account number");
        return false;
      }
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(accountDetails.ifscCode)) {
        toast.error("Please enter a valid IFSC code");
        return false;
      }
    } else if (paymentMethod === "upi") {
      if (!accountDetails.upiId) {
        toast.error("Please enter your UPI ID");
        return false;
      }
      if (!/^[\w.-]+@[\w.-]+$/.test(accountDetails.upiId)) {
        toast.error("Please enter a valid UPI ID");
        return false;
      }
    } else if (paymentMethod === "wallet") {
      if (!accountDetails.walletProvider || !accountDetails.walletNumber) {
        toast.error("Please fill in all wallet details");
        return false;
      }
      if (accountDetails.walletNumber.length < 10) {
        toast.error("Please enter a valid wallet number");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const payoutDetails = {
        paymentMethod,
        accountDetails: {
          ...accountDetails,
          amount: summary.pendingEarnings,
        },
      };
      const response = await fetchWithTimeout(`${API_URL}/api/technicians/earnings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payoutDetails),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit payout request: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      if (data.success) {
        toast.success("Payout request submitted successfully");
        router.push("/technician/earnings");
      } else {
        throw new Error(data.message || "Failed to submit payout request");
      }
    } catch (error: any) {
      console.error("Error submitting payout request:", error);
      toast.error(error.message || "Failed to submit payout request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading payout information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Request Payout</h1>
          <p className="mt-1 text-sm text-gray-500">Withdraw your pending earnings</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/technician/earnings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Back to Earnings
          </Link>
        </div>
      </div>

      {/* Payout Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payout Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-blue-600 font-medium">Available for Payout</div>
            <div className="mt-2 flex items-center">
              <FaRupeeSign className="h-5 w-5 text-blue-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.pendingEarnings)}</span>
            </div>
            {summary.pendingEarnings < summary.minPayoutAmount && (
              <div className="mt-2 text-xs text-red-500 flex items-start">
                <FaExclamationTriangle className="h-3 w-3 mt-0.5 mr-1 flex-shrink-0" />
                <span>Minimum payout amount is {formatCurrency(summary.minPayoutAmount)}</span>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 font-medium">Last Payout</div>
            {summary.lastPayoutDate ? (
              <>
                <div className="mt-2 flex items-center">
                  <FaRupeeSign className="h-5 w-5 text-gray-500 mr-1" />
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(summary.lastPayoutAmount || 0)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500">on {formatDate(summary.lastPayoutDate)}</div>
              </>
            ) : (
              <div className="mt-2 text-sm text-gray-500 italic">No previous payouts</div>
            )}
          </div>
        </div>

        {/* Information Note */}
        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Payouts are processed within 3-5 business days. There is no fee for payouts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod("bank")}
              className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "bank" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <FaUniversity className={`h-6 w-6 mb-2 ${paymentMethod === "bank" ? "text-blue-500" : "text-gray-400"}`} />
              <span className={`text-sm font-medium ${paymentMethod === "bank" ? "text-blue-700" : "text-gray-700"}`}>Bank Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "upi" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <FaMoneyBillWave className={`h-6 w-6 mb-2 ${paymentMethod === "upi" ? "text-blue-500" : "text-gray-400"}`} />
              <span className={`text-sm font-medium ${paymentMethod === "upi" ? "text-blue-700" : "text-gray-700"}`}>UPI</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("wallet")}
              className={`p-4 border rounded-lg flex flex-col items-center ${paymentMethod === "wallet" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}
            >
              <FaWallet className={`h-6 w-6 mb-2 ${paymentMethod === "wallet" ? "text-blue-500" : "text-gray-400"}`} />
              <span className={`text-sm font-medium ${paymentMethod === "wallet" ? "text-blue-700" : "text-gray-700"}`}>Mobile Wallet</span>
            </button>
          </div>
        </div>

        {/* Payment Details Form */}
        <form onSubmit={handleSubmit}>
          {paymentMethod === "bank" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">Account Holder Name</label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  value={accountDetails.accountName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">Bank Name</label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={accountDetails.bankName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={accountDetails.accountNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">IFSC Code</label>
                <input
                  type="text"
                  id="ifscCode"
                  name="ifscCode"
                  value={accountDetails.ifscCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
          )}

          {paymentMethod === "upi" && (
            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700">UPI ID</label>
              <input
                type="text"
                id="upiId"
                name="upiId"
                value={accountDetails.upiId}
                onChange={handleInputChange}
                placeholder="example@upi"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
          )}

          {paymentMethod === "wallet" && (
            <div className="space-y-4">
              <div>
                <label htmlFor="walletProvider" className="block text-sm font-medium text-gray-700">Wallet Provider</label>
                <select
                  id="walletProvider"
                  name="walletProvider"
                  value={accountDetails.walletProvider}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select a wallet provider</option>
                  <option value="Paytm">Paytm</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="Amazon Pay">Amazon Pay</option>
                  <option value="MobiKwik">MobiKwik</option>
                </select>
              </div>

              <div>
                <label htmlFor="walletNumber" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <input
                  type="text"
                  id="walletNumber"
                  name="walletNumber"
                  value={accountDetails.walletNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={submitting || summary.pendingEarnings < summary.minPayoutAmount}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <FaRupeeSign className="mr-2 h-4 w-4" />
                  Request Payout of {formatCurrency(summary.pendingEarnings)}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}