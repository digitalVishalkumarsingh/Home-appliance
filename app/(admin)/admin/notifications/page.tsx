"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaBell,
  FaCalendarCheck,
  FaRupeeSign,
  FaTimes,
  FaSpinner,
  FaStar,
  FaRegStar,
  FaExclamationCircle,
  FaSearch,
  FaFilter,
  FaCheck,
  FaRedo,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ErrorBoundary } from "react-error-boundary";
import debounce from "lodash.debounce";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
  readAt?: string;
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread" | "important">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  const checkAdminAuth = useCallback(async () => {
    try {
      setLoadingProgress(10);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Authentication token not found. Please log in as admin.");
      }

      setLoadingProgress(50);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Invalid or expired token: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error("Token verification failed.");
      }

      setLoadingProgress(100);
      return true;
    } catch (err) {
      console.error("Error checking admin auth:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate. Please try again.");
      toast.error(err instanceof Error ? err.message : "Authentication failed.", {
        duration: 4000,
      });
      return false;
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProgress(10);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      setLoadingProgress(50);
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/notifications?page=${page}&limit=20`;

      if (filter === "unread") url += "&unreadOnly=true";
      else if (filter === "important") url += "&importantOnly=true";
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch notifications.");
      }

      setNotifications(data.notifications || []);
      setTotalPages(data.pagination?.pages || 1);
      setLoadingProgress(100);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch notifications.");
      toast.error(error instanceof Error ? error.message : "Failed to load notifications.", {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchTerm]);

  useEffect(() => {
    const initialize = async () => {
      const isAuthenticated = await checkAdminAuth();
      if (!isAuthenticated) {
        router.push("/admin/login");
        return;
      }
      await fetchNotifications();
    };

    initialize();
    const toastId = toast.loading("Loading notifications...");
    return () => toast.dismiss(toastId);
  }, [checkAdminAuth, fetchNotifications, router]);

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
    setPage(1);
    fetchNotifications();
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setProcessingIds((prev) => [...prev, notificationId]);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      toast.success("Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to update notification");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== notificationId));
    }
  };

  const toggleImportant = async (notificationId: string) => {
    try {
      setProcessingIds((prev) => [...prev, notificationId]);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/notifications/${notificationId}/important`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update notification importance: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isImportant: data.isImportant }
            : notification
        )
      );
      toast.success(data.message);
    } catch (error) {
      console.error("Error toggling notification importance:", error);
      toast.error("Failed to update notification");
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== notificationId));
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/notifications/read`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ markAll: true }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.status}`);
      }

      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: new Date().toISOString(),
        }))
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Failed to update notifications");
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <FaCalendarCheck className="text-blue-500" aria-hidden="true" />;
      case "payment":
        return <FaRupeeSign className="text-green-500" aria-hidden="true" />;
      case "cancellation":
        return <FaTimes className="text-red-500" aria-hidden="true" />;
      default:
        return <FaBell className="text-gray-500" aria-hidden="true" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.referenceId) {
      if (["booking", "payment", "cancellation"].includes(notification.type)) {
        router.push(`/admin/bookings/${notification.referenceId}`);
      }
    }
  };

  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={resetErrorBoundary}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaRedo className="mr-2 h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      setLoadingProgress(0);
                      checkAdminAuth().then((isAuthenticated) => {
                        if (isAuthenticated) fetchNotifications();
                        else router.push("/admin/login");
                      });
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <FaRedo className="mr-2 h-4 w-4" aria-hidden="true" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/admin/login")}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setError(null);
        setLoading(true);
        setLoadingProgress(0);
        checkAdminAuth().then((isAuthenticated) => {
          if (isAuthenticated) fetchNotifications();
          else router.push("/admin/login");
        });
      }}
    >
      <motion.div
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        role="main"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Admin Notifications</h1>
              <div className="flex space-x-2">
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                      loading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "text-indigo-600 bg-white hover:bg-gray-100"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    aria-label="Mark all notifications as read"
                  >
                    Mark All as Read
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1 text-sm font-medium rounded-md flex items-center ${
                      filter === "all"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Show all notifications"
                    aria-pressed={filter === "all"}
                  >
                    <FaFilter className="mr-1 h-4 w-4" aria-hidden="true" />
                    All
                  </button>
                  <button
                    onClick={() => setFilter("unread")}
                    className={`px-3 py-1 text-sm font-medium rounded-md flex items-center ${
                      filter === "unread"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Show unread notifications"
                    aria-pressed={filter === "unread"}
                  >
                    <FaFilter className="mr-1 h-4 w-4" aria-hidden="true" />
                    Unread
                  </button>
                  <button
                    onClick={() => setFilter("important")}
                    className={`px-3 py-1 text-sm font-medium rounded-md flex items-center ${
                      filter === "important"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                    aria-label="Show important notifications"
                    aria-pressed={filter === "important"}
                  >
                    <FaFilter className="mr-1 h-4 w-4" aria-hidden="true" />
                    Important
                  </button>
                </div>

                <div className="relative flex-grow w-full sm:w-auto">
                  <label htmlFor="search" className="sr-only">
                    Search notifications
                  </label>
                  <input
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search notifications..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    aria-label="Search notifications by title or message"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {loading && notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading notifications...</p>
                  <div className="mt-2 w-48 bg-gray-200 rounded-full h-2 mx-auto">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {loadingProgress < 50 ? "Checking authentication..." : "Fetching notifications..."}
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No notifications found</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 hover:bg-gray-50 ${
                      !notification.isRead ? "bg-blue-50" : ""
                    } ${notification.isImportant ? "border-l-4 border-yellow-400" : ""}`}
                    role="article"
                  >
                    <div className="flex">
                      <div className="flex-shrink-0 mr-3 mt-1">{getNotificationIcon(notification.type)}</div>
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleNotificationClick(notification);
                          }
                        }}
                        aria-label={`View notification: ${notification.title}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900 flex items-center">
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                              {notification.isImportant && (
                                <span className="ml-1 text-yellow-500">
                                  <FaExclamationCircle
                                    className="inline h-3 w-3"
                                    aria-hidden="true"
                                  />
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <span>{formatDate(notification.createdAt)}</span>
                              {notification.isRead && notification.readAt && (
                                <span className="ml-3">Read: {formatDate(notification.readAt)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleImportant(notification._id);
                              }}
                              disabled={processingIds.includes(notification._id)}
                              className={`${
                                processingIds.includes(notification._id)
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-gray-400 hover:text-yellow-500"
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                              title={
                                notification.isImportant
                                  ? "Remove importance"
                                  : "Mark as important"
                              }
                              aria-label={
                                notification.isImportant
                                  ? "Remove importance"
                                  : "Mark as important"
                              }
                            >
                              {processingIds.includes(notification._id) ? (
                                <FaSpinner className="h-4 w-4 animate-spin" aria-hidden="true" />
                              ) : notification.isImportant ? (
                                <FaStar className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                              ) : (
                                <FaRegStar className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                disabled={processingIds.includes(notification._id)}
                                className={`${
                                  processingIds.includes(notification._id)
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-400 hover:text-blue-500"
                                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                title="Mark as read"
                                aria-label="Mark as read"
                              >
                                {processingIds.includes(notification._id) ? (
                                  <FaSpinner
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <FaCheck className="h-4 w-4" aria-hidden="true" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    aria-label="Previous page"
                    aria-disabled={page === 1}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      page === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    aria-label="Next page"
                    aria-disabled={page === totalPages}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{page}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                    role="navigation"
                  >
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        page === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      aria-label="Previous page"
                      aria-disabled={page === 1}
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
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.min(Math.max(1, page - 2) + i, totalPages);
                      if (pageNum <= totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                            aria-label={`Go to page ${pageNum}`}
                            aria-current={page === pageNum ? "page" : undefined}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        page === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                      aria-label="Next page"
                      aria-disabled={page === totalPages}
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
            )}
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}