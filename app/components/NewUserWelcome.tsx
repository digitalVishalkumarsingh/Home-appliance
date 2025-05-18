"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGift, FaPercent, FaRupeeSign, FaTimes, FaCheck, FaTag } from "react-icons/fa";
import { toast } from "react-hot-toast";
import Link from "next/link";
import useAuth from "@/app/hooks/useAuth";

interface SpecialOffer {
  _id: string;
  name: string;
  description: string;
  offerCode?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  userType: "new" | "existing" | "all";
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usagePerUser?: number;
  isActive: boolean;
}

export default function NewUserWelcome() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [newUserOffers, setNewUserOffers] = useState<SpecialOffer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if this is the first login after registration
    const isFirstLogin = localStorage.getItem("isFirstLogin") !== "false";

    // If user is logged in, is not an admin, and this is their first login, show the welcome message
    if (user && !user.role?.includes("admin") && isFirstLogin) {
      // Mark that the user has seen the welcome message
      localStorage.setItem("isFirstLogin", "false");

      // Fetch special offers for new users
      fetchNewUserOffers();
    }
  }, [user]);

  const fetchNewUserOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/special-offers");

      if (!response.ok) {
        throw new Error("Failed to fetch special offers");
      }

      const data = await response.json();

      // Filter offers for new users
      const newUserOffers = data.specialOffers.filter(
        (offer: SpecialOffer) => offer.userType === "new" || offer.userType === "all"
      );

      setNewUserOffers(newUserOffers);

      // Only show welcome if there are offers available
      if (newUserOffers.length > 0) {
        // Delay showing the welcome message for a better UX
        setTimeout(() => {
          setShowWelcome(true);
        }, 1500);
      }
    } catch (error) {
      console.error("Error fetching new user offers:", error);
      setError("Failed to load special offers");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowWelcome(false);
  };

  const formatDiscountValue = (offer: SpecialOffer) => {
    return offer.discountType === "percentage"
      ? `${offer.discountValue}% off`
      : `₹${offer.discountValue} off`;
  };

  if (loading || !showWelcome || newUserOffers.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {showWelcome && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        >
          <motion.div
            className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                    <FaGift className="text-white h-6 w-6" />
                  </div>
                  <h2 className="text-white text-xl font-bold">Welcome to Dizit Solutions!</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white hover:text-gray-200 focus:outline-none"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Thank you for joining Dizit Solutions! As a new user, you have access to these exclusive offers:
              </p>

              <div className="space-y-3 mb-6">
                {newUserOffers.map((offer) => (
                  <div
                    key={offer._id}
                    className="bg-blue-50 border border-blue-100 rounded-lg p-4"
                  >
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                        {offer.discountType === "percentage" ? (
                          <FaPercent className="text-blue-600 h-4 w-4" />
                        ) : (
                          <FaRupeeSign className="text-blue-600 h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-800">{offer.name}</h3>
                        <p className="text-sm text-blue-700 font-semibold">
                          {formatDiscountValue(offer)}
                        </p>
                        {offer.description && (
                          <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                        )}
                        {offer.offerCode && (
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">Use code:</span>
                            <span className="ml-2 bg-white px-2 py-1 rounded border border-gray-200 text-sm font-mono">
                              {offer.offerCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  These offers will be automatically applied when you book our services.
                </p>
                <div className="flex justify-center space-x-3">
                  <Link
                    href="/#services"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={handleClose}
                  >
                    Explore Services
                  </Link>
                  <button
                    onClick={handleClose}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
