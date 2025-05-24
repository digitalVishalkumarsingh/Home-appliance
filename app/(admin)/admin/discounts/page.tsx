"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPercent,
  FaCalendarAlt,
  FaToggleOn,
  FaToggleOff,
  FaRedo,
} from "react-icons/fa";
import Link from "next/link";
import Swal from "sweetalert2";
import { toast } from "react-hot-toast";
import debounce from "lodash.debounce";
import { ErrorBoundary } from "react-error-boundary";

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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const checkAdminAuth = useCallback(async () => {
    try {
      setLoadingProgress(10);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Authentication token not found. Please log in as admin.");
      }

      setLoadingProgress(50);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Invalid or expired token: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error("Token verification failed.");
      }

      setLoadingProgress(100);
      return true;
    } catch (err) {
      console.error("Error checking admin auth:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate. Please try again.");
      toast.error(err instanceof Error ? err.message : "Authentication failed.", {
        duration: 4000,
      });
      return false;
    }
  }, []);

  const fetchDiscounts = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setLoading(true);
        setLoadingProgress(10);

        const token = localStorage.getItem("token");
        setLoadingProgress(50);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discounts?page=${pageNum}&limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch discounts: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to fetch discounts.");
        }

        setDiscounts((prev) => (append ? [...prev, ...data.discounts] : data.discounts));
        setHasMore(data.discounts.length === 10); // Assume 10 is the limit
        setLoadingProgress(100);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching discounts:", error);
        setError(error instanceof Error ? error.message : "Failed to fetch discounts.");
        toast.error(error instanceof Error ? error.message : "Failed to fetch discounts.", {
          duration: 4000,
        });
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const initialize = async () => {
      const isAuthenticated = await checkAdminAuth();
      if (!isAuthenticated) {
        router.push("/admin/login");
        return;
      }
      await fetchDiscounts(1);
    };

    initialize();
    const toastId = toast.loading("Loading discounts...");
    return () => toast.dismiss(toastId);
  }, [checkAdminAuth, fetchDiscounts, router]);

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
      fetchDiscounts(page + 1, true);
    }
  };

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page on search
    fetchDiscounts(1); // Refetch with search term if API supports it
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const filteredDiscounts = discounts.filter(
    (discount) =>
      discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteDiscount = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (!result.isConfirmed) return;

      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discounts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete discount: ${response.status}`);
      }

      setDiscounts(discounts.filter((discount) => discount._id !== id));
      Swal.fire("Deleted!", "Discount has been deleted.", "success");
    } catch (error) {
      console.error("Error deleting discount:", error);
      Swal.fire("Error!", "Failed to delete discount.", "error");
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      const result = await Swal.fire({
        title: `${discount.isActive ? "Deactivate" : "Activate"} Discount?`,
        text: `Are you sure you want to ${discount.isActive ? "deactivate" : "activate"} "${discount.name}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: discount.isActive ? "#d33" : "#3085d6",
        cancelButtonColor: "#6b7280",
        confirmButtonText: `Yes, ${discount.isActive ? "deactivate" : "activate"} it!`,
      });

      if (!result.isConfirmed) return;

      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/discounts/${discount._id}/toggle`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update discount status: ${response.status}`);
      }

      const data = await response.json();
      setDiscounts(
        discounts.map((d) => (d._id === discount._id ? { ...d, isActive: !d.isActive } : d))
      );

      Swal.fire({
        title: "Success!",
        text: data.message || `Discount ${discount.isActive ? "deactivated" : "activated"} successfully.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error updating discount:", error);
      Swal.fire("Error!", "Failed to update discount status.", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
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
            <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error.message}</p>
            </div>
            <div className="mt-4 flex space-x-4">
              <button
                type="button"
                onClick={resetErrorBoundary}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaRedo className="mr-2 h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md w-full">
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
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    setLoadingProgress(0);
                    checkAdminAuth().then((isAuthenticated) => {
                      if (isAuthenticated) fetchDiscounts(1);
                      else router.push("/admin/login");
                    });
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaRedo className="mr-2 h-4 w-4" aria-hidden="true" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/admin/login")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setError(null);
        setLoading(true);
        setLoadingProgress(0);
        checkAdminAuth().then((isAuthenticated) => {
          if (isAuthenticated) fetchDiscounts(1);
          else router.push("/admin/login");
        });
      }}
    >
      <motion.div
        className="space-y-6 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        role="main"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Discounts</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all discounts and offers</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link
              href="/admin/discounts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
              Add New Discount
            </Link>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="relative flex-grow">
              <label htmlFor="search" className="sr-only">
                Search discounts
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search discounts..."
                onChange={handleSearch}
                aria-label="Search discounts by name or category"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading discounts...</p>
              <div className="mt-2 w-48 bg-gray-200 rounded-full h-2 mx-auto">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {loadingProgress < 50 ? "Checking authentication..." : "Fetching discounts..."}
              </p>
            </div>
          ) : filteredDiscounts.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-gray-600">No discounts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" role="grid">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      role="columnheader"
                    >
                      Discount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      role="columnheader"
                    >
                      Category
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      role="columnheader"
                    >
                      Value
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      role="columnheader"
                    >
                      Duration
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      role="columnheader"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      role="columnheader"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDiscounts.map((discount) => (
                    <motion.tr
                      key={discount._id}
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      role="row"
                    >
                      <td className="px-6 py-4 whitespace-nowrap" role="cell">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaPercent className="h-5 w-5 text-blue-600" aria-hidden="true" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{discount.name}</div>
                            <div className="text-sm text-gray-500">{discount.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" role="cell">
                        <div className="text-sm text-gray-900">{discount.categoryName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" role="cell">
                        <div className="text-sm text-gray-900">
                          {discount.discountType === "percentage"
                            ? `${discount.discountValue}%`
                            : `₹${discount.discountValue}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" role="cell">
                        <div className="text-sm text-gray-900 flex items-center">
                          <FaCalendarAlt
                            className="mr-2 h-4 w-4 text-gray-500"
                            aria-hidden="true"
                          />
                          {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" role="cell">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            discount.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {discount.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                        role="cell"
                      >
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleToggleActive(discount)}
                            className={`${
                              discount.isActive
                                ? "text-green-600 hover:text-green-900"
                                : "text-red-600 hover:text-red-900"
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            title={discount.isActive ? "Deactivate Discount" : "Activate Discount"}
                            aria-label={discount.isActive ? "Deactivate Discount" : "Activate Discount"}
                          >
                            {discount.isActive ? (
                              <FaToggleOn className="h-5 w-5" aria-hidden="true" />
                            ) : (
                              <FaToggleOff className="h-5 w-5" aria-hidden="true" />
                            )}
                          </button>
                          <Link
                            href={`/admin/discounts/${discount._id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Edit Discount"
                            aria-label="Edit Discount"
                          >
                            <FaEdit className="h-5 w-5" aria-hidden="true" />
                          </Link>
                          <button
                            onClick={() => handleDeleteDiscount(discount._id)}
                            className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title="Delete Discount"
                            aria-label="Delete Discount"
                          >
                            <FaTrash className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading ? (
                      <FaRedo className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <FaPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </ErrorBoundary>
  );
}