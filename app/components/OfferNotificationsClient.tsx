"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTag, FaPercent, FaRupeeSign, FaTimes, FaChevronRight } from "react-icons/fa";
import Link from "next/link";
import useAuth from "@/app/hooks/useAuth";

interface Discount {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
}

export default function OfferNotificationsClient() {
  const { user, isAdmin } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [currentDiscountIndex, setCurrentDiscountIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch active discounts
  useEffect(() => {
    if (!isMounted) return;

    // Don't fetch discounts for admin users
    if (isAdmin || (user && user.role === 'admin')) {
      return;
    }

    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/discounts');

        if (!response.ok) {
          if (response.status !== 404) { // Ignore 404 errors
            throw new Error('Failed to fetch discounts');
          }
          return;
        }

        const data = await response.json();

        if (data.success && data.discounts && data.discounts.length > 0) {
          setDiscounts(data.discounts);

          // Show notification after a short delay
          setTimeout(() => {
            setShowNotification(true);
          }, 2000);
        }
      } catch (error) {
        console.error('Error fetching discounts:', error);
        setError('Failed to load available discounts');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();

    // Auto-rotate discounts every 10 seconds
    const rotationInterval = setInterval(() => {
      if (discounts.length > 1) {
        setCurrentDiscountIndex((prevIndex) => (prevIndex + 1) % discounts.length);
      }
    }, 10000);

    return () => clearInterval(rotationInterval);
  }, [isMounted, isAdmin, user]);

  // Update current discount index when discounts change
  useEffect(() => {
    if (discounts.length > 0) {
      setCurrentDiscountIndex(0);
    }
  }, [discounts]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Close notification
  const handleClose = () => {
    setShowNotification(false);

    // Store in localStorage to avoid showing again in this session
    localStorage.setItem('offers_dismissed', 'true');
  };

  // Navigate to next discount
  const handleNext = () => {
    if (discounts.length > 1) {
      setCurrentDiscountIndex((prevIndex) => (prevIndex + 1) % discounts.length);
    }
  };

  // Check if we should show notifications
  const shouldShowNotifications = () => {
    if (!isMounted) return false;

    // Don't show if no discounts, user dismissed, or user is admin
    if (
      discounts.length === 0 ||
      localStorage.getItem('offers_dismissed') === 'true' ||
      isAdmin ||
      (user && user.role === 'admin')
    ) {
      return false;
    }
    return showNotification;
  };

  // Get current discount
  const currentDiscount = discounts[currentDiscountIndex];

  if (!isMounted || !shouldShowNotifications() || !currentDiscount) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldShowNotifications() && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-green-200">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 flex justify-between items-center">
              <div className="flex items-center">
                <FaTag className="text-white mr-2" />
                <h3 className="text-white font-medium">Special Offer!</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-200 focus:outline-none"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  {currentDiscount.discountType === 'percentage' ? (
                    <FaPercent className="text-green-600 h-5 w-5" />
                  ) : (
                    <FaRupeeSign className="text-green-600 h-5 w-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{currentDiscount.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentDiscount.discountType === 'percentage'
                      ? `${currentDiscount.discountValue}% off`
                      : `₹${currentDiscount.discountValue} off`}
                    {' on '}{currentDiscount.categoryName}
                  </p>
                  {currentDiscount.description && (
                    <p className="text-xs text-gray-500 mt-1">{currentDiscount.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Valid till {formatDate(currentDiscount.endDate)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                {discounts.length > 1 && (
                  <button
                    onClick={handleNext}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    Next Offer <FaChevronRight className="ml-1" />
                  </button>
                )}
                <Link
                  href={`/services/${currentDiscount.categoryId}`}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
