"use client";

import { useState, useEffect } from "react";
import { FaBell } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import useAuth from "@/app/hooks/useAuth";

interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBadge() {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  // Get token with fallback to cookies
  const getToken = (): string | null => {
    if (typeof window === "undefined") return null;

    // First try localStorage
    let token = localStorage.getItem("token");
    if (token) {
      return token;
    }

    // If not in localStorage, try to get from cookies as fallback
    try {
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
        if (token) {
          // Sync to localStorage for future use
          localStorage.setItem("token", token);
          return token;
        }
      }
    } catch (error) {
      console.debug("Error reading cookies:", error);
    }

    return null;
  };

  // Fetch notifications from API with fallback support
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        console.debug("No token available for fetching notifications");
        return;
      }

      // Try main notifications endpoint first
      let response = await fetch("/api/user/notifications?limit=5&unreadOnly=true", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // If main endpoint fails, try fallback
      if (!response.ok) {
        console.log("Main notifications endpoint failed, trying fallback...");

        // Check if token expired
        if (response.status === 401) {
          // Token might be expired, but don't log out the user immediately
          // Just clear notifications and let other components handle auth
          setNotifications([]);
          setUnreadCount(0);
          return;
        }

        // Try fallback endpoint
        try {
          response = await fetch("/api/notifications/fallback?limit=5&unreadOnly=true");
          if (!response.ok) {
            throw new Error("Both main and fallback endpoints failed");
          }
        } catch (fallbackError) {
          console.error("Fallback notifications also failed:", fallbackError);
          // Silently fail - don't show errors to user for notifications
          if (isMounted) {
            setNotifications([]);
            setUnreadCount(0);
          }
          return;
        }
      }

      const data = await response.json();
      if (isMounted) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);

        // Log if using fallback data
        if (data.fallback) {
          console.log("Using fallback notifications data");
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Don't show any error to the user, just clear notifications
      if (isMounted) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationId?: string) => {
    try {
      const token = getToken();

      if (!token) {
        console.debug("No token available for marking notifications as read");
        return;
      }

      const response = await fetch("/api/user/notifications/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notificationIds: notificationId ? [notificationId] : [],
          markAll: !notificationId,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.debug("Token expired while marking notifications as read");
          return;
        }
        throw new Error(`Failed to mark notifications as read: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to mark notifications as read");
      }

      // Update local state
      if (isMounted) {
        if (notificationId) {
          setNotifications((prev) =>
            prev.map((notification) =>
              notification._id === notificationId
                ? { ...notification, isRead: true }
                : notification
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else {
          setNotifications((prev) =>
            prev.map((notification) => ({ ...notification, isRead: true }))
          );
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      // Don't show error to user for notification marking failures
      // as it's not critical functionality
    }
  };

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      // Mark all as read when opening the panel
      markAsRead();
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} day ago`;

    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_user_offer":
        return "🎁";
      case "discount":
        return "💰";
      case "booking":
        return "📅";
      case "payment":
        return "💳";
      default:
        return "📣";
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification._id);

    // Navigate to appropriate page based on notification type
    if (notification.type === "booking") {
      if (notification.referenceId) {
        window.location.href = `/bookings/${notification.referenceId}`;
      } else {
        // Try to extract booking ID from the message if possible
        const bookingIdMatch = notification.message.match(/booking (?:ID )?(BK\d+)/i);
        if (bookingIdMatch && bookingIdMatch[1]) {
          window.location.href = `/bookings/${bookingIdMatch[1]}`;
        } else {
          window.location.href = '/bookings';
        }
      }
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-1 rounded-full text-white/90 hover:text-white focus:outline-none transition-colors duration-200"
        aria-label="Notifications"
      >
        <FaBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="p-3 bg-indigo-600 text-white font-medium flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAsRead()}
                  className="text-xs bg-indigo-500 hover:bg-indigo-700 px-2 py-1 rounded"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-3 hover:bg-gray-50 ${
                        !notification.isRead ? "bg-blue-50" : ""
                      } cursor-pointer`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          <span className="text-xl">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                          {notification.type === "booking" && notification.referenceId && (
                            <p className="text-xs text-blue-500 mt-1 font-medium">
                              Click to view booking details
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
              <button
                onClick={() => setShowNotifications(false)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
