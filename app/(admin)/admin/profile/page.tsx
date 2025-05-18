"use client";

import { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSpinner, FaCheck, FaKey } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ErrorDisplay from "@/app/components/ui/ErrorDisplay";

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        throw new Error("Not in browser environment");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found");
        toast.error("Please login to view your profile");
        return;
      }

      // Get user data from localStorage to check if admin
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        setError("User data not found");
        toast.error("Please login to view your profile");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        if (user.role !== "admin") {
          setError("Unauthorized access");
          toast.error("Admin access required");
          return;
        }
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        setError("Invalid user data");
        toast.error("Please login again");
        return;
      }

      const response = await fetch("/api/admin/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch admin profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.admin) {
        setProfile(data.admin);
        setFormData({
          name: data.admin.name,
          email: data.admin.email,
          phone: data.admin.phone || "",
        });
      } else if (data.success === false) {
        // Handle explicit error response
        throw new Error(data.message || "Failed to fetch admin profile");
      } else {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Error fetching admin profile:", error);
      setError(error.message || "Failed to fetch admin profile");
      toast.error(error.message || "Failed to fetch admin profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        throw new Error("Not in browser environment");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        return;
      }

      // Validate form data
      if (!formData.name.trim()) {
        toast.error("Name is required");
        return;
      }

      if (!formData.email.trim()) {
        toast.error("Email is required");
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const response = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update profile";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        setProfile((prev) => prev ? { ...prev, ...formData } : null);
        setIsEditing(false);
        toast.success("Profile updated successfully");

        // Update user data in localStorage if it exists
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            const updatedUser = {
              ...user,
              name: formData.name,
              email: formData.email,
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error("Error updating user data in localStorage:", error);
        }
      } else if (data.success === false) {
        // Handle explicit error response
        throw new Error(data.message || "Failed to update profile");
      } else {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        throw new Error("Not in browser environment");
      }

      // Validate password data
      if (!passwordData.currentPassword) {
        toast.error("Current password is required");
        setIsSaving(false);
        return;
      }

      if (!passwordData.newPassword) {
        toast.error("New password is required");
        setIsSaving(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long");
        setIsSaving(false);
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error("New password and confirm password do not match");
        setIsSaving(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        setIsSaving(false);
        return;
      }

      const response = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to change password";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success) {
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Password changed successfully");
      } else if (data.success === false) {
        // Handle explicit error response
        throw new Error(data.message || "Failed to change password");
      } else {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-48 mb-2 bg-gray-200 animate-pulse rounded-md"></div>
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-md"></div>
            <div className="h-10 w-40 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <div className="h-6 w-48 bg-gray-200 animate-pulse rounded-md"></div>
            <div className="h-4 w-64 mt-2 bg-gray-200 animate-pulse rounded-md"></div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="sm:col-span-1">
                  <div className="h-4 w-24 mb-2 bg-gray-200 animate-pulse rounded-md"></div>
                  <div className="h-5 w-40 bg-gray-200 animate-pulse rounded-md"></div>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        message={error}
        onRetry={fetchAdminProfile}
        showRetry={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your profile information
          </p>
        </div>
        {!isEditing && !isChangingPassword && (
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaEdit className="mr-2 -ml-1 h-5 w-5" />
              Edit Profile
            </button>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaKey className="mr-2 -ml-1 h-5 w-5" />
              Change Password
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile?.name || "",
                      email: profile?.email || "",
                      phone: profile?.phone || "",
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 -ml-1 h-5 w-5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2 -ml-1 h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : isChangingPassword ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2 -ml-1 h-5 w-5" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <FaKey className="mr-2 -ml-1 h-5 w-5" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : profile ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Admin Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and account information.</p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaUser className="mr-2 text-gray-400" /> Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.name}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaEnvelope className="mr-2 text-gray-400" /> Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FaPhone className="mr-2 text-gray-400" /> Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.phone || "Not provided"}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Account Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
