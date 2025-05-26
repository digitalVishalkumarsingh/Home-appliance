"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaUserCog,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSave,
  FaArrowLeft,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

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

const initialFormData: Technician = {
  name: "",
  email: "",
  phone: "",
  specializations: [],
  status: "active",
  availability: {
    monday: { available: true, hours: "00:00 - 23:59" },
    tuesday: { available: true, hours: "00:00 - 23:59" },
    wednesday: { available: true, hours: "00:00 - 23:59" },
    thursday: { available: true, hours: "00:00 - 23:59" },
    friday: { available: true, hours: "00:00 - 23:59" },
    saturday: { available: true, hours: "00:00 - 23:59" },
    sunday: { available: true, hours: "00:00 - 23:59" },
  },
  address: "",
  notes: "",
};

export default function AddTechnicianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Technician>(initialFormData);
  const [showDebug, setShowDebug] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    if (!formData.email.trim()) return "Email is required";
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return "Invalid email format";
    if (!formData.phone.trim()) return "Phone number is required";
    if (!formData.phone.match(/^\d{10}$/)) return "Phone number must be exactly 10 digits";
    if (formData.specializations.length === 0) return "At least one specialization is required";

    // Validate availability hours (more flexible format)
    for (const day of daysOfWeek) {
      const availability = formData.availability[day as keyof typeof formData.availability];
      if (availability.available && availability.hours && availability.hours.trim()) {
        // Allow more flexible time formats
        const timePattern = /^.+\s*-\s*.+$/; // Basic format: something - something
        if (!timePattern.test(availability.hours.trim())) {
          return `Please enter valid hours for ${day} (e.g., "00:00 - 23:59" for 24/7 service)`;
        }
      }
    }
    return null;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        setLoading(true);
        console.log("Form submission started", formData);

        // Validate form
        const validationError = validateForm();
        if (validationError) {
          console.log("Validation error:", validationError);
          toast.error(validationError);
          return;
        }

        console.log("Form validation passed");

        // Prepare data for submission
        const submitData = {
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          address: formData.address?.trim() || "",
          notes: formData.notes?.trim() || "",
        };

        console.log("Submitting data:", submitData);

        const response = await fetch(`/api/admin/technicians`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
          body: JSON.stringify(submitData),
        });

        console.log("Response status:", response.status);

        let data;
        let errorMessage = "Failed to create technician";

        // First check if response is ok, then try to parse JSON
        if (!response.ok) {
          try {
            data = await response.json();
            errorMessage = data.message || `Server error: ${response.status}`;
          } catch (parseError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
          console.log("Error response:", { status: response.status, data });
          throw new Error(errorMessage);
        }

        // Response is ok, now parse JSON
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Could not parse success response as JSON:", parseError);
          throw new Error("Invalid response format from server");
        }
        console.log("Success response:", data);

        if (data.success) {
          let message = data.message || "Technician created successfully!";

          // Show additional info if email wasn't configured
          if (!data.emailConfigured) {
            message += " (Email not configured - check console for setup instructions)";
          }

          toast.success(message);
          console.log("Technician creation response:", data);

          // Log email setup instructions if needed
          if (data.instructions) {
            console.log("Email setup instructions:", data.instructions);
          }

          router.push("/admin/technicians");
        } else {
          throw new Error(data.message || "Failed to add technician");
        }
      } catch (error) {
        console.error("Error adding technician:", error);
        const message = error instanceof Error ? error.message : "Failed to add technician";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [formData, router, validateForm]
  );

  const fillTestData = () => {
    setFormData({
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "9876543210",
      specializations: ["AC Repair", "Refrigerator"],
      status: "active",
      availability: {
        monday: { available: true, hours: "00:00 - 23:59" },
        tuesday: { available: true, hours: "00:00 - 23:59" },
        wednesday: { available: true, hours: "00:00 - 23:59" },
        thursday: { available: true, hours: "00:00 - 23:59" },
        friday: { available: true, hours: "00:00 - 23:59" },
        saturday: { available: true, hours: "00:00 - 23:59" },
        sunday: { available: true, hours: "00:00 - 23:59" },
      },
      address: "123 Main Street, City, State",
      notes: "Experienced technician with 24/7 availability and 5+ years experience",
    });
    toast.success("Test data filled!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Add New Technician</h1>
            <p className="mt-1 text-sm text-gray-600">Create a new technician profile and set up their account</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              type="button"
              onClick={fillTestData}
              className="px-3 py-2 border border-green-300 rounded text-sm text-green-700 bg-green-50 hover:bg-green-100"
            >
              Fill Test Data
            </button>
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              {showDebug ? "Hide" : "Show"} Debug
            </button>
            <Link
              href="/admin/technicians"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
              aria-label="Back to technicians list"
            >
              <FaArrowLeft className="mr-2 h-4 w-4 text-gray-500" aria-hidden="true" />
              Back to Technicians
            </Link>
          </div>
        </div>
      </div>

      {/* Debug Section */}
      {showDebug && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Information</h3>
          <div className="text-xs text-yellow-700">
            <p><strong>Form Valid:</strong> {validateForm() ? "❌ " + validateForm() : "✅ Valid"}</p>
            <p><strong>Name:</strong> "{formData.name}" (length: {formData.name.length})</p>
            <p><strong>Email:</strong> "{formData.email}" (length: {formData.email.length})</p>
            <p><strong>Phone:</strong> "{formData.phone}" (length: {formData.phone.length})</p>
            <p><strong>Specializations:</strong> {formData.specializations.length} selected: [{formData.specializations.join(", ")}]</p>
            <p><strong>Available Days:</strong> {Object.entries(formData.availability).filter(([_, avail]) => avail.available).length} days</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded">
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <div className="flex items-center mb-4">
              <FaUserCog className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-600">Enter the technician's personal details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserCog className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter full name"
                    aria-label="Technician name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter email address"
                    aria-label="Technician email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter 10-digit phone number"
                    pattern="\d{10}"
                    aria-label="Technician phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-900 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  aria-label="Technician status"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-2">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter full address"
                    aria-label="Technician address"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Specializations */}
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FaUserCog className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Service Specializations</h3>
                <p className="text-sm text-gray-600">Select the services this technician can handle <span className="text-red-500">*</span></p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceSpecializations.map((specialization) => (
                <div key={specialization} className="relative">
                  <label
                    htmlFor={`specialization-${specialization}`}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.specializations.includes(specialization)
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      id={`specialization-${specialization}`}
                      type="checkbox"
                      checked={formData.specializations.includes(specialization)}
                      onChange={() => handleSpecializationChange(specialization)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                      aria-label={`Toggle ${specialization} specialization`}
                    />
                    <span className="text-sm font-medium">{specialization}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <FaPhone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weekly Availability</h3>
                <p className="text-sm text-gray-600">Set working hours for each day of the week</p>
              </div>
            </div>
            <div className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-full sm:w-1/4">
                      <label
                        htmlFor={`available-${day}`}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.availability[day as keyof typeof formData.availability].available
                            ? "border-green-500 bg-green-50 text-green-900"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          id={`available-${day}`}
                          type="checkbox"
                          checked={formData.availability[day as keyof typeof formData.availability].available}
                          onChange={(e) => handleAvailabilityChange(day, "available", e.target.checked)}
                          className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mr-3"
                          aria-label={`Toggle availability for ${day}`}
                        />
                        <span className="text-sm font-medium capitalize">{day}</span>
                      </label>
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm"
                        placeholder="e.g. 00:00 - 23:59 (24/7 service)"
                        pattern="\d{2}:\d{2}\s-\s\d{2}:\d{2}"
                        aria-label={`Availability hours for ${day}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <FaMapMarkerAlt className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Additional Notes</h3>
                <p className="text-sm text-gray-600">Any additional information about this technician</p>
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="sr-only">
                Additional notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes || ""}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                placeholder="Enter any additional information about this technician, special skills, certifications, etc..."
                aria-label="Additional notes about technician"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="text-red-500">*</span> Required fields
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => router.push("/admin/technicians")}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              aria-label="Cancel adding technician"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
              aria-label="Save new technician"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-4 w-4" aria-hidden="true" />
                  Creating...
                </>
              ) : (
                <>
                  <FaSave className="mr-2 h-4 w-4" aria-hidden="true" />
                  Create Technician
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}