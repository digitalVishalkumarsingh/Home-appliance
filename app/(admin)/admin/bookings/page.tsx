"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaEye,
  FaCheck,
  FaTimes,
  FaPrint,
} from "react-icons/fa";
import AdminBookingModal from "@/app/components/admin/AdminBookingModal";

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: string;
  time: string;
  address: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid";
  amount: number;
  technician?: string;
}

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState(statusFilter);
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're running on the client side
    if (typeof window === 'undefined') {
      return; // Exit early if we're on the server side
    }

    const fetchBookings = async () => {
      try {
        // Get token from localStorage (only available on client side)
        const token = localStorage.getItem("token");

        if (!token) {
          console.error("No token found in localStorage");
          throw new Error("Authentication token not found");
        }

        // Fetch bookings from the API
        const response = await fetch("/api/admin/bookings", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.bookings)) {
          console.log("Bookings fetched successfully:", data.bookings);
          setBookings(data.bookings);
        } else {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
        // If API fails, use mock data for demonstration
        setBookings([
          {
            id: "BK001",
            customerName: "Rahul Sharma",
            customerPhone: "9876543210",
            service: "AC Repair",
            date: "2023-07-15",
            time: "10:00 AM",
            address: "123 Main St, Varanasi",
            status: "completed",
            paymentStatus: "paid",
            amount: 1200,
            technician: "Amit Kumar",
          },
          {
            id: "BK002",
            customerName: "Priya Patel",
            customerPhone: "8765432109",
            service: "Washing Machine Repair",
            date: "2023-07-16",
            time: "02:30 PM",
            address: "456 Park Ave, Varanasi",
            status: "confirmed",
            paymentStatus: "pending",
            amount: 800,
            technician: "Rajesh Singh",
          },
          {
            id: "BK003",
            customerName: "Amit Singh",
            customerPhone: "7654321098",
            service: "Refrigerator Repair",
            date: "2023-07-17",
            time: "11:15 AM",
            address: "789 Lake View, Varanasi",
            status: "pending",
            paymentStatus: "pending",
            amount: 1500,
          },
          {
            id: "BK004",
            customerName: "Neha Gupta",
            customerPhone: "6543210987",
            service: "Microwave Repair",
            date: "2023-07-18",
            time: "04:00 PM",
            address: "234 River Road, Varanasi",
            status: "cancelled",
            paymentStatus: "pending",
            amount: 600,
          },
          {
            id: "BK005",
            customerName: "Vikram Joshi",
            customerPhone: "5432109876",
            service: "Geyser Repair",
            date: "2023-07-19",
            time: "09:30 AM",
            address: "567 Temple St, Varanasi",
            status: "pending",
            paymentStatus: "pending",
            amount: 700,
          },
          {
            id: "BK006",
            customerName: "Sneha Verma",
            customerPhone: "4321098765",
            service: "AC Repair",
            date: "2023-07-20",
            time: "01:00 PM",
            address: "890 Gandhi Road, Varanasi",
            status: "confirmed",
            paymentStatus: "paid",
            amount: 1100,
            technician: "Amit Kumar",
          },
          {
            id: "BK007",
            customerName: "Rajat Kapoor",
            customerPhone: "3210987654",
            service: "Chimney Repair",
            date: "2023-07-21",
            time: "03:45 PM",
            address: "123 Shivpur, Varanasi",
            status: "pending",
            paymentStatus: "pending",
            amount: 900,
          },
          {
            id: "BK008",
            customerName: "Ananya Mishra",
            customerPhone: "2109876543",
            service: "RO Water Purifier Repair",
            date: "2023-07-22",
            time: "10:30 AM",
            address: "456 Lanka, Varanasi",
            status: "completed",
            paymentStatus: "paid",
            amount: 750,
            technician: "Rajesh Singh",
          },
          {
            id: "BK009",
            customerName: "Karan Malhotra",
            customerPhone: "1098765432",
            service: "Deep Freezer Repair",
            date: "2023-07-23",
            time: "12:15 PM",
            address: "789 Sigra, Varanasi",
            status: "confirmed",
            paymentStatus: "pending",
            amount: 1300,
            technician: "Suresh Yadav",
          },
          {
            id: "BK010",
            customerName: "Pooja Sharma",
            customerPhone: "9087654321",
            service: "Washing Machine Repair",
            date: "2023-07-24",
            time: "05:00 PM",
            address: "234 Cantt, Varanasi",
            status: "pending",
            paymentStatus: "pending",
            amount: 850,
          },
          {
            id: "BK011",
            customerName: "Deepak Agarwal",
            customerPhone: "8976543210",
            service: "AC Repair",
            date: "2023-07-25",
            time: "11:00 AM",
            address: "567 Sarnath, Varanasi",
            status: "pending",
            paymentStatus: "pending",
            amount: 1250,
          },
          {
            id: "BK012",
            customerName: "Meera Jain",
            customerPhone: "7865432109",
            service: "Refrigerator Repair",
            date: "2023-07-26",
            time: "02:00 PM",
            address: "890 Assi, Varanasi",
            status: "confirmed",
            paymentStatus: "paid",
            amount: 1400,
            technician: "Amit Kumar",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...bookings];

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((booking) => booking.status === selectedStatus);
    }

    // Filter by date range
    if (selectedDateRange !== "all") {
      const today = new Date();
      const startDate = new Date();

      if (selectedDateRange === "today") {
        // No adjustment needed for today
      } else if (selectedDateRange === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (selectedDateRange === "month") {
        startDate.setMonth(today.getMonth() - 1);
      }

      filtered = filtered.filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= startDate && bookingDate <= today;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.id.toLowerCase().includes(term) ||
          booking.customerName.toLowerCase().includes(term) ||
          booking.customerPhone.includes(term) ||
          booking.service.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [bookings, selectedStatus, selectedDateRange, searchTerm]);

  // Get current bookings for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };



  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found in localStorage");
        throw new Error("Authentication token not found");
      }

      // Call the API to update booking status
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update booking status");
      }

      const data = await response.json();
      console.log("Status updated successfully:", data);

      // Show success message
      alert(`Booking status updated to ${newStatus}`);

      // Update the booking status in the state
      setBookings(
        bookings.map((booking) =>
          booking.id === id
            ? { ...booking, status: newStatus as any }
            : booking
        )
      );
    } catch (error: any) {
      console.error("Error updating booking status:", error);
      alert(error.message || "Failed to update booking status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all service bookings
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center">
              <FaFilter className="mr-2 text-gray-500" />
              <label htmlFor="status" className="text-sm font-medium text-gray-700 mr-2">
                Status:
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2 text-gray-500" />
              <label htmlFor="dateRange" className="text-sm font-medium text-gray-700 mr-2">
                Date:
              </label>
              <select
                id="dateRange"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Booking ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Customer
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date & Time
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Payment
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentBookings.length > 0 ? (
                currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {booking.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customerPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {booking.service}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{booking.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(
                          booking.paymentStatus
                        )}`}
                      >
                        {booking.paymentStatus.charAt(0).toUpperCase() +
                          booking.paymentStatus.slice(1)}
                      </span>
                      <div className="text-sm text-gray-500">
                        ₹{booking.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* View Button */}
                        <Link href={`/admin/bookings/${booking.id}`}>
                          <div
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100 cursor-pointer"
                            title="View Details"
                          >
                            <FaEye />
                          </div>
                        </Link>

                        {/* Accept Button - Show for pending bookings */}
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handleStatusChange(booking.id, "confirmed")}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-100"
                            title="Accept Booking"
                          >
                            <FaCheck />
                          </button>
                        )}

                        {/* Cancel Button - Show for pending and confirmed bookings */}
                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <button
                            onClick={() => handleStatusChange(booking.id, "cancelled")}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100"
                            title="Cancel Booking"
                          >
                            <FaTimes />
                          </button>
                        )}

                        {/* Print Button */}
                        <button
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100"
                          title="Print Booking"
                        >
                          <FaPrint />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredBookings.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{filteredBookings.length}</span>{" "}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      <AdminBookingModal
        bookingId={selectedBookingId || ''}
        isOpen={!!selectedBookingId}
        onClose={() => {
          setSelectedBookingId(null);
          // No need to refresh, the state is already updated
        }}
        onStatusChange={(status) => {
          // Handle status change
          if (selectedBookingId) {
            handleStatusChange(selectedBookingId, status as any);
          }
          // No need to refresh, the state is already updated in handleStatusChange
        }}
      />
    </div>
  );
}
