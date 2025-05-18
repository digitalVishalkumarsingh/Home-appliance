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
  FaGift,
  FaUser,
  FaUsers,
  FaUserPlus,
} from "react-icons/fa";
import Link from "next/link";
import Swal from "sweetalert2";

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
  createdAt: string;
  updatedAt: string;
}

export default function SpecialOffersPage() {
  const router = useRouter();
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSpecialOffers();
  }, []);

  const fetchSpecialOffers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch("/api/admin/special-offers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch special offers");
      }

      const data = await response.json();
      setSpecialOffers(data.specialOffers || []);
    } catch (error) {
      console.error("Error fetching special offers:", error);
      setError("Failed to load special offers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(`/api/admin/special-offers/${id}/toggle-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update offer status");
      }

      // Update local state
      setSpecialOffers((prev) =>
        prev.map((offer) =>
          offer._id === id ? { ...offer, isActive: !currentStatus } : offer
        )
      );

      Swal.fire({
        title: "Success!",
        text: `Offer ${!currentStatus ? "activated" : "deactivated"} successfully`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error toggling offer status:", error);
      Swal.fire("Error!", "Failed to update offer status.", "error");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    try {
      // Confirm deletion
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      });

      if (!result.isConfirmed) {
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(`/api/admin/special-offers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete offer");
      }

      // Update local state
      setSpecialOffers((prev) => prev.filter((offer) => offer._id !== id));

      Swal.fire({
        title: "Deleted!",
        text: "Special offer has been deleted.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error deleting offer:", error);
      Swal.fire("Error!", "Failed to delete offer.", "error");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "new":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaUserPlus className="mr-1 h-3 w-3" /> New Users
          </span>
        );
      case "existing":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaUser className="mr-1 h-3 w-3" /> Existing Users
          </span>
        );
      case "all":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <FaUsers className="mr-1 h-3 w-3" /> All Users
          </span>
        );
      default:
        return userType;
    }
  };

  const filteredOffers = specialOffers.filter(
    (offer) =>
      offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (offer.offerCode && offer.offerCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Special Offers</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage special discount offers for new and existing users
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            href="/admin/special-offers/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaPlus className="mr-2 -ml-1 h-5 w-5" />
            Add New Offer
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
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading special offers...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchSpecialOffers}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="p-8 text-center">
            <FaGift className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-4 text-gray-600">
              {searchTerm
                ? "No special offers match your search."
                : "No special offers found. Create your first offer!"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Search
              </button>
            )}
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
                    Offer Details
                  </th>
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
                    User Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Validity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffers.map((offer) => (
                  <tr key={offer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-indigo-100 rounded-full">
                          <FaGift className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {offer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {offer.description}
                          </div>
                          {offer.offerCode && (
                            <div className="text-xs mt-1 inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                              Code: {offer.offerCode}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {offer.discountType === "percentage"
                          ? `${offer.discountValue}%`
                          : `₹${offer.discountValue}`}
                      </div>
                      {offer.usageLimit && (
                        <div className="text-xs text-gray-500">
                          Limit: {offer.usageLimit} uses
                          {offer.usagePerUser && ` (${offer.usagePerUser} per user)`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getUserTypeLabel(offer.userType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(offer.startDate)} - {formatDate(offer.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {offer.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleActive(offer._id, offer.isActive)}
                          className={`text-${
                            offer.isActive ? "green" : "gray"
                          }-600 hover:text-${
                            offer.isActive ? "green" : "gray"
                          }-900`}
                          title={offer.isActive ? "Deactivate" : "Activate"}
                        >
                          {offer.isActive ? (
                            <FaToggleOn className="h-5 w-5" />
                          ) : (
                            <FaToggleOff className="h-5 w-5" />
                          )}
                        </button>
                        <Link
                          href={`/admin/special-offers/${offer._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Offer"
                        >
                          <FaEdit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteOffer(offer._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Offer"
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
