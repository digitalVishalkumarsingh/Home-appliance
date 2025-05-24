"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGift, FaCheck } from "react-icons/fa";
import { toast } from "react-hot-toast";
import useAuth from "@/app/hooks/useAuth";

interface AppliedOffer {
  _id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  formattedOriginalPrice: string;
  formattedDiscountedPrice: string;
  formattedDiscountAmount: string;
  savings: string;
  isAutoApplied: boolean;
}

interface FirstTimeOfferBannerProps {
  serviceId?: string;
  originalPrice: string | number;
  onOfferApplied: (offer: AppliedOffer | null) => void;
}

export default function FirstTimeOfferBanner({
  serviceId,
  originalPrice,
  onOfferApplied
}: FirstTimeOfferBannerProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<AppliedOffer | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const checkFirstTimeOffer = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/special-offers/auto-apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The token will be sent automatically via cookies
        },
        body: JSON.stringify({
          serviceId,
          originalPrice
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error checking first-time offer:", errorData);
        return;
      }

      const data = await response.json();

      if (data.success && data.isEligible && data.offer) {
        setOffer(data.offer);
        setIsVisible(true);

        // Automatically apply the offer
        onOfferApplied(data.offer);

        // Show a toast notification
        toast.success("First-time booking discount applied automatically!", {
          duration: 5000,
          icon: "🎁"
        });
      }
    } catch (error) {
      console.error("Error checking first-time offer:", error);
    } finally {
      setLoading(false);
    }
  }, [serviceId, originalPrice, onOfferApplied]);

  useEffect(() => {
    // Only check for first-time offers if the user is authenticated and not an admin
    if (isAuthenticated && !isLoading && user) {
      // Skip for admin users
      if (user.role === 'admin') {
        return;
      }

      checkFirstTimeOffer();
    }
  }, [isAuthenticated, isLoading, user, originalPrice, checkFirstTimeOffer]);

  if (loading || !offer) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-lg shadow-sm"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-blue-500 p-2 rounded-full">
              <FaGift className="h-5 w-5 text-white" />
            </div>

            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {offer.title}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                {offer.description}
              </p>

              <div className="mt-2 flex items-center text-sm text-green-600 font-medium">
                <FaCheck className="mr-1" />
                <span>
                  {offer.savings} applied automatically! You pay {offer.formattedDiscountedPrice} instead of {offer.formattedOriginalPrice}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
