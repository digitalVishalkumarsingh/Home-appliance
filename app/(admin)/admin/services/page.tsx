"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaRupeeSign,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";

interface Service {
  _id: string;
  id: string;
  title: string;
  desc: string;
  img: string;
  details?: string[];
  benefits?: string[];
  pricing?: {
    basic: { price: string; description: string };
    comprehensive: { price: string; description: string };
  };
  testimonial?: { text: string; author: string };
  isActive?: boolean;
}

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string>("");
  const [pricingData, setPricingData] = useState({
    basic: { price: "", description: "" },
    comprehensive: { price: "", description: "" },
  });

  const fetchServices = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${baseUrl}/admin/services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store", // Ensure fresh data for serverless
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch services");
      }

      const data = await response.json();
      setServices(data.services || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching services:", error);
      Swal.fire({
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to fetch services",
        icon: "error",
      });
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteService = useCallback(
    async (id: string) => {
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

        if (result.isConfirmed) {
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("Authentication token not found");
          }

          const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
          const response = await fetch(`${baseUrl}/admin/services/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete service");
          }

          setServices((prev) => prev.filter((service) => service._id !== id));
          await Swal.fire({
            title: "Deleted!",
            text: "Service has been deleted.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        Swal.fire({
          title: "Error!",
          text: error instanceof Error ? error.message : "Failed to delete service",
          icon: "error",
        });
      }
    },
    []
  );

  const openPricingModal = useCallback((service: Service) => {
    setCurrentServiceId(service._id);
    setPricingData({
      basic: {
        price: service.pricing?.basic.price.replace("₹", "") || "",
        description: service.pricing?.basic.description || "",
      },
      comprehensive: {
        price: service.pricing?.comprehensive.price.replace("₹", "") || "",
        description: service.pricing?.comprehensive.description || "",
      },
    });
    setShowPricingModal(true);
  }, []);

  const handlePricingChange = useCallback(
    (type: "basic" | "comprehensive", field: "price" | "description", value: string) => {
      if (field === "price" && value !== "" && !/^\d+$/.test(value)) {
        return; // Skip update if price is not a valid number
      }
      setPricingData((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value,
        },
      }));
    },
    []
  );

  const savePricing = useCallback(async () => {
    try {
      if (!pricingData.basic.price || !pricingData.comprehensive.price) {
        Swal.fire({
          title: "Error",
          text: "Please provide valid prices for both Basic and Comprehensive plans",
          icon: "error",
        });
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const formattedPricing = {
        basic: {
          price: pricingData.basic.price.startsWith("₹")
            ? pricingData.basic.price
            : `₹${pricingData.basic.price}`,
          description: pricingData.basic.description,
        },
        comprehensive: {
          price: pricingData.comprehensive.price.startsWith("₹")
            ? pricingData.comprehensive.price
            : `₹${pricingData.comprehensive.price}`,
          description: pricingData.comprehensive.description,
        },
      };

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${baseUrl}/admin/services/${currentServiceId}/pricing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pricing: formattedPricing }),
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update pricing");
      }

      setServices((prev) =>
        prev.map((service) =>
          service._id === currentServiceId
            ? { ...service, pricing: formattedPricing }
            : service
        )
      );

      setShowPricingModal(false);
      await Swal.fire({
        title: "Success!",
        text: "Pricing has been updated.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error updating pricing:", error);
      Swal.fire({
        title: "Error!",
        text: error instanceof Error ? error.message : "Failed to update pricing",
        icon: "error",
      });
    }
  }, [currentServiceId, pricingData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all services and pricing</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/services/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
            Add New Service
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search services..."
                value={searchTerm}
                onChange={handleSearch}
                aria-label="Search services"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Basic Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Comprehensive Price
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
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No services found.
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          <Image
                            src={service.img || "/placeholder-service.jpg"}
                            alt={service.title}
                            fill
                            className="rounded-md object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{service.title}</div>
                          <div className="text-sm text-gray-500">ID: {service.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {service.desc}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.pricing?.basic.price || "Not set"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.pricing?.comprehensive.price || "Not set"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openPricingModal(service)}
                          className="text-green-600 hover:text-green-900"
                          title="Manage Pricing"
                          aria-label={`Manage pricing for ${service.title}`}
                        >
                          <FaRupeeSign />
                        </button>
                        <Link
                          href={`/admin/services/${service._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Service"
                          aria-label={`Edit ${service.title}`}
                        >
                          <FaEdit />
                        </Link>
                        <button
                          onClick={() => handleDeleteService(service._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Service"
                          aria-label={`Delete ${service.title}`}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Pricing</h3>
              <button
                onClick={() => setShowPricingModal(false)}
                className="text-gray-400 hover:text-gray-500"
                aria-label="Close pricing modal"
              >
                <FaTimes className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Basic Service</h4>
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="basic-price"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Price
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="text"
                        id="basic-price"
                        value={pricingData.basic.price}
                        onChange={(e) => handlePricingChange("basic", "price", e.target.value)}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="599"
                        aria-label="Basic service price"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="basic-description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="basic-description"
                      value={pricingData.basic.description}
                      onChange={(e) =>
                        handlePricingChange("basic", "description", e.target.value)
                      }
                      rows={2}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Basic service description"
                      aria-label="Basic service description"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Comprehensive Service</h4>
                <div className="space-y-2">
                  <div>
                    <label
                      htmlFor="comprehensive-price"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Price
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="text"
                        id="comprehensive-price"
                        value={pricingData.comprehensive.price}
                        onChange={(e) =>
                          handlePricingChange("comprehensive", "price", e.target.value)
                        }
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="999"
                        aria-label="Comprehensive service price"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="comprehensive-description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="comprehensive-description"
                      value={pricingData.comprehensive.description}
                      onChange={(e) =>
                        handlePricingChange("comprehensive", "description", e.target.value)
                      }
                      rows={2}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Comprehensive service description"
                      aria-label="Comprehensive service description"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={() => setShowPricingModal(false)}
                aria-label="Cancel pricing changes"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={savePricing}
                aria-label="Save pricing changes"
              >
                <FaSave className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                Save Pricing
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}