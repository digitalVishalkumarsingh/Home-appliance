'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarCheck, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'booking';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  role?: string;
}

export default function BookingNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();

  // Check if user is technician or admin
  const [isSpecialUser, setIsSpecialUser] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is a technician or admin
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const userData: User = JSON.parse(userStr);
        if (userData.role === 'technician' || userData.role === 'admin') {
          setIsSpecialUser(true);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Fetch recent booking notifications
  const fetchBookingNotifications = async () => {
    try {
      // Don't fetch notifications for technicians and admins
      if (isSpecialUser) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/notifications?limit=5&unreadOnly=true', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();

      // Filter for booking notifications only
      const bookingNotifications = (data.notifications || []).filter(
        (notification: Notification) => notification.type === 'booking'
      );

      setNotifications(bookingNotifications);

      // Show the most recent unread booking notification
      if (bookingNotifications.length > 0 && !showNotification) {
        setCurrentNotification(bookingNotifications[0]);
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error fetching booking notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Remove the notification from the list
      setNotifications(notifications.filter(n => n._id !== notificationId));

      // If there are more notifications, show the next one
      if (notifications.length > 1) {
        setCurrentNotification(notifications[1]);
      } else {
        setCurrentNotification(null);
        setShowNotification(false);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    if (!currentNotification) return;

    // Mark as read
    markAsRead(currentNotification._id);

    // Navigate to booking details if referenceId exists
    if (currentNotification.referenceId) {
      router.push(`/bookings/${currentNotification.referenceId}`);
    } else {
      // Try to extract booking ID from the message if possible
      const bookingIdMatch = currentNotification.message.match(/booking (?:ID )?(BK\d+)/i);
      if (bookingIdMatch && bookingIdMatch[1]) {
        router.push(`/bookings/${bookingIdMatch[1]}`);
      } else {
        router.push('/bookings');
      }
    }
  };

  // Close notification without marking as read
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotification(false);

    // Show the next notification after a delay
    setTimeout(() => {
      if (notifications.length > 1) {
        setCurrentNotification(notifications[1]);
        setShowNotification(true);
      } else {
        setCurrentNotification(null);
      }
    }, 5000);
  };

  // Poll for new notifications
  useEffect(() => {
    // Don't set up polling for technicians and admins
    if (isSpecialUser) return;

    fetchBookingNotifications();

    // Poll every 30 seconds
    const intervalId = setInterval(fetchBookingNotifications, 30000);

    return () => clearInterval(intervalId);
  }, [isSpecialUser]);

  // Auto-hide notification after 10 seconds
  useEffect(() => {
    if (showNotification) {
      const timeoutId = setTimeout(() => {
        setShowNotification(false);
      }, 10000);

      return () => clearTimeout(timeoutId);
    }
  }, [showNotification, currentNotification]);

  // Don't show notifications for technicians and admins
  if (isSpecialUser || !currentNotification) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-full"
          onClick={handleNotificationClick}
          role="alert"
          aria-live="polite"
          tabIndex={0}
        >
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-blue-200 cursor-pointer">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 flex justify-between items-center">
              <div className="flex items-center">
                <FaCalendarCheck className="text-white mr-2" />
                <h3 className="text-white font-medium">New Booking</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-300 focus:outline-none"
                aria-label="Close notification"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-800">{currentNotification.title}</h4>
              <p className="text-gray-600 mt-1">{currentNotification.message}</p>
              <div className="mt-3 text-sm text-blue-600 font-medium">
                Click to view booking details
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}