'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaExclamationCircle, FaCalendarCheck, FaRupeeSign, FaTimes, FaCheck, FaSpinner, FaStar, FaRegStar } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
}

export default function AdminNotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [importantUnreadCount, setImportantUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/notifications?limit=10', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setImportantUnreadCount(data.importantUnreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(Math.max(0, unreadCount - 1));
      
      // Update important unread count if needed
      const notification = notifications.find(n => n._id === notificationId);
      if (notification && notification.isImportant) {
        setImportantUnreadCount(Math.max(0, importantUnreadCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/notifications/read', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(
        notifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
      setUnreadCount(0);
      setImportantUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const toggleImportant = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/notifications/${notificationId}/important`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update notification importance');
      }

      const data = await response.json();
      
      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isImportant: data.isImportant }
            : notification
        )
      );
      
      // Update important unread count if needed
      if (!notifications.find(n => n._id === notificationId)?.isRead) {
        if (data.isImportant) {
          setImportantUnreadCount(importantUnreadCount + 1);
        } else {
          setImportantUnreadCount(Math.max(0, importantUnreadCount - 1));
        }
      }
      
      toast.success(data.message);
    } catch (error) {
      console.error('Error toggling notification importance:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification._id);
    
    // Navigate to appropriate page based on notification type
    if (notification.type === 'booking' && notification.referenceId) {
      router.push(`/admin/bookings/${notification.referenceId}`);
    } else if (notification.type === 'payment' && notification.referenceId) {
      router.push(`/admin/bookings/${notification.referenceId}`);
    } else if (notification.type === 'cancellation' && notification.referenceId) {
      router.push(`/admin/bookings/${notification.referenceId}`);
    }
    
    // Close notification panel
    setShowNotifications(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <FaCalendarCheck className="text-blue-500" />;
      case 'payment':
        return <FaRupeeSign className="text-green-500" />;
      case 'cancellation':
        return <FaTimes className="text-red-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-1 rounded-full text-gray-600 hover:text-gray-800 focus:outline-none"
        aria-label="Notifications"
      >
        <FaBell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {importantUnreadCount > 0 && (
          <span className="absolute bottom-0 right-0 inline-flex items-center justify-center p-1 text-xs font-bold leading-none text-white transform translate-x-1/2 translate-y-1/2 bg-yellow-500 rounded-full">
            <FaExclamationCircle className="h-3 w-3" />
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
            className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="p-3 bg-indigo-600 text-white font-medium flex justify-between items-center">
              <span>Admin Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs bg-indigo-500 hover:bg-indigo-700 px-2 py-1 rounded flex items-center"
                >
                  {loading ? (
                    <FaSpinner className="animate-spin mr-1 h-3 w-3" />
                  ) : (
                    <FaCheck className="mr-1 h-3 w-3" />
                  )}
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-3 hover:bg-gray-50 ${
                        !notification.isRead ? "bg-blue-50" : ""
                      } ${notification.isImportant ? "border-l-4 border-yellow-400" : ""} cursor-pointer`}
                    >
                      <div className="flex">
                        <div className="flex-shrink-0 mr-3 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 pr-8">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-medium text-gray-900">
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  New
                                </span>
                              )}
                              {notification.isImportant && (
                                <span className="ml-1 text-yellow-500">
                                  <FaExclamationCircle className="inline h-3 w-3" />
                                </span>
                              )}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleImportant(notification._id);
                              }}
                              className="text-gray-400 hover:text-yellow-500"
                              title={notification.isImportant ? "Remove importance" : "Mark as important"}
                            >
                              {notification.isImportant ? (
                                <FaStar className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <FaRegStar className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <p 
                            className="text-sm text-gray-600"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 bg-gray-50 text-center border-t border-gray-100">
              <Link
                href="/admin/notifications"
                className="text-sm text-indigo-600 hover:text-indigo-800"
                onClick={() => setShowNotifications(false)}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
