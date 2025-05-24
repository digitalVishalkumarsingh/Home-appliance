"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FaSave, FaArrowLeft } from "react-icons/fa";
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

export default function NewDiscountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DiscountFormData>({
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      discountType: "percentage",
      discountValue: 10,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      isActive: true,
    },
  });

  const discountType = watch("discountType");

  useEffect(() => {
    // Use a try-catch block to handle any errors during initialization
    try {
      fetchCategories();
    } catch (error) {
      console.error("Error in useEffect:", error);
      // Set default categories as fallback
      const defaultCategories = [
        { _id: "ac-services", name: "AC Services", slug: "ac-services" },
        { _id: "washing-machine-services", name: "Washing Machine Services", slug: "washing-machine-services" },
        { _id: "refrigerator-services", name: "Refrigerator Services", slug: "refrigerator-services" },
        { _id: "microwave-services", name: "Microwave Services", slug: "microwave-services" },
        { _id: "tv-services", name: "TV Services", slug: "tv-services" },
      ];
      setCategories(defaultCategories);
      setLoadingCategories(false);
    }
  }, [fetchCategories]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/services/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      if (data.success && data.categories) {
        setCategories(data.categories || []);
      } else {
        // If no categories found, use default ones
        const defaultCategories = [
          { _id: "ac-services", name: "AC Services", slug: "ac-services" },
          { _id: "washing-machine-services", name: "Washing Machine Services", slug: "washing-machine-services" },
          { _id: "refrigerator-services", name: "Refrigerator Services", slug: "refrigerator-services" },
          { _id: "microwave-services", name: "Microwave Services", slug: "microwave-services" },
          { _id: "tv-services", name: "TV Services", slug: "tv-services" },
        ];
        setCategories(defaultCategories);
      }

      setLoadingCategories(false);
    } catch (error) {
      console.error("Error fetching categories:", error);

      // Fallback to default categories
      const defaultCategories = [
        { _id: "ac-services", name: "AC Services", slug: "ac-services" },
        { _id: "washing-machine-services", name: "Washing Machine Services", slug: "washing-machine-services" },
        { _id: "refrigerator-services", name: "Refrigerator Services", slug: "refrigerator-services" },
        { _id: "microwave-services", name: "Microwave Services", slug: "microwave-services" },
        { _id: "tv-services", name: "TV Services", slug: "tv-services" },
      ];
      setCategories(defaultCategories);
      setLoadingCategories(false);
    }
  }, [router]);

  const onSubmit = async (data: DiscountFormData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create discount");
      }

      Swal.fire({
        title: "Success!",
        text: "Discount created successfully",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/admin/discounts");
    } catch (error) {
      console.error("Error creating discount:", error);
      Swal.fire("Error!", "Failed to create discount.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Create New Discount
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new discount or offer for a service category
          </p>
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
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Discount Name *
              </label>
              <input
                type="text"
                id="name"
                {...register("name", { required: "Discount name is required" })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                placeholder="Summer Special Offer"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700"
              >
                Service Category *
              </label>
              <select
                id="categoryId"
                {...register("categoryId", {
                  required: "Service category is required",
                })}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a category</option>
                {loadingCategories ? (
                  <option value="" disabled>
                    Loading categories...
                  </option>
                ) : (
                  categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.categoryId.message}
                </p>
              )}
            </div>

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
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
              {errors.discountType && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.discountType.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="discountValue"
                className="block text-sm font-medium text-gray-700"
              >
                Discount Value *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {discountType === "percentage" ? "%" : "₹"}
                  </span>
                </div>
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
                          : "Fixed amount cannot exceed ₹10,000",
                    },
                  })}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder={discountType === "percentage" ? "10" : "100"}
                />
              </div>
              {errors.discountValue && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.discountValue.message}
                </p>
              )}
            </div>

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
                {...register("startDate", {
                  required: "Start date is required",
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.startDate.message}
                </p>
              )}
            </div>

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
                {...register("endDate", {
                  required: "End date is required",
                })}
                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.endDate.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
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
                  <label
                    htmlFor="isActive"
                    className="font-medium text-gray-700"
                  >
                    Active
                  </label>
                  <p className="text-gray-500">
                    Enable this discount immediately
                  </p>
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
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
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
                  Creating...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaSave className="mr-2 -ml-1 h-5 w-5" />
                  Create Discount
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
