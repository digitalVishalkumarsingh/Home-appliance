"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { FaSave, FaArrowLeft, FaGift, FaUserPlus, FaUser, FaUsers } from "react-icons/fa";
import Link from "next/link";
import Swal from "sweetalert2";

interface SpecialOfferFormData {
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

export default function EditSpecialOfferPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingOffer, setFetchingOffer] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<SpecialOfferFormData>({
    defaultValues: {
      name: "",
      description: "",
      offerCode: "",
      discountType: "percentage",
      discountValue: 10,
      userType: "all",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      usageLimit: undefined,
      usagePerUser: undefined,
      isActive: true,
    },
  });

  const discountType = watch("discountType");
  const userType = watch("userType");
  const offerId = params.id as string;

  useEffect(() => {
    if (offerId) {
      fetchOfferDetails();
    }
  }, [offerId]);

  const fetchOfferDetails = async () => {
    try {
      setFetchingOffer(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(`/api/admin/special-offers/${offerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch offer details");
      }

      const data = await response.json();
      
      if (!data.specialOffer) {
        throw new Error("Offer not found");
      }

      // Format dates for the form
      const offer = {
        ...data.specialOffer,
        startDate: new Date(data.specialOffer.startDate).toISOString().split("T")[0],
        endDate: new Date(data.specialOffer.endDate).toISOString().split("T")[0],
      };

      // Reset form with fetched data
      reset(offer);
    } catch (error) {
      console.error("Error fetching offer details:", error);
      setError("Failed to load offer details. Please try again later.");
    } finally {
      setFetchingOffer(false);
    }
  };

  const onSubmit = async (data: SpecialOfferFormData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(`/api/admin/special-offers/${offerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update special offer");
      }

      Swal.fire({
        title: "Success!",
        text: "Special offer updated successfully",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/admin/special-offers");
    } catch (error) {
      console.error("Error updating special offer:", error);
      Swal.fire("Error!", "Failed to update special offer.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingOffer) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-600">Loading offer details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link
                href="/admin/special-offers"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaArrowLeft className="mr-2 -ml-1 h-4 w-4" />
                Back to Special Offers
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Special Offer
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Update the details of this special offer
          </p>
        </div>
        <Link
          href="/admin/special-offers"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaArrowLeft className="mr-2 -ml-1 h-5 w-5" />
          Back to Special Offers
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Offer Name */}
            <div className="col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Offer Name *
              </label>
              <input
                type="text"
                id="name"
                {...register("name", { required: "Offer name is required" })}
                className={`mt-1 block w-full border ${
                  errors.name ? "border-red-300" : "border-gray-300"
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="e.g., New User Welcome Discount"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Describe the special offer"
              ></textarea>
            </div>

            {/* Offer Code */}
            <div>
              <label
                htmlFor="offerCode"
                className="block text-sm font-medium text-gray-700"
              >
                Offer Code (Optional)
              </label>
              <input
                type="text"
                id="offerCode"
                {...register("offerCode")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="e.g., WELCOME10"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to automatically apply the offer
              </p>
            </div>

            {/* User Type */}
            <div>
              <label
                htmlFor="userType"
                className="block text-sm font-medium text-gray-700"
              >
                User Type *
              </label>
              <select
                id="userType"
                {...register("userType", { required: "User type is required" })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="new">New Users Only</option>
                <option value="existing">Existing Users Only</option>
                <option value="all">All Users</option>
              </select>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                {userType === "new" && (
                  <>
                    <FaUserPlus className="mr-1 h-4 w-4 text-green-500" />
                    <span>For users who just signed up</span>
                  </>
                )}
                {userType === "existing" && (
                  <>
                    <FaUser className="mr-1 h-4 w-4 text-blue-500" />
                    <span>For users who already have an account</span>
                  </>
                )}
                {userType === "all" && (
                  <>
                    <FaUsers className="mr-1 h-4 w-4 text-purple-500" />
                    <span>For all users regardless of account age</span>
                  </>
                )}
              </div>
            </div>

            {/* Discount Type */}
            <div>
              <label
                htmlFor="discountType"
                className="block text-sm font-medium text-gray-700"
              >
                Discount Type *
              </label>
              <select
                id="discountType"
                {...register("discountType", {
                  required: "Discount type is required",
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div>
              <label
                htmlFor="discountValue"
                className="block text-sm font-medium text-gray-700"
              >
                Discount Value *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  id="discountValue"
                  {...register("discountValue", {
                    required: "Discount value is required",
                    min: {
                      value: 0,
                      message: "Discount value must be positive",
                    },
                    max: {
                      value: discountType === "percentage" ? 100 : 10000,
                      message:
                        discountType === "percentage"
                          ? "Percentage cannot exceed 100%"
                          : "Amount cannot exceed ₹10,000",
                    },
                  })}
                  className={`block w-full border ${
                    errors.discountValue ? "border-red-300" : "border-gray-300"
                  } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  placeholder={discountType === "percentage" ? "10" : "500"}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {discountType === "percentage" ? "%" : "₹"}
                  </span>
                </div>
              </div>
              {errors.discountValue && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.discountValue.message}
                </p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700"
              >
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                {...register("startDate", { required: "Start date is required" })}
                className={`mt-1 block w-full border ${
                  errors.startDate ? "border-red-300" : "border-gray-300"
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700"
              >
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                {...register("endDate", { required: "End date is required" })}
                className={`mt-1 block w-full border ${
                  errors.endDate ? "border-red-300" : "border-gray-300"
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>

            {/* Usage Limit */}
            <div>
              <label
                htmlFor="usageLimit"
                className="block text-sm font-medium text-gray-700"
              >
                Total Usage Limit (Optional)
              </label>
              <input
                type="number"
                id="usageLimit"
                {...register("usageLimit", {
                  min: { value: 1, message: "Minimum usage limit is 1" },
                })}
                className={`mt-1 block w-full border ${
                  errors.usageLimit ? "border-red-300" : "border-gray-300"
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="e.g., 100"
              />
              {errors.usageLimit && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.usageLimit.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Maximum number of times this offer can be used in total
              </p>
            </div>

            {/* Usage Per User */}
            <div>
              <label
                htmlFor="usagePerUser"
                className="block text-sm font-medium text-gray-700"
              >
                Usage Limit Per User (Optional)
              </label>
              <input
                type="number"
                id="usagePerUser"
                {...register("usagePerUser", {
                  min: { value: 1, message: "Minimum usage per user is 1" },
                })}
                className={`mt-1 block w-full border ${
                  errors.usagePerUser ? "border-red-300" : "border-gray-300"
                } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                placeholder="e.g., 1"
              />
              {errors.usagePerUser && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.usagePerUser.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Maximum number of times a single user can use this offer
              </p>
            </div>

            {/* Active Status */}
            <div className="col-span-2">
              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  {...register("isActive")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Activate this offer
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/admin/special-offers")}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {loading ? (
                <>
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
                  Updating...
                </>
              ) : (
                <>
                  <FaSave className="mr-2 -ml-1 h-5 w-5" />
                  Update Offer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
