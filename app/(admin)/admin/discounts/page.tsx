"use client";

import { useState, useEffect } from "react";
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
} from "react-icons/fa";
import Link from "next/link";
import Swal from "sweetalert2";

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
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
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
      setDiscounts(data.discounts);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredDiscounts = discounts.filter(
    (discount) =>
      discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      discount.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteDiscount = async (id: string) => {
    try {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const token = localStorage.getItem("token");
          const response = await fetch(`/api/admin/discounts/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to delete discount");
          }

          // Remove the discount from the state
          setDiscounts(discounts.filter((discount) => discount._id !== id));

          Swal.fire("Deleted!", "Discount has been deleted.", "success");
        }
      });
    } catch (error) {
      console.error("Error deleting discount:", error);
      Swal.fire("Error!", "Failed to delete discount.", "error");
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      // Confirm with the user
      const result = await Swal.fire({
        title: `${discount.isActive ? 'Deactivate' : 'Activate'} Discount?`,
        text: `Are you sure you want to ${discount.isActive ? 'deactivate' : 'activate'} "${discount.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: discount.isActive ? '#d33' : '#3085d6',
        cancelButtonColor: '#6b7280',
        confirmButtonText: `Yes, ${discount.isActive ? 'deactivate' : 'activate'} it!`
      });

      if (!result.isConfirmed) {
        return;
      }

      const token = localStorage.getItem("token");

      // Use the new toggle endpoint
      const response = await fetch(`/api/admin/discounts/${discount._id}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update discount status");
      }

      const data = await response.json();

      // Update the discount in the state
      setDiscounts(
        discounts.map((d) =>
          d._id === discount._id ? { ...d, isActive: !d.isActive } : d
        )
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Discounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all discounts and offers
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/admin/discounts/test"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPercent className="mr-2 -ml-1 h-5 w-5" />
            Test Discounts
          </Link>
          <Link
            href="/admin/discounts/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2 -ml-1 h-5 w-5" />
            Add New Discount
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search discounts..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading discounts...</p>
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-600">No discounts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Discount
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDiscounts.map((discount) => (
                  <tr key={discount._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaPercent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {discount.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {discount.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{discount.categoryName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {discount.discountType === "percentage"
                          ? `${discount.discountValue}%`
                          : `₹${discount.discountValue}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(discount)}
                          className={`${
                            discount.isActive
                              ? "text-green-600 hover:text-green-900"
                              : "text-red-600 hover:text-red-900"
                          }`}
                          title={discount.isActive ? "Deactivate" : "Activate"}
                        >
                          {discount.isActive ? <FaToggleOn className="h-5 w-5" /> : <FaToggleOff className="h-5 w-5" />}
                        </button>
                        <Link
                          href={`/admin/discounts/${discount._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Discount"
                        >
                          <FaEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteDiscount(discount._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Discount"
                        >
                          <FaTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
