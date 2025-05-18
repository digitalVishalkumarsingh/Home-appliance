"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaSave, FaTimes } from "react-icons/fa";
import Link from "next/link";
import Swal from "sweetalert2";

interface ServiceFormData {
  id: string;
  title: string;
  desc: string;
  img: string;
  details: string[];
  benefits: string[];
  pricing: {
    basic: { price: string; description: string };
    comprehensive: { price: string; description: string };
  };
}

export default function NewServicePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ServiceFormData>({
    id: "",
    title: "",
    desc: "",
    img: "",
    details: ["", "", ""],
    benefits: ["", "", ""],
    pricing: {
      basic: { price: "599", description: "Basic service package" },
      comprehensive: { price: "999", description: "Comprehensive service package" },
    },
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayChange = (
    type: "details" | "benefits",
    index: number,
    value: string
  ) => {
    setFormData((prev) => {
      const newArray = [...prev[type]];
      newArray[index] = value;
      return {
        ...prev,
        [type]: newArray,
      };
    });
  };

  const handlePricingChange = (
    type: "basic" | "comprehensive",
    field: "price" | "description",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [type]: {
          ...prev.pricing[type],
          [field]: value,
        },
      },
    }));
  };

  const addArrayItem = (type: "details" | "benefits") => {
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ""],
    }));
  };

  const removeArrayItem = (type: "details" | "benefits", index: number) => {
    setFormData((prev) => {
      const newArray = [...prev[type]];
      newArray.splice(index, 1);
      return {
        ...prev,
        [type]: newArray,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form data
      if (!formData.id || !formData.title || !formData.desc) {
        Swal.fire({
          title: "Error",
          text: "Please fill in all required fields",
          icon: "error",
        });
        setLoading(false);
        return;
      }

      // Format pricing data
      const formattedData = {
        ...formData,
        pricing: {
          basic: {
            ...formData.pricing.basic,
            price: formData.pricing.basic.price.startsWith("₹")
              ? formData.pricing.basic.price
              : `₹${formData.pricing.basic.price}`,
          },
          comprehensive: {
            ...formData.pricing.comprehensive,
            price: formData.pricing.comprehensive.price.startsWith("₹")
              ? formData.pricing.comprehensive.price
              : `₹${formData.pricing.comprehensive.price}`,
          },
        },
        // Filter out empty array items
        details: formData.details.filter((item) => item.trim() !== ""),
        benefits: formData.benefits.filter((item) => item.trim() !== ""),
      };

      // Create service
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create service");
      }

      Swal.fire({
        title: "Success",
        text: "Service created successfully",
        icon: "success",
      }).then(() => {
        router.push("/admin/services");
      });
    } catch (error) {
      console.error("Error creating service:", error);
      Swal.fire({
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to create service",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Add New Service</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create a new service with pricing and details
          </p>
        </div>
        <Link
          href="/admin/services"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaTimes className="mr-2 -ml-1 h-5 w-5" />
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="id"
              className="block text-sm font-medium text-gray-700"
            >
              Service ID*
            </label>
            <input
              type="text"
              name="id"
              id="id"
              value={formData.id}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="ac-repair"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Unique identifier for the service (e.g., ac-repair)
            </p>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Service Title*
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="AC Repair & Services"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="desc"
              className="block text-sm font-medium text-gray-700"
            >
              Description*
            </label>
            <textarea
              name="desc"
              id="desc"
              rows={3}
              value={formData.desc}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="Service description"
              required
            ></textarea>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="img"
              className="block text-sm font-medium text-gray-700"
            >
              Image URL
            </label>
            <input
              type="text"
              name="img"
              id="img"
              value={formData.img}
              onChange={handleChange}
              className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
              placeholder="/service-image.jpg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to use default placeholder image
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Details
            </label>
            {formData.details.map((detail, index) => (
              <div key={`detail-${index}`} className="flex mb-2">
                <input
                  type="text"
                  value={detail}
                  onChange={(e) =>
                    handleArrayChange("details", index, e.target.value)
                  }
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder={`Detail ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("details", index)}
                  className="ml-2 inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem("details")}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Detail
            </button>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Benefits
            </label>
            {formData.benefits.map((benefit, index) => (
              <div key={`benefit-${index}`} className="flex mb-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) =>
                    handleArrayChange("benefits", index, e.target.value)
                  }
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder={`Benefit ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("benefits", index)}
                  className="ml-2 inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem("benefits")}
              className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Benefit
            </button>
          </div>

          <div className="sm:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Basic Service
                </h4>
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
                      value={formData.pricing.basic.price}
                      onChange={(e) =>
                        handlePricingChange("basic", "price", e.target.value)
                      }
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="599"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.pricing.basic.description}
                    onChange={(e) =>
                      handlePricingChange("basic", "description", e.target.value)
                    }
                    rows={2}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Basic service description"
                  ></textarea>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-medium text-gray-700 mb-2">
                  Comprehensive Service
                </h4>
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
                      value={formData.pricing.comprehensive.price}
                      onChange={(e) =>
                        handlePricingChange(
                          "comprehensive",
                          "price",
                          e.target.value
                        )
                      }
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="999"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.pricing.comprehensive.description}
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
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? (
              <span className="inline-flex items-center">
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
              <>
                <FaSave className="mr-2 -ml-1 h-5 w-5" />
                Create Service
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
