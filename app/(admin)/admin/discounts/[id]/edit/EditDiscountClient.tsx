"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FaSave, FaArrowLeft, FaSpinner, FaRedo } from "react-icons/fa";
import Link from "next/link";
import Swal from "sweetalert2";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface DiscountFormData {
  name: string;
  description: string;
  categoryId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface EditDiscountClientProps {
  id: string;
}

export default function EditDiscountClient({ id }: EditDiscountClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<DiscountFormData>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      discountType: "percentage",
      discountValue: 10,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
    },
  });

  const discountType = watch("discountType");
  const startDate = watch("startDate");

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setLoadingProgress(20);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch categories: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.categories)) {
        throw new Error("Invalid categories response.");
      }

      setCategories(data.categories);
      setLoadingProgress(40);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch categories.");
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchDiscount = useCallback(async () => {
    try {
      setInitialLoading(true);
      setLoadingProgress(60);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }

      // Validate token with API
      const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!verifyResponse.ok) {
        throw new Error("Invalid or expired token.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discounts/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch discount: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.discount) {
        throw new Error("Invalid discount response.");
      }

      const discount = data.discount;
      const formattedDiscount = {
        ...discount,
        startDate: new Date(discount.startDate).toISOString().split("T")[0],
        endDate: new Date(discount.endDate).toISOString().split("T")[0],
      };

      reset(formattedDiscount);
      setLoadingProgress(100);
    } catch (error) {
      console.error("Error fetching discount:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch discount details.");
      Swal.fire("Error!", "Failed to fetch discount details.", "error");
      router.push("/admin/discounts");
    } finally {
      setInitialLoading(false);
    }
  }, [id, reset, router]);

  const onSubmit = async (data: DiscountFormData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update discount: ${response.status}`);
      }

      Swal.fire({
        title: "Success!",
        text: "Discount updated successfully",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/admin/discounts");
    } catch (error) {
      console.error("Error updating discount:", error);
      Swal.fire("Error!", "Failed to update discount.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDiscount();
  }, [fetchCategories, fetchDiscount]);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading discount details...</p>
          <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {loadingProgress < 40 ? "Fetching categories..." : "Fetching discount details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setInitialLoading(true);
                  setError(null);
                  setLoadingProgress(0);
                  fetchCategories();
                  fetchDiscount();
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaRedo className="mr-2" /> Retry
              </button>
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
          <h1 className="text-2xl font-semibold text-gray-900">Edit Discount</h1>
          <p className="mt-1 text-sm text-gray-500">Update discount details</p>
        </div>
        <Link
          href="/admin/discounts"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaArrowLeft className="mr-2 -ml-1 h-5 w-5" />
          Back to Discounts
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Discount Name *
              </label>
              <input
                type="text"
                id="name"
                {...register("name", { required: "Discount name is required" })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Summer Special Offer"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                Service Category *
              </label>
              <select
                id="categoryId"
                {...register("categoryId", { required: "Service category is required" })}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                {loadingCategories ? (
                  <option value="" disabled>
                    Loading categories...
                  </option>
                ) : categories.length === 0 ? (
                  <option value="" disabled>
                    No categories available
                  </option>
                ) : (
                  categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
            </div>

            <div>
              <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">
                Discount Type *
              </label>
              <select
                id="discountType"
                {...register("discountType", { required: "Discount type is required" })}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
              {errors.discountType && <p className="mt-1 text-sm text-red-600">{errors.discountType.message}</p>}
            </div>

            <div>
              <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">
                Discount Value *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{discountType === "percentage" ? "%" : "₹"}</span>
                </div>
                <input
                  type="number"
                  id="discountValue"
                  {...register("discountValue", {
                    required: "Discount value is required",
                    min: { value: 0, message: "Discount value must be positive" },
                    max: {
                      value: discountType === "percentage" ? 100 : 10000,
                      message: discountType === "percentage" ? "Percentage cannot exceed 100%" : "Fixed amount cannot exceed ₹10,000",
                    },
                  })}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder={discountType === "percentage" ? "10" : "100"}
                />
              </div>
              {errors.discountValue && <p className="mt-1 text-sm text-red-600">{errors.discountValue.message}</p>}
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                {...register("startDate", {
                  required: "Start date is required",
                  validate: (value) => {
                    const today = new Date().toISOString().split("T")[0];
                    return value >= today || "Start date cannot be in the past";
                  },
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                {...register("endDate", {
                  required: "End date is required",
                  validate: (value) => value > startDate || "End date must be after start date",
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={3}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Special discount for summer season"
              ></textarea>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="isActive"
                    type="checkbox"
                    {...register("isActive")}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isActive" className="font-medium text-gray-700">
                    Active
                  </label>
                  <p className="text-gray-500">Enable this discount immediately</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/admin/discounts")}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Updating...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaSave className="mr-2 -ml-1 h-5 w-5" />
                  Update Discount
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}