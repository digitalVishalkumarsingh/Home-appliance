"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FaSpinner, FaRedo } from "react-icons/fa";

interface DiscountDetailClientProps {
  id: string;
}

export default function DiscountDetailClient({ id }: DiscountDetailClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkAdminAuth = useCallback(async () => {
    try {
      if (typeof window === "undefined") {
        return;
      }

      setLoadingProgress(10);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in as admin.");
      }

      setLoadingProgress(50);

      // Validate token with API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      setIsLoading(false);

      // Redirect to edit page after successful authentication
      router.push(`/admin/discounts/${id}/edit`);
    } catch (err) {
      console.error("Error checking admin auth:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate. Please try again.");
      toast.error(err instanceof Error ? err.message : "Authentication failed.", {
        duration: 4000,
      });
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    checkAdminAuth();
    const toastId = toast.loading("Verifying access to discount details...");
    return () => {
      toast.dismiss(toastId);
    };
  }, [checkAdminAuth]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing discount details...</p>
          <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {loadingProgress < 50 ? "Checking authentication..." : "Validating admin access..."}
          </p>
        </div>
      </div>
    );
  }

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
              <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLoading(true);
                    setError(null);
                    setLoadingProgress(0);
                    checkAdminAuth();
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

  // Render a redirecting state (briefly visible before router.push)
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to discount edit page...</p>
      </div>
    </div>
  );
}