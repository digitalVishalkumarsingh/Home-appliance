"use client";

import { useState, useEffect } from "react";
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
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [currentServiceId, setCurrentServiceId] = useState<string>("");
  const [pricingData, setPricingData] = useState({
    basic: { price: "", description: "" },
    comprehensive: { price: "", description: "" },
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/admin/services", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data = await response.json();
      setServices(data.services);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching services:", error);
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteService = async (id: string) => {
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
          const response = await fetch(`/api/admin/services/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to delete service");
          }

          // Remove the service from the state
          setServices(services.filter((service) => service._id !== id));

          Swal.fire("Deleted!", "Service has been deleted.", "success");
        }
      });
    } catch (error) {
      console.error("Error deleting service:", error);
      Swal.fire("Error!", "Failed to delete service.", "error");
    }
  };

  const openPricingModal = (service: Service) => {
    setCurrentServiceId(service._id);
    setPricingData({
      basic: {
        price: service.pricing?.basic.price || "",
        description: service.pricing?.basic.description || "",
      },
      comprehensive: {
        price: service.pricing?.comprehensive.price || "",
        description: service.pricing?.comprehensive.description || "",
      },
    });
    setShowPricingModal(true);
  };

  const handlePricingChange = (
    type: "basic" | "comprehensive",
    field: "price" | "description",
    value: string
  ) => {
    setPricingData({
      ...pricingData,
      [type]: {
        ...pricingData[type],
        [field]: value,
      },
    });
  };

  const savePricing = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/services/${currentServiceId}/pricing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pricing: pricingData }),
      });

      if (!response.ok) {
        throw new Error("Failed to update pricing");
      }

      // Update the service in the state
      setServices(
        services.map((service) =>
          service._id === currentServiceId
            ? { ...service, pricing: pricingData }
            : service
        )
      );

      setShowPricingModal(false);
      Swal.fire("Success!", "Pricing has been updated.", "success");
    } catch (error) {
      console.error("Error updating pricing:", error);
      Swal.fire("Error!", "Failed to update pricing.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all services and pricing
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/services/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2 -ml-1 h-5 w-5" />
            Add New Service
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search services..."
                value={searchTerm}
                onChange={handleSearch}
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
              {filteredServices.map((service) => (
                <tr key={service._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <Image
                          src={service.img || "/placeholder-service.jpg"}
                          alt={service.title}
                          fill
                          className="rounded-md object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {service.title}
                        </div>
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
                      >
                        <FaRupeeSign />
                      </button>
                      <Link
                        href={`/admin/services/${service._id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Service"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleDeleteService(service._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Service"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Pricing</h3>
              <button
                onClick={() => setShowPricingModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Basic Service</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="text"
                        value={pricingData.basic.price}
                        onChange={(e) =>
                          handlePricingChange("basic", "price", e.target.value)
                        }
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="599"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={pricingData.basic.description}
                      onChange={(e) =>
                        handlePricingChange("basic", "description", e.target.value)
                      }
                      rows={2}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Basic service description"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Comprehensive Service
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="text"
                        value={pricingData.comprehensive.price}
                        onChange={(e) =>
                          handlePricingChange("comprehensive", "price", e.target.value)
                        }
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="999"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={pricingData.comprehensive.description}
                      onChange={(e) =>
                        handlePricingChange(
                          "comprehensive",
                          "description",
                          e.target.value
                        )
                      }
                      rows={2}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Comprehensive service description"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex justify-end">
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-3"
                onClick={() => setShowPricingModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={savePricing}
              >
                <FaSave className="mr-2 -ml-1 h-5 w-5" />
                Save Pricing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
