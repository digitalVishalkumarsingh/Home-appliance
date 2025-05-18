"use client";

import { useState, useEffect } from "react";
import { FaSpinner, FaSave, FaGlobe, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCog, FaMoneyBillWave } from "react-icons/fa";
import { toast } from "react-hot-toast";

interface Settings {
  _id?: string;
  siteName: string;
  siteEmail: string;
  contactPhone: string;
  address: string;
  serviceCharges: {
    acService: number;
    washingMachineService: number;
    refrigeratorService: number;
    microwaveService: number;
    tvService: number;
  };
  taxRate: number;
  paymentGateway: {
    razorpay: {
      enabled: boolean;
      keyId: string;
      keySecret: string;
      webhookSecret: string;
    };
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: "",
    siteEmail: "",
    contactPhone: "",
    address: "",
    serviceCharges: {
      acService: 0,
      washingMachineService: 0,
      refrigeratorService: 0,
      microwaveService: 0,
      tvService: 0,
    },
    taxRate: 0,
    paymentGateway: {
      razorpay: {
        enabled: false,
        keyId: "",
        keySecret: "",
        webhookSecret: "",
      },
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        return;
      }

      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch settings");
      }

      const data = await response.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
      } else {
        throw new Error(data.message || "Failed to fetch settings");
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      setError(error.message || "Failed to fetch settings");
      toast.error(error.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleServiceChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Parse the value as a float, defaulting to 0 if invalid
    const numericValue = parseFloat(value) || 0;

    // Update the settings state
    setSettings((prev) => ({
      ...prev,
      serviceCharges: {
        ...prev.serviceCharges,
        [name]: numericValue,
      },
    }));

    console.log(`Service charge updated: ${name} = ${numericValue}`);
  };

  const handleRazorpayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      paymentGateway: {
        ...prev.paymentGateway,
        razorpay: {
          ...prev.paymentGateway.razorpay,
          [name]: type === "checkbox" ? checked : value,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Log the settings being sent
      console.log("Sending settings update:", JSON.stringify(settings, null, 2));

      // Create a clean settings object to avoid any circular references
      const cleanSettings = {
        ...settings,
        serviceCharges: {
          acService: Number(settings.serviceCharges.acService),
          washingMachineService: Number(settings.serviceCharges.washingMachineService),
          refrigeratorService: Number(settings.serviceCharges.refrigeratorService),
          microwaveService: Number(settings.serviceCharges.microwaveService),
          tvService: Number(settings.serviceCharges.tvService),
        },
        taxRate: Number(settings.taxRate),
        paymentGateway: {
          razorpay: {
            enabled: Boolean(settings.paymentGateway.razorpay.enabled),
            keyId: String(settings.paymentGateway.razorpay.keyId || ""),
            keySecret: String(settings.paymentGateway.razorpay.keySecret || ""),
            webhookSecret: String(settings.paymentGateway.razorpay.webhookSecret || ""),
          }
        }
      };

      console.log("Clean settings object:", JSON.stringify(cleanSettings, null, 2));

      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanSettings),
      });

      // Parse the response
      const data = await response.json();

      // Log the response for debugging
      console.log("Settings update response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update settings");
      }

      if (data.success) {
        setSettings(data.settings);

        // Show success message
        if (activeTab === "services") {
          toast.success("Service charges updated successfully. All service prices have been updated.");
        } else {
          toast.success("Settings updated successfully");
        }
      } else {
        throw new Error(data.message || "Failed to update settings");
      }
    } catch (error: any) {
      console.error("Error updating settings:", error);

      // Provide more detailed error message
      let errorMessage = "Failed to update settings";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as any).message);
      }

      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage application settings and configurations
          </p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("general")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "general"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaGlobe className="inline-block mr-2" />
              General
            </button>
            <button
              onClick={() => setActiveTab("services")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "services"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaCog className="inline-block mr-2" />
              Service Charges
            </button>
            <button
              onClick={() => setActiveTab("payment")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "payment"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaMoneyBillWave className="inline-block mr-2" />
              Payment Gateway
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                    Site Name
                  </label>
                  <input
                    type="text"
                    name="siteName"
                    id="siteName"
                    value={settings.siteName}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="siteEmail" className="block text-sm font-medium text-gray-700">
                    Site Email
                  </label>
                  <input
                    type="email"
                    name="siteEmail"
                    id="siteEmail"
                    value={settings.siteEmail}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    id="contactPhone"
                    value={settings.contactPhone}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={settings.address}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    name="taxRate"
                    id="taxRate"
                    value={settings.taxRate}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {activeTab === "services" && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="acService" className="block text-sm font-medium text-gray-700">
                    AC Service Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="acService"
                    id="acService"
                    value={settings.serviceCharges.acService}
                    onChange={handleServiceChargeChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="washingMachineService" className="block text-sm font-medium text-gray-700">
                    Washing Machine Service Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="washingMachineService"
                    id="washingMachineService"
                    value={settings.serviceCharges.washingMachineService}
                    onChange={handleServiceChargeChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="refrigeratorService" className="block text-sm font-medium text-gray-700">
                    Refrigerator Service Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="refrigeratorService"
                    id="refrigeratorService"
                    value={settings.serviceCharges.refrigeratorService}
                    onChange={handleServiceChargeChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="microwaveService" className="block text-sm font-medium text-gray-700">
                    Microwave Service Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="microwaveService"
                    id="microwaveService"
                    value={settings.serviceCharges.microwaveService}
                    onChange={handleServiceChargeChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="tvService" className="block text-sm font-medium text-gray-700">
                    TV Service Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="tvService"
                    id="tvService"
                    value={settings.serviceCharges.tvService}
                    onChange={handleServiceChargeChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            {activeTab === "payment" && (
              <div className="space-y-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="enabled"
                    id="razorpayEnabled"
                    checked={settings.paymentGateway.razorpay.enabled}
                    onChange={handleRazorpayChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="razorpayEnabled" className="ml-2 block text-sm font-medium text-gray-700">
                    Enable Razorpay
                  </label>
                </div>
                <div>
                  <label htmlFor="keyId" className="block text-sm font-medium text-gray-700">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    name="keyId"
                    id="keyId"
                    value={settings.paymentGateway.razorpay.keyId}
                    onChange={handleRazorpayChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="keySecret" className="block text-sm font-medium text-gray-700">
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    name="keySecret"
                    id="keySecret"
                    value={settings.paymentGateway.razorpay.keySecret}
                    onChange={handleRazorpayChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="webhookSecret" className="block text-sm font-medium text-gray-700">
                    Razorpay Webhook Secret
                  </label>
                  <input
                    type="password"
                    name="webhookSecret"
                    id="webhookSecret"
                    value={settings.paymentGateway.razorpay.webhookSecret}
                    onChange={handleRazorpayChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
