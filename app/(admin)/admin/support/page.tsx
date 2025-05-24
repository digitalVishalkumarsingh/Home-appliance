"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHeadset,
  FaSpinner,
  FaExclamationCircle,
  FaFilter,
  FaReply,
  FaCheck,
  FaTimes,
  FaClock,
  FaEnvelope,
  FaUser,
  FaCalendarAlt,
  FaSearch,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import useAuth from "@/app/hooks/useAuth";
import debounce from "lodash/debounce";

interface SupportTicket {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  responses: {
    message: string;
    respondedBy: string;
    respondedByName: string;
    isAdmin: boolean;
    respondedAt: string;
  }[];
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminSupportPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [adminResponse, setAdminResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoadingTickets(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      let url = `${baseUrl}/admin/support/tickets?page=${pagination.page}&limit=${pagination.limit}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch support tickets");
      }

      const data = await response.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 });
      } else {
        throw new Error(data.message || "Failed to fetch support tickets");
      }
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      const message = error instanceof Error ? error.message : "Failed to load support tickets";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [pagination.page, statusFilter, searchTerm]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        toast.error("Please log in to access admin panel");
        router.push("/login");
        return;
      }

      if (user?.role !== "admin") {
        toast.error("Admin access required");
        router.push("/");
        return;
      }

      fetchTickets();
    }
  }, [isAuthenticated, isLoading, user, router, fetchTickets]);

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300),
    []
  );

  const handleViewTicket = useCallback((ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDetails(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowTicketDetails(false);
    setAdminResponse("");
  }, []);

  const handleSubmitResponse = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!adminResponse.trim() || !selectedTicket) {
        toast.error("Response message is required");
        return;
      }

      try {
        setIsSubmitting(true);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const response = await fetch(`${baseUrl}/admin/support/tickets`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticketId: selectedTicket._id,
            adminResponse: adminResponse.trim(),
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to submit response");
        }

        const data = await response.json();
        if (data.success) {
          toast.success("Response submitted successfully");
          setAdminResponse("");
          setSelectedTicket(data.ticket);
          fetchTickets();
        } else {
          throw new Error(data.message || "Failed to submit response");
        }
      } catch (error) {
        console.error("Error submitting response:", error);
        const message = error instanceof Error ? error.message : "Failed to submit response";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [adminResponse, selectedTicket, fetchTickets]
  );

  const handleUpdateStatus = useCallback(
    async (status: SupportTicket["status"]) => {
      if (!selectedTicket) return;

      try {
        setIsSubmitting(true);

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const response = await fetch(`${baseUrl}/admin/support/tickets`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticketId: selectedTicket._id,
            status,
          }),
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update ticket status");
        }

        const data = await response.json();
        if (data.success) {
          toast.success(`Ticket marked as ${status}`);
          setSelectedTicket(data.ticket);
          fetchTickets();
        } else {
          throw new Error(data.message || "Failed to update ticket status");
        }
      } catch (error) {
        console.error("Error updating ticket status:", error);
        const message = error instanceof Error ? error.message : "Failed to update ticket status";
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedTicket, fetchTickets]
  );

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "open":
        return <FaHeadset className="mr-1" aria-hidden="true" />;
      case "in-progress":
        return <FaClock className="mr-1" aria-hidden="true" />;
      case "resolved":
        return <FaCheck className="mr-1" aria-hidden="true" />;
      case "closed":
        return <FaTimes className="mr-1" aria-hidden="true" />;
      default:
        return null;
    }
  }, []);

  const filteredTickets = useMemo(() => {
    if (!searchTerm) return tickets;
    return tickets.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  if (isLoading || isLoadingTickets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 text-4xl mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Ticket Management</h1>
        <p className="text-gray-600">Manage and respond to customer support tickets</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center">
            <FaFilter className="text-gray-400 mr-2" aria-hidden="true" />
            <label htmlFor="statusFilter" className="sr-only">Filter by status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              aria-label="Filter tickets by status"
            >
              <option value="all">All Tickets</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="relative flex-grow max-w-md">
            <label htmlFor="search" className="sr-only">Search tickets</label>
            <input
              id="search"
              type="text"
              placeholder="Search tickets..."
              onChange={(e) => debouncedSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              aria-label="Search support tickets"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <FaExclamationCircle className="text-red-500 text-3xl mx-auto mb-2" aria-hidden="true" />
          <p className="text-red-700" role="alert">{error}</p>
          <button
            onClick={fetchTickets}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-label="Retry loading tickets"
          >
            Try Again
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FaHeadset className="text-gray-400 text-4xl mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No support tickets found</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter !== "all"
              ? `There are no tickets with status "${statusFilter}"`
              : searchTerm
              ? "No tickets match your search"
              : "There are no support tickets in the system yet"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-label="Clear search"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Support tickets table">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Ticket ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Subject
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
                    Date
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <motion.tr
                    key={ticket._id}
                    className="hover:bg-gray-50 focus-within:ring-2 focus-within:ring-indigo-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    tabIndex={0}
                    role="row"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleViewTicket(ticket);
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ticket._id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                      {ticket.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>{ticket.userName}</span>
                        <span className="text-xs text-gray-400">{ticket.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          ticket.status
                        )}`}
                        aria-label={`Status: ${ticket.status}`}
                      >
                        {getStatusIcon(ticket.status)}
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewTicket(ticket)}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        aria-label={`View details for ticket ${ticket._id}`}
                      >
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      aria-label="Previous page"
                    >
                      <span className="sr-only">Previous</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPagination((prev) => ({ ...prev, page: i + 1 }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === i + 1
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        aria-label={`Page ${i + 1}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, prev.totalPages) }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      aria-label="Next page"
                    >
                      <span className="sr-only">Next</span>
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {selectedTicket && showTicketDetails && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-labelledby="ticket-details-title"
            aria-modal="true"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleCloseModal();
              }
            }}
            tabIndex={-1}
            ref={(node) => {
              if (node) node.focus();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h2 id="ticket-details-title" className="text-lg font-medium text-gray-900">
                  Ticket Details
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  aria-label="Close ticket details"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="col-span-2">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{selectedTicket.subject}</h3>
                      <span
                        className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          selectedTicket.status
                        )}`}
                        aria-label={`Status: ${selectedTicket.status}`}
                      >
                        {getStatusIcon(selectedTicket.status)}
                        {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1).replace("-", " ")}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Customer Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <FaUser className="text-gray-400 mt-1 mr-2" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{selectedTicket.userName}</p>
                          <p className="text-xs text-gray-500">Customer</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <FaEnvelope className="text-gray-400 mt-1 mr-2" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{selectedTicket.userEmail}</p>
                          <p className="text-xs text-gray-500">Email</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <FaCalendarAlt className="text-gray-400 mt-1 mr-2" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{formatDate(selectedTicket.createdAt)}</p>
                          <p className="text-xs text-gray-500">Submitted on</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Actions</h3>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleUpdateStatus("in-progress")}
                          disabled={selectedTicket.status === "in-progress" || isSubmitting}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Mark ticket as in progress"
                        >
                          <FaClock className="mr-2" aria-hidden="true" /> Mark as In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("resolved")}
                          disabled={selectedTicket.status === "resolved" || isSubmitting}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Mark ticket as resolved"
                        >
                          <FaCheck className="mr-2" aria-hidden="true" /> Mark as Resolved
                        </button>
                        <button
                          onClick={() => handleUpdateStatus("closed")}
                          disabled={selectedTicket.status === "closed" || isSubmitting}
                          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Close ticket"
                        >
                          <FaTimes className="mr-2" aria-hidden="true" /> Close Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversation History */}
                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation History</h3>
                    <div className="space-y-4">
                      {selectedTicket.responses.map((response, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${response.isAdmin ? "bg-blue-50 ml-8" : "bg-gray-50 mr-8"}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <div
                                className={`w-8 h-8 rounded-full ${
                                  response.isAdmin ? "bg-blue-500" : "bg-gray-500"
                                } text-white flex items-center justify-center mr-2`}
                                aria-hidden="true"
                              >
                                {response.isAdmin ? "A" : "U"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {response.isAdmin ? response.respondedByName || "Admin" : selectedTicket.userName}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(response.respondedAt)}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Response Form */}
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Respond to Ticket</h3>
                  <form onSubmit={handleSubmitResponse}>
                    <div className="mb-4">
                      <label htmlFor="adminResponse" className="sr-only">
                        Admin response
                      </label>
                      <textarea
                        id="adminResponse"
                        value={adminResponse}
                        onChange={(e) => setAdminResponse(e.target.value)}
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Type your response here..."
                        required
                        aria-label="Admin response to ticket"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !adminResponse.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send response to ticket"
                      >
                        {isSubmitting ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" aria-hidden="true" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaReply className="mr-2" aria-hidden="true" />
                            Send Response
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}