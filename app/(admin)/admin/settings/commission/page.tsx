"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import CommissionSettings from "@/app/components/admin/CommissionSettings";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import Link from "next/link";

export default function AdminCommissionSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (!token || !userStr) {
        throw new Error("Please login to access admin settings");
      }

      const user = JSON.parse(userStr);
      if (user.role !== "admin") {
        throw new Error("Unauthorized access");
      }

      setLoading(false);
    } catch (error) {
      console.error("Authentication error:", error);
      setError(error instanceof Error ? error.message : "Authentication error");
      toast.error(error instanceof Error ? error.message : "Authentication error. Please login again.");
      router.push("/admin/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" aria-hidden="true" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <Link
            href="/admin/login"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commission Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage technician commission rates and view history
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/settings"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Back to settings"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" aria-hidden="true" />
            Back to Settings
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <CommissionSettings />

        <section className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Commission Impact Analysis</h2>
            <p className="mt-1 text-sm text-gray-500">
              Understand how commission rates affect technician earnings and platform revenue
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <article className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h3 className="text-sm font-medium text-green-800">Platform Revenue</h3>
                <p className="mt-1 text-xs text-green-600">
                  Higher commission rates increase platform revenue but may reduce technician satisfaction.
                </p>
              </article>

              <article className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="text-sm font-medium text-blue-800">Technician Earnings</h3>
                <p className="mt-1 text-xs text-blue-600">
                  Lower commission rates increase technician earnings and may attract more skilled technicians.
                </p>
              </article>

              <article className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h3 className="text-sm font-medium text-purple-800">Customer Pricing</h3>
                <p className="mt-1 text-xs text-purple-600">
                  Commission rates don&apos;t directly affect customer pricing but may influence service quality.
                </p>
              </article>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recommended Commission Ranges</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <ul className="text-xs text-gray-600 space-y-2" role="list">
                  <li>
                    <span className="font-medium">15-20%</span>: Highly competitive, maximizes technician satisfaction
                  </li>
                  <li>
                    <span className="font-medium">20-25%</span>: Balanced approach, good for growth phase
                  </li>
                  <li>
                    <span className="font-medium">25-30%</span>: Industry standard, sustainable business model
                  </li>
                  <li>
                    <span className="font-medium">30-35%</span>: Higher platform revenue, may require additional technician incentives
                  </li>
                  <li>
                    <span className="font-medium">35%+</span>: Premium model, requires exceptional platform value and support
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}