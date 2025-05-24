"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FaUser,
  
  FaTools,
  FaIdCard,
  FaCalendarAlt,
  FaSpinner,
  FaCamera,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaUpload,
  FaEdit,
  FaLock,
  FaShieldAlt,
  FaFileAlt,
  FaGraduationCap,
  FaUserCog,
} from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

interface Technician {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  specializations: string[];
  skills?: string[];
  address?: string;
  location?: {
    address: string;
    coordinates?: [number, number];
    serviceRadius?: number;
  };
  availability?: {
    monday?: { available: boolean; hours?: string };
    tuesday?: { available: boolean; hours?: string };
    wednesday?: { available: boolean; hours?: string };
    thursday?: { available: boolean; hours?: string };
    friday?: { available: boolean; hours?: string };
    saturday?: { available: boolean; hours?: string };
    sunday?: { available: boolean; hours?: string };
  };
  profileImage?: string;
  governmentId?: string;
  certifications?: string[];
  rating?: number;
  completedBookings?: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function TechnicianProfilePage() {
  const router = useRouter();
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal"); // personal, skills, availability, documents
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Technician | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [governmentIdFile, setGovernmentIdFile] = useState<File | null>(null);
  const [certificationFiles, setCertificationFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // List of available specializations and skills
  const availableSpecializations = [
    "AC Repair",
    "Refrigerator Repair",
    "Washing Machine Repair",
    "TV Repair",
    "Microwave Repair",
    "Water Purifier",
    "Geyser/Water Heater",
    "Air Cooler",
    "Dishwasher",
    "Kitchen Appliances",
  ];

  const availableSkills = [
    "Electrical Troubleshooting",
    "Mechanical Repairs",
    "Component Replacement",
    "Diagnostics",
    "Preventive Maintenance",
    "Installation",
    "Gas Refilling",
    "Circuit Board Repair",
    "Plumbing",
    "Customer Service",
  ];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      toast.error("Please login to access your profile");
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

    fetchTechnicianProfile();
  }, [router]);

  const fetchTechnicianProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch("/api/technician/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTechnician(data.technician);
        setFormData(data.technician);
      } else {
        throw new Error(data.message || "Failed to fetch profile");
      }
    } catch (error: any) {
      console.error("Error fetching technician profile:", error);
      setError(error.message || "Failed to load profile. Please try again.");

      
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSpecializationChange = (specialization: string) => {
    if (!formData) return;

    const updatedSpecializations = formData.specializations.includes(specialization)
      ? formData.specializations.filter((s) => s !== specialization)
      : [...formData.specializations, specialization];

    setFormData({
      ...formData,
      specializations: updatedSpecializations,
    });
  };

  const handleSkillChange = (skill: string) => {
    if (!formData) return;

    const updatedSkills = formData.skills?.includes(skill)
      ? formData.skills.filter((s) => s !== skill)
      : [...(formData.skills || []), skill];

    setFormData({
      ...formData,
      skills: updatedSkills,
    });
  };

  const handleAvailabilityChange = (
    day: string,
    field: "available" | "hours",
    value: boolean | string
  ) => {
    if (!formData || !formData.availability) return;

    setFormData({
      ...formData,
      availability: {
        ...formData.availability,
        [day]: {
          ...formData.availability[day as keyof typeof formData.availability],
          [field]: value,
        },
      },
    });
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGovernmentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setGovernmentIdFile(e.target.files[0]);
    }
  };

  const handleCertificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificationFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // First, upload any files if needed
      let profileImageUrl = formData.profileImage;
      let governmentIdUrl = formData.governmentId;
      let certificationUrls = formData.certifications || [];

      // In a real implementation, you would upload files to a server or cloud storage
      // For this demo, we'll simulate successful uploads
      if (profileImageFile) {
        setIsUploading(true);
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        profileImageUrl = profileImagePreview ?? undefined;
        setIsUploading(false);
      }

      // Update profile data
      const updatedTechnician = {
        ...formData,
        profileImage: profileImageUrl,
        governmentId: governmentIdUrl,
        certifications: certificationUrls,
      };

      const response = await fetch("/api/technician/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedTechnician),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTechnician(updatedTechnician);
        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating technician profile:", error);
      setError(error.message || "Failed to update profile. Please try again.");
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Technician Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information, skills, and availability
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="flex-shrink-0 h-20 w-20 rounded-full overflow-hidden bg-gray-100 mr-4">
              {technician?.profileImage ? (
                <img
                  src={technician.profileImage}
                  alt={technician.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <FaUser className="h-10 w-10" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{technician?.name}</h2>
              <div className="mt-1 flex items-center">
                <span className="text-sm text-gray-500 mr-2">Rating:</span>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(technician?.rating || 0)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 15.934l-6.18 3.254 1.18-6.875L.5 7.914l6.902-1.004L10 .686l2.598 6.224 6.902 1.004-4.5 4.399 1.18 6.875L10 15.934z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ))}
                  <span className="ml-1 text-sm text-gray-600">
                    {technician?.rating?.toFixed(1) || "N/A"}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {technician?.completedBookings || 0} jobs completed
              </p>
            </div>
          </div>
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaEdit className="mr-2 -ml-1 h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(technician);
                    setProfileImagePreview(null);
                    setProfileImageFile(null);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaTimes className="mr-2 -ml-1 h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? (
                    <FaSpinner className="animate-spin mr-2 -ml-1 h-4 w-4" />
                  ) : (
                    <FaSave className="mr-2 -ml-1 h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("personal")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "personal"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaUser className="inline-block mr-2 h-4 w-4" />
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "skills"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaTools className="inline-block mr-2 h-4 w-4" />
              Skills & Specializations
            </button>
            <button
              onClick={() => setActiveTab("availability")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "availability"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaCalendarAlt className="inline-block mr-2 h-4 w-4" />
              Availability
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaFileAlt className="inline-block mr-2 h-4 w-4" />
              Documents
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Personal Information Tab */}
          {activeTab === "personal" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              {isEditing ? (
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData?.name || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData?.email || ""}
                        readOnly
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData?.phone || ""}
                        onChange={handleInputChange}
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
                        value={formData?.address || ""}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                    <div className="mt-1 flex items-center">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 mr-4">
                        {profileImagePreview ? (
                          <img
                            src={profileImagePreview}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                        ) : technician?.profileImage ? (
                          <img
                            src={technician.profileImage}
                            alt={technician.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-100 text-blue-600">
                            <FaUser className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="profile-image"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaCamera className="mr-2 -ml-1 h-4 w-4" />
                        Change Image
                        <input
                          id="profile-image"
                          name="profile-image"
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                      <p className="mt-1 text-lg text-gray-900">{technician?.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Email Address</h4>
                      <p className="mt-1 text-lg text-gray-900">{technician?.email}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                      <p className="mt-1 text-lg text-gray-900">{technician?.phone}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                      <p className="mt-1 text-lg text-gray-900">{technician?.address || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills & Specializations Tab */}
          {activeTab === "skills" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Skills & Specializations</h3>
              {isEditing ? (
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specializations
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableSpecializations.map((specialization) => (
                        <div key={specialization} className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`specialization-${specialization}`}
                              name={`specialization-${specialization}`}
                              type="checkbox"
                              checked={formData?.specializations.includes(specialization)}
                              onChange={() => handleSpecializationChange(specialization)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor={`specialization-${specialization}`}
                              className="font-medium text-gray-700"
                            >
                              {specialization}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skills
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableSkills.map((skill) => (
                        <div key={skill} className="relative flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`skill-${skill}`}
                              name={`skill-${skill}`}
                              type="checkbox"
                              checked={formData?.skills?.includes(skill)}
                              onChange={() => handleSkillChange(skill)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label
                              htmlFor={`skill-${skill}`}
                              className="font-medium text-gray-700"
                            >
                              {skill}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {technician?.specializations.map((specialization) => (
                        <span
                          key={specialization}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {specialization}
                        </span>
                      ))}
                      {technician?.specializations.length === 0 && (
                        <p className="text-gray-500 text-sm">No specializations added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {technician?.skills?.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {!technician?.skills || technician.skills.length === 0 ? (
                        <p className="text-gray-500 text-sm">No skills added yet</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === "availability" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
              {isEditing ? (
                <form className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                      (day) => (
                        <div key={day} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700 capitalize">{day}</h4>
                            <div className="relative inline-block w-10 mr-2 align-middle select-none">
                              <input
                                type="checkbox"
                                id={`available-${day}`}
                                checked={
                                  formData?.availability?.[day as keyof typeof formData.availability]
                                    ?.available || false
                                }
                                onChange={(e) =>
                                  handleAvailabilityChange(day, "available", e.target.checked)
                                }
                                className="sr-only"
                              />
                              <label
                                htmlFor={`available-${day}`}
                                className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${
                                  formData?.availability?.[day as keyof typeof formData.availability]
                                    ?.available
                                    ? "bg-blue-500"
                                    : ""
                                }`}
                              >
                                <span
                                  className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${
                                    formData?.availability?.[day as keyof typeof formData.availability]
                                      ?.available
                                      ? "translate-x-4"
                                      : "translate-x-0"
                                  }`}
                                ></span>
                              </label>
                            </div>
                          </div>
                          {formData?.availability?.[day as keyof typeof formData.availability]
                            ?.available && (
                            <div className="mt-3">
                              <label
                                htmlFor={`hours-${day}`}
                                className="block text-xs font-medium text-gray-500 mb-1"
                              >
                                Working Hours
                              </label>
                              <input
                                type="text"
                                id={`hours-${day}`}
                                placeholder="e.g. 9:00 AM - 6:00 PM"
                                value={
                                  formData?.availability?.[day as keyof typeof formData.availability]
                                    ?.hours || ""
                                }
                                onChange={(e) =>
                                  handleAvailabilityChange(day, "hours", e.target.value)
                                }
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                      (day) => (
                        <div
                          key={day}
                          className={`p-4 rounded-lg border ${
                            technician?.availability?.[day as keyof typeof technician.availability]
                              ?.available
                              ? "bg-white border-blue-200"
                              : "bg-gray-100 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-700 capitalize">{day}</h4>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                technician?.availability?.[day as keyof typeof technician.availability]
                                  ?.available
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {technician?.availability?.[day as keyof typeof technician.availability]
                                ?.available
                                ? "Available"
                                : "Unavailable"}
                            </span>
                          </div>
                          {technician?.availability?.[day as keyof typeof technician.availability]
                            ?.available && (
                            <p className="mt-2 text-sm text-gray-600">
                              {technician?.availability?.[day as keyof typeof technician.availability]
                                ?.hours || "All day"}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents & Certifications</h3>
              {isEditing ? (
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Government ID
                    </label>
                    <div className="mt-1 flex items-center">
                      <span className="inline-block h-12 w-12 rounded-md overflow-hidden bg-gray-100 mr-4">
                        <FaIdCard className="h-full w-full text-gray-400 p-2" />
                      </span>
                      <label
                        htmlFor="government-id"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaUpload className="mr-2 -ml-1 h-4 w-4" />
                        Upload ID
                        <input
                          id="government-id"
                          name="government-id"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleGovernmentIdChange}
                          className="sr-only"
                        />
                      </label>
                      {governmentIdFile && (
                        <span className="ml-2 text-sm text-gray-600">
                          {governmentIdFile.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Upload a clear photo of your government-issued ID (Aadhar, PAN, Driving License)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Certifications
                    </label>
                    <div className="mt-1 flex items-center">
                      <span className="inline-block h-12 w-12 rounded-md overflow-hidden bg-gray-100 mr-4">
                        <FaGraduationCap className="h-full w-full text-gray-400 p-2" />
                      </span>
                      <label
                        htmlFor="certifications"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <FaUpload className="mr-2 -ml-1 h-4 w-4" />
                        Upload Certificates
                        <input
                          id="certifications"
                          name="certifications"
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          onChange={handleCertificationChange}
                          className="sr-only"
                        />
                      </label>
                      {certificationFiles.length > 0 && (
                        <span className="ml-2 text-sm text-gray-600">
                          {certificationFiles.length} file(s) selected
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Upload any professional certifications or training certificates
                    </p>
                  </div>

                  {isUploading && (
                    <div className="mt-4">
                      <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                              Uploading
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold inline-block text-blue-600">
                              {uploadProgress}%
                            </span>
                          </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                          <div
                            style={{ width: `${uploadProgress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Government ID</h4>
                    {technician?.governmentId ? (
                      <div className="flex items-center">
                        <FaIdCard className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-gray-900">ID Verified</span>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No government ID uploaded yet</p>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Certifications</h4>
                    {technician?.certifications && technician.certifications.length > 0 ? (
                      <ul className="space-y-2">
                        {technician.certifications.map((cert, index) => (
                          <li key={index} className="flex items-center">
                            <FaGraduationCap className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-gray-900">{cert}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">No certifications uploaded yet</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Security Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Account Security</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your password and account security settings
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaLock className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Password</h4>
                  <p className="text-sm text-gray-500">Change your account password</p>
                </div>
              </div>
              <Link
                href="/technician/settings/change-password"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Password
              </Link>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaShieldAlt className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Account Status</h4>
                  <p className="text-sm text-gray-500">Your account is active and in good standing</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaUserCog className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Account Settings</h4>
                  <p className="text-sm text-gray-500">Manage your account preferences</p>
                </div>
              </div>
              <Link
                href="/technician/settings"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  }}