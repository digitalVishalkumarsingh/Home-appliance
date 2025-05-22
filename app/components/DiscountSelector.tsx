"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTag, FaPercent, FaRupeeSign, FaCheck, FaTimes, FaInfoCircle } from "react-icons/fa";
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

interface AppliedDiscount extends Discount {
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  formattedOriginalPrice: string;
  formattedDiscountedPrice: string;
  formattedDiscountAmount: string;
  savings: string;
}

interface DiscountSelectorProps {
  serviceId?: string;
  categoryId?: string;
  originalPrice: string | number;
  onDiscountApplied?: (discount: AppliedDiscount | null) => void;
  isServicePage?: boolean;
}

export default function DiscountSelector({
  serviceId,
  categoryId,
  originalPrice,
  onDiscountApplied,
  isServicePage = false
}: DiscountSelectorProps) {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [showDiscounts, setShowDiscounts] = useState(false);

  // Fetch available discounts
  useEffect(() => {
    // Skip for admin users
    if (isAdmin) {
      return;
    }

    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        setError(null);

        let url = '/api/discounts';
        if (categoryId) {
          url = `/api/discounts/category/${categoryId}`;
        }

        const response = await fetch(url);

        // Handle 404 errors gracefully
        if (response.status === 404) {
          console.log(`No discounts found for category: ${categoryId}`);
          setAvailableDiscounts([]);
          setLoading(false);
          return;
        }

        if (!response.ok) {
          console.warn(`Warning: Failed to fetch discounts for ${categoryId || 'all categories'}`);
          setAvailableDiscounts([]);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.success && data.discounts) {
          setAvailableDiscounts(data.discounts);

          // If there's only one discount and we're on a service page (not in booking flow),
          // automatically select it to show the user
          if (data.discounts.length === 1 && !onDiscountApplied) {
            setSelectedDiscount(data.discounts[0]);
          }
        } else {
          setAvailableDiscounts([]);
        }
      } catch (error) {
        // Log error but don't show to user
        console.warn('Warning: Error fetching discounts:', error);
        setAvailableDiscounts([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId || serviceId) {
      fetchDiscounts();
    }
  }, [categoryId, serviceId, onDiscountApplied, isAdmin]);

  // Apply discount
  const applyDiscount = async (discount: Discount) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/discounts/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          discountId: discount._id,
          serviceId,
          categoryId,
          originalPrice,
        }),
      });

      const data = await response.json();

      if (data.success && data.discount) {
        setAppliedDiscount(data.discount);
        if (onDiscountApplied) {
          onDiscountApplied(data.discount);
        }
      } else {
        setError(data.message || 'Failed to apply discount');
        setAppliedDiscount(null);
        if (onDiscountApplied) {
          onDiscountApplied(null);
        }
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      setError('Failed to apply discount');
      setAppliedDiscount(null);
      if (onDiscountApplied) {
        onDiscountApplied(null);
      }
    } finally {
      setLoading(false);
      setShowDiscounts(false);
    }
  };

  // Remove applied discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setSelectedDiscount(null);
    if (onDiscountApplied) {
      onDiscountApplied(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Auto-apply discount for service page if there's only one available
  useEffect(() => {
    // Skip for admin users
    if (isAdmin) {
      return;
    }

    if (isServicePage && selectedDiscount && !appliedDiscount) {
      applyDiscount(selectedDiscount);
    }
  }, [isServicePage, selectedDiscount, appliedDiscount, isAdmin]);

  // If we already have an applied discount from the parent component, don't show the selector
  if (appliedDiscount && isServicePage) {
    return (
      <div className="mt-4 mb-6">
        <div className="p-3 bg-green-50 border border-green-100 rounded-md">
          <div className="flex items-center">
            <FaTag className="text-green-500 mr-2" />
            <div>
              <p className="text-sm font-medium text-green-800">{appliedDiscount.name}</p>
              <p className="text-xs text-green-700">
                {appliedDiscount.savings} - You pay {appliedDiscount.formattedDiscountedPrice} instead of {appliedDiscount.formattedOriginalPrice}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show anything for admin users or if no discounts are available
  if (isAdmin || (availableDiscounts.length === 0 && !loading && !error)) {
    return null;
  }

  // Different UI for service page vs booking flow
  if (isServicePage) {
    return (
      <div className="mt-4 mb-6">
        {loading ? (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <p className="text-sm text-blue-700">Checking for available offers...</p>
            </div>
          </div>
        ) : appliedDiscount ? (
          <div className="p-3 bg-green-50 border border-green-100 rounded-md">
            <div className="flex items-center">
              <FaTag className="text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">{appliedDiscount.name}</p>
                <p className="text-xs text-green-700">
                  {appliedDiscount.savings} - You pay {appliedDiscount.formattedDiscountedPrice} instead of {appliedDiscount.formattedOriginalPrice}
                </p>
              </div>
            </div>
          </div>
        ) : availableDiscounts.length > 0 ? (
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-md cursor-pointer"
               onClick={() => applyDiscount(availableDiscounts[0])}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaTag className="text-blue-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800">{availableDiscounts[0].name}</p>
                  <p className="text-xs text-blue-700">
                    {availableDiscounts[0].discountType === 'percentage'
                      ? `${availableDiscounts[0].discountValue}% off`
                      : `₹${availableDiscounts[0].discountValue} off`}
                  </p>
                </div>
              </div>
              <button className="text-xs font-medium text-blue-700 hover:text-blue-900">
                APPLY
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center">
              <FaInfoCircle className="text-gray-500 mr-2" />
              <p className="text-sm text-gray-700">No offers available for this service at the moment.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original UI for booking flow
  return (
    <div className="mt-4 mb-6">
      {/* Discount Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <FaTag className="text-green-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Available Offers</h3>
        </div>

        {appliedDiscount ? (
          <button
            onClick={removeDiscount}
            className="text-sm text-red-600 hover:text-red-800 flex items-center"
            disabled={loading}
          >
            <FaTimes className="mr-1" /> Remove
          </button>
        ) : (
          <button
            onClick={() => setShowDiscounts(!showDiscounts)}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            {showDiscounts ? 'Hide Offers' : 'View Offers'}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <div className="flex items-center">
            <FaInfoCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Applied Discount */}
      {appliedDiscount && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 border border-green-200 bg-green-50 rounded-lg"
        >
          <div className="flex items-start">
            <div className="bg-green-100 p-2 rounded-full mr-3">
              {appliedDiscount.discountType === 'percentage' ? (
                <FaPercent className="text-green-600 h-5 w-5" />
              ) : (
                <FaRupeeSign className="text-green-600 h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-green-800">{appliedDiscount.name}</h4>
                  <p className="text-sm text-green-700 mt-1">{appliedDiscount.savings} applied</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 line-through">{appliedDiscount.formattedOriginalPrice}</div>
                  <div className="text-lg font-bold text-green-700">{appliedDiscount.formattedDiscountedPrice}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-green-600">
                You saved {appliedDiscount.formattedDiscountAmount}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Available Discounts List */}
      <AnimatePresence>
        {showDiscounts && !appliedDiscount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading available offers...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {availableDiscounts.map((discount) => (
                  <div
                    key={discount._id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => applyDiscount(discount)}
                  >
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        {discount.discountType === 'percentage' ? (
                          <FaPercent className="text-blue-600 h-5 w-5" />
                        ) : (
                          <FaRupeeSign className="text-blue-600 h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{discount.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {discount.discountType === 'percentage'
                            ? `${discount.discountValue}% off`
                            : `₹${discount.discountValue} off`}
                          {' on '}{discount.categoryName} services
                        </p>
                        {discount.description && (
                          <p className="text-xs text-gray-500 mt-1">{discount.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Valid till {formatDate(discount.endDate)}
                        </p>
                      </div>
                      <button className="ml-2 text-blue-600 hover:text-blue-800 font-medium text-sm">
                        APPLY
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
  );
}
