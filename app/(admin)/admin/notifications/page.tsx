'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaBell, FaCalendarCheck, FaRupeeSign, FaTimes, FaSpinner, FaStar, FaRegStar, FaExclamationCircle, FaSearch, FaFilter } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/admin/login');
        return;
      }

      let url = `/api/admin/notifications?page=${page}&limit=20`;
      
      if (filter === 'unread') {
        url += '&unreadOnly=true';
      } else if (filter === 'important') {
        url += '&importantOnly=true';
      }
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url, {
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
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'An error occurred while fetching notifications');
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setProcessingIds(prev => [...prev, notificationId]);
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
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== notificationId));
    }
  };

  const toggleImportant = async (notificationId: string) => {
    try {
      setProcessingIds(prev => [...prev, notificationId]);
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
      
      toast.success(data.message);
    } catch (error) {
      console.error('Error toggling notification importance:', error);
      toast.error('Failed to update notification');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== notificationId));
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
          readAt: new Date().toISOString(),
        }))
      );
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to update notifications');
    } finally {
      setLoading(false);
    }
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
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate to appropriate page based on notification type
    if (notification.referenceId) {
      if (notification.type === 'booking' || notification.type === 'payment' || notification.type === 'cancellation') {
        router.push(`/admin/bookings/${notification.referenceId}`);
      }
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
            <span className="ml-2 text-lg text-gray-600">Loading notifications...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-center text-red-500 mb-4">
              <FaExclamationCircle className="h-12 w-12" />
            </div>
            <h2 className="text-center text-xl font-bold text-gray-900 mb-2">Error Loading Notifications</h2>
            <p className="text-center text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center">
              <button
                onClick={fetchNotifications}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-blue-500">
            <h1 className="text-xl font-bold text-white">Admin Notifications</h1>
            <div className="flex space-x-2">
              {notifications.some(n => !n.isRead) && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    filter === 'all'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    filter === 'unread'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('important')}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    filter === 'important'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Important
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search notifications..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <button
                  type="submit"
                  className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  } ${notification.isImportant ? 'border-l-4 border-yellow-400' : ''}`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
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
                                <FaExclamationCircle className="inline h-3 w-3" />
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.isRead && notification.readAt && (
                              <span className="ml-3">
                                Read: {formatDate(notification.readAt)}
                              </span>
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
                            className="text-gray-400 hover:text-yellow-500"
                            title={notification.isImportant ? "Remove importance" : "Mark as important"}
                          >
                            {processingIds.includes(notification._id) ? (
                              <FaSpinner className="h-4 w-4 animate-spin" />
                            ) : notification.isImportant ? (
                              <FaStar className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <FaRegStar className="h-4 w-4" />
                            )}
                          </button>
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              disabled={processingIds.includes(notification._id)}
                              className="text-gray-400 hover:text-blue-500"
                              title="Mark as read"
                            >
                              {processingIds.includes(notification._id) ? (
                                <FaSpinner className="h-4 w-4 animate-spin" />
                              ) : (
                                <FaCheck className="h-4 w-4" />
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        page === 1
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.min(
                        Math.max(1, page - 2) + i,
                        totalPages
                      );
                      if (pageNum <= totalPages) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pageNum
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
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
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
