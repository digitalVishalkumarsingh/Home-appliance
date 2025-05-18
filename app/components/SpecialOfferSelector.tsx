"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGift, FaPercent, FaRupeeSign, FaTimes, FaCheck, FaTag } from "react-icons/fa";
import { toast } from "react-hot-toast";

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

interface AppliedOffer extends SpecialOffer {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  formattedOriginalPrice: string;
  formattedDiscountedPrice: string;
  formattedDiscountAmount: string;
  savings: string;
}

interface SpecialOfferSelectorProps {
  serviceId?: string;
  originalPrice: number | string;
  onOfferApplied: (offer: AppliedOffer) => void;
}

export default function SpecialOfferSelector({
  serviceId,
  originalPrice,
  onOfferApplied,
}: SpecialOfferSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [showOffers, setShowOffers] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<SpecialOffer[]>([]);
  const [appliedOffer, setAppliedOffer] = useState<AppliedOffer | null>(null);
  const [offerCode, setOfferCode] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);

  useEffect(() => {
    fetchAvailableOffers();
  }, []);

  const fetchAvailableOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/special-offers");

      if (!response.ok) {
        throw new Error("Failed to fetch special offers");
      }

      const data = await response.json();
      setAvailableOffers(data.specialOffers || []);
    } catch (error) {
      console.error("Error fetching special offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyOffer = async (offer: SpecialOffer) => {
    try {
      setLoading(true);
      const response = await fetch("/api/special-offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offerId: offer._id,
          serviceId,
          originalPrice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to apply offer");
      }

      const data = await response.json();
      setAppliedOffer(data.specialOffer);
      onOfferApplied(data.specialOffer);
      setShowOffers(false);
      toast.success("Offer applied successfully!");
    } catch (error) {
      console.error("Error applying offer:", error);
      toast.error(error instanceof Error ? error.message : "Failed to apply offer");
    } finally {
      setLoading(false);
    }
  };

  const applyOfferCode = async () => {
    if (!offerCode.trim()) {
      toast.error("Please enter an offer code");
      return;
    }

    try {
      setApplyingCode(true);
      // Find the offer with this code
      const offer = availableOffers.find(
        (o) => o.offerCode && o.offerCode.toLowerCase() === offerCode.toLowerCase()
      );

      if (!offer) {
        toast.error("Invalid offer code");
        return;
      }

      // Apply the offer
      await applyOffer(offer);
    } catch (error) {
      console.error("Error applying offer code:", error);
      toast.error("Failed to apply offer code");
    } finally {
      setApplyingCode(false);
      setOfferCode("");
    }
  };

  const removeOffer = () => {
    setAppliedOffer(null);
    onOfferApplied(null as any);
    toast.success("Offer removed");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="mt-4 mb-6">
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Special Offers</h3>
        </div>

        {/* Applied Offer */}
        {appliedOffer ? (
          <div className="p-4 bg-green-50 border-green-100 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <FaCheck className="text-green-600 h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-green-800">{appliedOffer.name}</p>
                  <p className="text-sm text-green-700">
                    {appliedOffer.savings} - You pay {appliedOffer.formattedDiscountedPrice} instead of {appliedOffer.formattedOriginalPrice}
                  </p>
                </div>
              </div>
              <button
                onClick={removeOffer}
                className="text-green-700 hover:text-green-900"
                title="Remove offer"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : availableOffers.length > 0 ? (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md cursor-pointer"
               onClick={() => setShowOffers(!showOffers)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaGift className="text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Special offers available!</p>
                  <p className="text-xs text-blue-700">
                    Click to view {availableOffers.length} available offer{availableOffers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-blue-500">
                <svg
                  className={`h-5 w-5 transform transition-transform duration-200 ${
                    showOffers ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Checking for available offers...</p>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <FaTag className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p>No special offers available at this time</p>
          </div>
        )}

        {/* Offer Code Input */}
        {!appliedOffer && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <input
                type="text"
                value={offerCode}
                onChange={(e) => setOfferCode(e.target.value)}
                placeholder="Enter offer code"
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={applyOfferCode}
                disabled={applyingCode || !offerCode.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {applyingCode ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Applying...
                  </span>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Available Offers List */}
        <AnimatePresence>
          {showOffers && !appliedOffer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200"
            >
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading available offers...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {availableOffers.map((offer) => (
                    <div
                      key={offer._id}
                      className="p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => applyOffer(offer)}
                    >
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          {offer.discountType === 'percentage' ? (
                            <FaPercent className="text-blue-600 h-5 w-5" />
                          ) : (
                            <FaRupeeSign className="text-blue-600 h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{offer.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {offer.discountType === 'percentage'
                              ? `${offer.discountValue}% off`
                              : `₹${offer.discountValue} off`}
                            {offer.offerCode && ` (Code: ${offer.offerCode})`}
                          </p>
                          {offer.description && (
                            <p className="text-xs text-gray-500 mt-1">{offer.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Valid till {formatDate(offer.endDate)}
                          </p>
                        </div>
                        <button
                          className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
