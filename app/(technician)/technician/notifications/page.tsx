"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FaSpinner,
  FaBell,
  FaCalendarCheck,
  FaExclamationTriangle,
  FaTools,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaUser,
  FaCheck,
  FaTimes,
  FaTrash,
  FaEye,
  FaFilter,
  FaSearch,
} from "react-icons/fa";
import Link from "next/link";

interface Notification {
  _id: string;
  type: "job_offer" | "job_accepted" | "job_completed" | "job_cancelled" | "payment" | "system";
  title: string;
  message: string;
  jobId?: string;
  bookingId?: string;
  createdAt: string;
  read: boolean;
  urgent?: boolean;
  actionUrl?: string;
  actionText?: string;
  amount?: number;
  customer?: {
    name: string;
    address: string;
  };
}

interface ApiResponse {
  success: boolean;
  notifications?: Notification[];
  message?: string;
}

export default function TechnicianNotifications() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetchWithTimeout(`${API_URL}/api/technicians/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        setFilteredNotifications(data.notifications);
      } else {
        throw new Error(data.message || "Unexpected response format");
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      setError(error.message || "Failed to fetch notifications. Please try again later.");
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Authentication check and initial data fetch
  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      toast.error("Please login to access your notifications");
      router.push("/login");
      return;
    }

    if (user.role !== "technician") {
      toast.error("Unauthorized access");
      router.push("/login");
      return;
    }

    fetchNotifications();
  }, [router]);

  // Filter notifications based on type and search query
  useEffect(() => {
    let filtered = notifications;

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        notification =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          (notification.customer?.name && notification.customer.name.toLowerCase().includes(query)) ||
          (notification.customer?.address && notification.customer.address.toLowerCase().includes(query)) ||
          (notification.bookingId && notification.bookingId.toLowerCase().includes(query)),
      );
    }

    setFilteredNotifications(filtered);
  }, [typeFilter, searchQuery, notifications]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      setMarkingAsRead(notificationId);

      const token = getToken();
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetchWithTimeout(`${API_URL}/api/technicians/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to mark notification as read");
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification._id === notificationId ? { ...notification, read: true } : notification,
        ),
      );
      toast.success("Notification marked as read");
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      toast.error(error.message || "Failed to mark notification as read");
    } finally {
      setMarkingAsRead(null);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      setDeleting(notificationId);

      const token = getToken();
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const response = await fetchWithTimeout(`${API_URL}/api/technicians/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to delete notification");
      }

      setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
      toast.success("Notification deleted");
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error(error.message || "Failed to delete notification");
    } finally {
      setDeleting(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "job_offer":
        return <FaBell className="h-6 w-6 text-blue-500" />;
      case "job_accepted":
        return <FaCheck className="h-6 w-6 text-green-500" />;
      case "job_completed":
        return <FaCalendarCheck className="h-6 w-6 text-green-500" />;
      case "job_cancelled":
        return <FaTimes className="h-6 w-6 text-red-500" />;
      case "payment":
        return <FaRupeeSign className="h-6 w-6 text-yellow-500" />;
      case "system":
        return <FaTools className="h-6 w-6 text-gray-500" />;
      default:
        return <FaBell className="h-6 w-6 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">Stay updated with your job offers and activities</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Type
              </label>
              <div className="relative">
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Notifications</option>
                  <option value="job_offer">Job Offers</option>
                  <option value="job_accepted">Accepted Jobs</option>
                  <option value="job_completed">Completed Jobs</option>
                  <option value="job_cancelled">Cancelled Jobs</option>
                  <option value="payment">Payments</option>
                  <option value="system">System</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FaFilter className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Notifications
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                placeholder="Search by title, message, or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <FaExclamationTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Try again
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <FaBell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || typeFilter !== "all"
              ? "Try changing your filters or search query"
              : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredNotifications.map(notification => (
              <li key={notification._id} className={notification.read ? "" : "bg-blue-50"}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {notification.title}
                          {notification.urgent && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Urgent
                            </span>
                          )}
                          {!notification.read && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              New
                            </span>
                          )}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{notification.message}</p>

                      {notification.customer && (
                        <div className="mt-2 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FaUser className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{notification.customer.name}</span>
                          </div>
                          <div className="mt-1 flex items-center">
                            <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>{notification.customer.address}</span>
                          </div>
                        </div>
                      )}

                      {notification.amount && (
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <FaRupeeSign className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>₹{notification.amount.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex space-x-3">
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:border-blue-700 focus:shadow-outline-blue active:bg-blue-700 transition ease-in-out duration-150"
                            >
                              <FaEye className="mr-1.5 h-4 w-4" />
                              {notification.actionText || "View"}
                            </Link>
                          )}

                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              disabled={markingAsRead === notification._id}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                            >
                              {markingAsRead === notification._id ? (
                                <FaSpinner className="animate-spin mr-1.5 h-4 w-4" />
                              ) : (
                                <FaCheck className="mr-1.5 h-4 w-4" />
                              )}
                              Mark as Read
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => deleteNotification(notification._id)}
                          disabled={deleting === notification._id}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:border-red-300 focus:shadow-outline-red active:bg-red-200 transition ease-in-out duration-150"
                        >
                          {deleting === notification._id ? (
                            <FaSpinner className="animate-spin h-4 w-4" />
                          ) : (
                            <FaTrash className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}