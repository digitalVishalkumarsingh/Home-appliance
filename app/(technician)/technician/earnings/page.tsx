"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaSpinner,
  FaRupeeSign,
  FaCalendarAlt,
  FaFilter,
  FaDownload,
  FaArrowLeft,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTechnicianJob, EarningsSummary } from "@/app/contexts/TechnicianJobContext";

interface EarningTransaction {
  _id: string;
  bookingId: string;
  serviceType: string;
  customerName: string;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  serviceDate: string;
  payoutDate?: string;
  transactionId?: string;
  location?: {
    address: string;
    distance: number;
  };
}

interface ApiResponse {
  success: boolean;
  summary?: {
    totalEarnings?: number;
    pendingEarnings?: number;
    paidEarnings?: number;
    lastPayoutDate?: string;
    lastPayoutAmount?: number;
  };
  transactions?: any[];
  message?: string;
}

export default function TechnicianEarnings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { fetchJobEarnings } = useTechnicianJob();
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    lastPayoutDate: undefined,
    lastPayoutAmount: 0,
  });
  const [transactions, setTransactions] = useState<EarningTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<EarningTransaction[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof EarningTransaction>("serviceDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }
      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      // Fetch earnings data from API
      const response = await fetchWithTimeout(`${API_URL}/api/technicians/earnings?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch earnings: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch earnings data");
      }

      // Set summary data
      setSummary({
        totalEarnings: data.summary?.totalEarnings || 0,
        pendingEarnings: data.summary?.pendingEarnings || 0,
        paidEarnings: data.summary?.paidEarnings || 0,
        lastPayoutDate: data.summary?.lastPayoutDate,
        lastPayoutAmount: data.summary?.lastPayoutAmount || 0,
      });

      // Convert transactions data
      const transactionsData: EarningTransaction[] = (data.transactions || []).map((transaction: any) => ({
        _id: transaction._id || `txn-${Math.random().toString(36).slice(2, 11)}`,
        bookingId: transaction.bookingId || "Unknown",
        serviceType: transaction.serviceType || "Service",
        customerName: transaction.customerName || "Customer",
        amount: transaction.amount || 0,
        status: transaction.status || "pending",
        serviceDate: transaction.serviceDate || new Date().toISOString(),
        payoutDate: transaction.payoutDate,
        transactionId: transaction.transactionId,
        location: transaction.location,
      }));

      setTransactions(transactionsData);
    } catch (error: any) {
      console.error("Error fetching earnings data:", error);
      toast.error(error.message || "Failed to fetch earnings data. Please try again.");
      setSummary({
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        lastPayoutDate: undefined,
        lastPayoutAmount: 0,
      });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Authentication check and initial data fetch
  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      toast.error("Please login to access your earnings");
      router.push("/login");
      return;
    }

    if (user.role !== "technician") {
      toast.error("Unauthorized access");
      router.push("/login");
      return;
    }

    fetchEarningsData();
  }, [router]);

  // Refetch data when date filters change
  useEffect(() => {
    if (!loading) {
      fetchEarningsData();
    }
  }, [startDate, endDate]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...transactions];

    // Apply date filter
    if (startDate && endDate) {
      filtered = filtered.filter(transaction => {
        const serviceDate = new Date(transaction.serviceDate);
        return serviceDate >= startDate && serviceDate <= endDate;
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        if (sortField === "serviceDate" || sortField === "payoutDate") {
          const aDate = aValue ? new Date(aValue).getTime() : 0;
          const bDate = bValue ? new Date(bValue).getTime() : 0;
          return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
        }

        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    setFilteredTransactions(filtered);
  }, [transactions, startDate, endDate, statusFilter, searchTerm, sortField, sortDirection]);

  const handleSort = (field: keyof EarningTransaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const exportToCSV = () => {
    try {
      // Create CSV content
      const headers = [
        "Booking ID",
        "Service Type",
        "Customer Name",
        "Amount (₹)",
        "Status",
        "Service Date",
        "Payout Date",
        "Transaction ID",
      ];

      const rows = filteredTransactions.map(transaction => [
        transaction.bookingId,
        transaction.serviceType,
        transaction.customerName,
        transaction.amount.toString(),
        transaction.status,
        new Date(transaction.serviceDate).toLocaleDateString("en-IN"),
        transaction.payoutDate ? new Date(transaction.payoutDate).toLocaleDateString("en-IN") : "",
        transaction.transactionId || "",
      ]);

      const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `earnings-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Earnings data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your earnings data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings History</h1>
          <p className="mt-1 text-sm text-gray-500">Track your service earnings and payouts</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/technician/dashboard"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Earnings Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Earnings Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="text-sm text-blue-600 font-medium">Total Earnings</div>
            <div className="mt-2 flex items-center">
              <FaRupeeSign className="h-5 w-5 text-blue-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalEarnings)}</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
            <div className="text-sm text-amber-600 font-medium">Pending Earnings</div>
            <div className="mt-2 flex items-center">
              <FaRupeeSign className="h-5 w-5 text-amber-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.pendingEarnings)}</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="text-sm text-green-600 font-medium">Paid Earnings</div>
            <div className="mt-2 flex items-center">
              <FaRupeeSign className="h-5 w-5 text-green-500 mr-1" />
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.paidEarnings)}</span>
            </div>
            {summary.lastPayoutDate && (
              <div className="mt-2 text-xs text-gray-500">
                Last payout: {formatCurrency(summary.lastPayoutAmount || 0)} on {formatDate(summary.lastPayoutDate)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4 md:mb-0">Transaction History</h2>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaDownload className="mr-2 -ml-1 h-5 w-5" />
            Export to CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Date Range */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <div className="w-1/2">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholderText="Start Date"
                />
              </div>
              <div className="w-1/2">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate ?? undefined}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholderText="End Date"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "paid" | "cancelled")}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search bookings..."
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("bookingId")}
                  >
                    <div className="flex items-center">
                      Booking ID
                      {sortField === "bookingId" &&
                        (sortDirection === "asc" ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("serviceType")}
                  >
                    <div className="flex items-center">
                      Service
                      {sortField === "serviceType" &&
                        (sortDirection === "asc" ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("customerName")}
                  >
                    <div className="flex items-center">
                      Customer
                      {sortField === "customerName" &&
                        (sortDirection === "asc" ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("amount")}
                  >
                    <div className="flex items-center">
                      Amount
                      {sortField === "amount" &&
                        (sortDirection === "asc" ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Status
                      {sortField === "status" &&
                        (sortDirection === "asc" ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("serviceDate")}
                  >
                    <div className="flex items-center">
                      Service Date
                      {sortField === "serviceDate" &&
                        (sortDirection === "asc" ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />)}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("payoutDate")}
                  >
                    <div className="flex items-center">
                      Payout Date
                      {sortField === "payoutDate" &&
                        (sortDirection === "asc" ? <FaChevronUp className="ml-1 h-3 w-3" /> : <FaChevronDown className="ml-1 h-3 w-3" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map(transaction => (
                  <tr key={transaction._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      <Link href={`/technician/bookings/${transaction.bookingId}`}>{transaction.bookingId}</Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.serviceType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.customerName}
                      {transaction.location && (
                        <div className="text-xs text-gray-400 mt-1 flex items-center">
                          <FaMapMarkerAlt className="h-3 w-3 mr-1" />
                          {transaction.location.distance} km away
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{formatCurrency(transaction.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status === "paid" ? (
                          <FaCheck className="mr-1 h-3 w-3 mt-0.5" />
                        ) : transaction.status === "pending" ? (
                          <FaSpinner className="mr-1 h-3 w-3 mt-0.5" />
                        ) : (
                          <FaTimes className="mr-1 h-3 w-3 mt-0.5" />
                        )}
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.serviceDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(transaction.payoutDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}