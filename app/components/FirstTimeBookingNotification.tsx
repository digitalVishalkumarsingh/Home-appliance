// app/components/FirstTimeBookingNotification.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGift, FaTimes } from "react-icons/fa";
import useAuth from "../hooks/useAuth";

export default function FirstTimeBookingNotification() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoading && user && !hasChecked) {
      if (user.role === "admin" || user.role === "technician") {
        return;
      }

      checkFirstTimeBookingEligibility();
      setHasChecked(true);
    }
  }, [isAuthenticated, isLoading, user, hasChecked]);

  const checkFirstTimeBookingEligibility = async () => {
    try {
      const response = await fetch("/api/special-offers/first-time");

      if (!response.ok) {
        console.error("Failed to fetch first-time offer eligibility:", response.statusText);
        return;
      }

      const data = await response.json();

      if (data.success && data.isEligible && data.offer) {
        const notificationShown = localStorage.getItem("firstTimeOfferNotificationShown");

        if (!notificationShown) {
          setIsVisible(true);
          localStorage.setItem("firstTimeOfferNotificationShown", "true");
        }
      }
    } catch (error) {
      console.error("Error checking first-time booking eligibility:", error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-xl border border-green-100 z-50 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center">
              <FaGift className="text-white mr-2" />
              <h3 className="text-white font-medium">Special Offer</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-4">
            <h4 className="font-bold text-lg mb-2">Welcome to Dizit Solutions!</h4>
            <p className="text-gray-700 mb-3">
              As a first-time customer, you're eligible for a special discount on your first booking.
            </p>
            <div className="bg-green-50 p-3 rounded-md border border-green-100 mb-3">
              <p className="text-green-800 font-medium">
                10% off your first booking (up to ₹500)
              </p>
              <p className="text-sm text-green-700 mt-1">
                This discount will be automatically applied when you make your first booking.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}