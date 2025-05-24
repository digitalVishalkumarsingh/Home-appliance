"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUserCog,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSave,
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import debounce from "lodash/debounce";

// Define the days of the week
const daysOfWeek = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Define service specializations
const serviceSpecializations = [
  "AC Repair",
  "Refrigerator",
  "Washing Machine",
  "Microwave",
  "TV Repair",
  "Water Purifier",
  "Geyser",
  "Dishwasher",
  "Air Cooler",
];

interface Availability {
  available: boolean;
  hours?: string;
}

interface Technician {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  status: "active" | "inactive";
  availability: {
    monday: Availability;
    tuesday: Availability;
    wednesday: Availability;
    thursday: Availability;
    friday: Availability;
    saturday: Availability;
    sunday: Availability;
  };
  address?: string;
  notes?: string;
}

export default function EditTechnicianPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Technician>({
    _id: "",
    name: "",
    email: "",
    phone: "",
    specializations: [],
    status: "active",
    availability: {
      monday: { available: true, hours: "9:00 AM - 6:00 PM" },
      tuesday: { available: true, hours: "9:00 AM - 6:00 PM" },
      wednesday: { available: true, hours: "9:00 AM - 6:00 PM" },
      thursday: { available: true, hours: "9:00 AM - 6:00 PM" },
      friday: { available: true, hours: "9:00 AM - 6:00 PM" },
      saturday: { available: true, hours: "9:00 AM - 6:00 PM" },
      sunday: { available: true, hours: "9:00 AM - 6:00 PM" },
    },
    address: "",
    notes: "",
  });

  const fetchTechnicianDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
      const response = await fetch(`${baseUrl}/admin/technicians/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch technician details");
      }

      const data = await response.json();
      if (data.success) {
        const technician = data.technician;
        // Ensure availability is fully populated
        const defaultAvailability = {
          monday: { available: true, hours: "9:00 AM - 6:00 PM" },
          tuesday: { available: true, hours: "9:00 AM - 6:00 PM" },
          wednesday: { available: true, hours: "9:00 AM - 6:00 PM" },
          thursday: { available: true, hours: "9:00 AM - 6:00 PM" },
          friday: { available: true, hours: "9:00 AM - 6:00 PM" },
          saturday: { available: true, hours: "9:00 AM - 6:00 PM" },
          sunday: { available: true, hours: "9:00 AM - 6:00 PM" },
        };
        technician.availability = {
          ...defaultAvailability,
          ...technician.availability,
        };
        setFormData(technician);
      } else {
        throw new Error(data.message || "Failed to fetch technician details");
      }
    } catch (error) {
      console.error("Error fetching technician details:", error);
      const message = error instanceof Error ? error.message : "Failed to load technician details";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchTechnicianDetails();
    }
  }, [params.id, fetchTechnicianDetails]);

  const debouncedHandleChange = useCallback(
    debounce((name: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }, 300),
    [setFormData]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    debouncedHandleChange(name, value);
  };

  const handleSpecializationChange = useCallback((specialization: string) => {
    setFormData((prev) => {
      const specializations = prev.specializations.includes(specialization)
        ? prev.specializations.filter((s) => s !== specialization)
        : [...prev.specializations, specialization];
      return { ...prev, specializations };
    });
  }, []);

  const handleAvailabilityChange = useCallback(
    (day: string, field: "available" | "hours", value: boolean | string) => {
      setFormData((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          [day]: {
            ...prev.availability[day as keyof typeof prev.availability],
            [field]: value,
            ...(field === "available" && !value && { hours: "" }), // Clear hours if not available
          },
        },
      }));
    },
    []
  );

  const validateForm = useCallback(() => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) return "Invalid email format";
    if (!formData.phone.match(/^\d{10}$/)) return "Phone number must be 10 digits";
    if (formData.specializations.length === 0) return "At least one specialization is required";
    for (const day of daysOfWeek) {
      const availability = formData.availability[day as keyof typeof formData.availability];
      if (availability.available && !availability.hours?.match(/^\d{1,2}:\d{2}\s[AP]M\s-\s\d{1,2}:\d{2}\s[AP]M$/)) {
        return `Invalid hours format for ${day}`;
      }
    }
    return null;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setSaving(true);

        const validationError = validateForm();
        if (validationError) {
          toast.error(validationError);
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
        const response = await fetch(`${baseUrl}/admin/technicians/${params.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update technician");
        }

        const data = await response.json();
        if (data.success) {
          toast.success("Technician updated successfully");
          router.push(`/admin/technicians/${params.id}`);
        } else {
          throw new Error(data.message || "Failed to update technician");
        }
      } catch (error) {
        console.error("Error updating technician:", error);
        const message = error instanceof Error ? error.message : "Failed to update technician";
        toast.error(message);
      } finally {
        setSaving(false);
      }
    },
    [formData, params.id, router, validateForm]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" aria-hidden="true" />
        <span className="sr-only">Loading technician details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md" role="alert">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Link
                href="/admin/technicians"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                aria-label="Back to technicians list"
              >
                <FaArrowLeft className="mr-2 -ml-1 h-4 w-4" aria-hidden="true" />
                Back to Technicians
              </Link>
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
          <h1 className="text-2xl font-semibold text-gray-900">Edit Technician</h1>
          <p className="mt-1 text-sm text-gray-500">Update technician information</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href={`/admin/technicians/${params.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Back to technician details"
          >
            <FaArrowLeft className="mr-2 -ml-1 h-5 w-5 text-gray-500" aria-hidden="true" />
            Back to Details
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
            <div className="mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserCog className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full Name"
                    aria-label="Technician name"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email Address"
                    aria-label="Technician email"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone Number"
                    pattern="\d{10}"
                    aria-label="Technician phone number"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  aria-label="Technician status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Full Address"
                    aria-label="Technician address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Specializations</h3>
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Select the services this technician can handle <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {serviceSpecializations.map((specialization) => (
                  <div key={specialization} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={`specialization-${specialization}`}
                        type="checkbox"
                        checked={formData.specializations.includes(specialization)}
                        onChange={() => handleSpecializationChange(specialization)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        aria-label={`Toggle ${specialization} specialization`}
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
          </div>

          {/* Availability */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Availability</h3>
            <div className="mt-4 space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-full sm:w-1/4">
                    <div className="flex items-center">
                      <input
                        id={`available-${day}`}
                        type="checkbox"
                        checked={formData.availability[day as keyof typeof formData.availability].available}
                        onChange={(e) => handleAvailabilityChange(day, "available", e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        aria-label={`Toggle availability for ${day}`}
                      />
                      <label
                        htmlFor={`available-${day}`}
                        className="ml-2 block text-sm font-medium text-gray-700 capitalize"
                      >
                        {day}
                      </label>
                    </div>
                  </div>
                  <div className="w-full sm:w-3/4">
                    <label htmlFor={`hours-${day}`} className="sr-only">
                      Hours for {day}
                    </label>
                    <input
                      type="text"
                      id={`hours-${day}`}
                      value={formData.availability[day as keyof typeof formData.availability].hours || ""}
                      onChange={(e) => handleAvailabilityChange(day, "hours", e.target.value)}
                      disabled={!formData.availability[day as keyof typeof formData.availability].available}
                      className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="e.g. 9:00 AM - 6:00 PM"
                      pattern="\d{1,2}:\d{2}\s[AP]M\s-\s\d{1,2}:\d{2}\s[AP]M"
                      aria-label={`Availability hours for ${day}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Notes</h3>
            <div className="mt-4">
              <label htmlFor="notes" className="sr-only">
                Additional notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes || ""}
                onChange={handleChange}
                className="block w-full sm:text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information about this technician..."
                aria-label="Additional notes about technician"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/admin/technicians/${params.id}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Cancel editing"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            aria-label="Save technician changes"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}