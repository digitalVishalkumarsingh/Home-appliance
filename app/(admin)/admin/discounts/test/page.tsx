"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";

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
}

export default function TestDiscountsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all discounts from admin API
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/admin/login");
        return;
      }
      
      const response = await fetch("/api/admin/discounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch discounts");
      }
      
      const data = await response.json();
      
      if (data.success && data.discounts) {
        setDiscounts(data.discounts);
      } else {
        setDiscounts([]);
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
      setError("Failed to fetch discounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const seedDiscounts = async () => {
    try {
      setSeedLoading(true);
      setError(null);
      
      const response = await fetch("/api/admin/discounts/seed");
      
      if (!response.ok) {
        throw new Error("Failed to seed discounts");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTestResults(data);
        // Refresh discounts list
        fetchDiscounts();
      } else {
        setError(data.message || "Failed to seed discounts");
      }
    } catch (error) {
      console.error("Error seeding discounts:", error);
      setError("Failed to seed discounts. Please try again.");
    } finally {
      setSeedLoading(false);
    }
  };

  const testClientDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test the client-facing API
      const response = await fetch("/api/discounts");
      
      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to fetch client discounts");
      }
      
      const data = await response.json();
      
      setTestResults({
        clientTest: true,
        success: data.success,
        discounts: data.discounts || [],
        message: data.success 
          ? `Found ${data.discounts?.length || 0} active discounts for clients` 
          : "No active discounts found or API returned an error"
      });
    } catch (error) {
      console.error("Error testing client discounts:", error);
      setError("Failed to test client discounts. Please try again.");
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Test Discounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Test and verify discount functionality
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

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaTimes className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <button
              onClick={seedDiscounts}
              disabled={seedLoading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {seedLoading ? "Creating..." : "Create Test Discounts"}
            </button>
            
            <button
              onClick={testClientDiscounts}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Client Discounts API"}
            </button>
            
            <button
              onClick={fetchDiscounts}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Discounts"}
            </button>
          </div>

          {testResults && (
            <div className="mt-4 bg-blue-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-blue-800">Test Results</h3>
              <pre className="mt-2 text-sm text-blue-700 overflow-auto max-h-60">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Current Discounts</h3>
            
            {loading ? (
              <div className="mt-4 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : discounts.length === 0 ? (
              <p className="mt-4 text-gray-500">No discounts found. Create some test discounts to get started.</p>
            ) : (
              <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Value</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Validity</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {discounts.map((discount) => (
                      <tr key={discount._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {discount.name}
                          <div className="text-xs text-gray-500">{discount.description}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{discount.categoryName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {discount.discountType === "percentage" ? `${discount.discountValue}%` : `₹${discount.discountValue}`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {discount.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <FaCheck className="mr-1 h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <FaTimes className="mr-1 h-3 w-3" /> Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
