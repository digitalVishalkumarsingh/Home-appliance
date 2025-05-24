"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FaSpinner,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  
  FaSave,

  FaExclamationTriangle,
 
} from "react-icons/fa";
import AvailabilityToggle from "@/app/components/technician/AvailabilityToggle";

interface TechnicianSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  specializations: string[];
  serviceRadius: number;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  profileVisibility: "public" | "private";
}

export default function TechnicianSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<TechnicianSettings>({
    name: "",
    email: "",
    phone: "",
    address: "",
    specializations: [],
    serviceRadius: 10,
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
    },
    profileVisibility: "public",
  });

  // Available specializations
  const availableSpecializations = [
    "AC Repair",
    "Refrigerator Repair",
    "Washing Machine Repair",
    "Microwave Repair",
    "TV Repair",
    "Water Purifier",
    "Geyser/Water Heater",
    "Air Cooler",
    "Dishwasher",
    "General Appliances"
  ];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      toast.error("Please login to access settings");
      router.push("/login");
      return;
    }

    // Parse user data
    try {
      const user = JSON.parse(userStr);
      if (user.role !== "technician") {
        toast.error("Unauthorized access");
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      toast.error("Authentication error. Please login again.");
      router.push("/login");
      return;
    }

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Fetch technician settings
      const response = await fetch("/api/technicians/settings", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // If settings not found, use default values from state
          setLoading(false);
          return;
        }
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.settings) {
        setSettings({
          name: data.settings.name || "",
          email: data.settings.email || "",
          phone: data.settings.phone || "",
          address: data.settings.address || "",
          specializations: data.settings.specializations || [],
          serviceRadius: data.settings.serviceRadius || 10,
          notificationPreferences: {
            email: data.settings.notificationPreferences?.email ?? true,
            sms: data.settings.notificationPreferences?.sms ?? true,
            push: data.settings.notificationPreferences?.push ?? true,
          },
          profileVisibility: data.settings.profileVisibility || "public",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load settings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please log in again.");
        return;
      }

      // Validate settings
      if (!settings.name || !settings.email || !settings.phone) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Save settings
      const response = await fetch("/api/technicians/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success("Settings saved successfully");
      } else {
        toast.error(data.message || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSpecializationToggle = (specialization: string) => {
    setSettings(prev => {
      const specializations = [...prev.specializations];
      if (specializations.includes(specialization)) {
        return {
          ...prev,
          specializations: specializations.filter(s => s !== specialization)
        };
      } else {
        return {
          ...prev,
          specializations: [...specializations, specialization]
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile and preferences
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
          <FaExclamationTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Availability Settings</h2>
          <p className="mt-1 text-sm text-gray-500">
            Control your availability for new job offers
          </p>
          
          <div className="mt-4">
            <AvailabilityToggle />
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update your personal and contact information
          </p>
          
          <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="serviceRadius" className="block text-sm font-medium text-gray-700">
                Service Radius (km)
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  id="serviceRadius"
                  min="1"
                  max="50"
                  value={settings.serviceRadius}
                  onChange={(e) => setSettings({ ...settings, serviceRadius: parseInt(e.target.value) || 10 })}
                  className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum distance you're willing to travel for service calls
              </p>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  rows={3}
                  className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your full address"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Specializations</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select the services you can provide
          </p>
          
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {availableSpecializations.map((specialization) => (
              <div key={specialization} className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id={`specialization-${specialization}`}
                    type="checkbox"
                    checked={settings.specializations.includes(specialization)}
                    onChange={() => handleSpecializationToggle(specialization)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`specialization-${specialization}`} className="font-medium text-gray-700">
                    {specialization}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose how you want to receive notifications
          </p>
          
          <div className="mt-4 space-y-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications-email"
                  type="checkbox"
                  checked={settings.notificationPreferences.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notificationPreferences: {
                      ...settings.notificationPreferences,
                      email: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notifications-email" className="font-medium text-gray-700">Email</label>
                <p className="text-gray-500">Get notified about new job offers via email</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications-sms"
                  type="checkbox"
                  checked={settings.notificationPreferences.sms}
                  onChange={(e) => setSettings({
                    ...settings,
                    notificationPreferences: {
                      ...settings.notificationPreferences,
                      sms: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notifications-sms" className="font-medium text-gray-700">SMS</label>
                <p className="text-gray-500">Receive text messages for urgent job offers</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications-push"
                  type="checkbox"
                  checked={settings.notificationPreferences.push}
                  onChange={(e) => setSettings({
                    ...settings,
                    notificationPreferences: {
                      ...settings.notificationPreferences,
                      push: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notifications-push" className="font-medium text-gray-700">Push Notifications</label>
                <p className="text-gray-500">Get real-time alerts on your device</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="-ml-1 mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
