"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaPhone, FaEdit, FaSpinner, FaCheck, FaKey, FaExclamationCircle, FaRedo } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { ErrorBoundary } from "react-error-boundary";

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const checkAdminAuth = useCallback(async () => {
    try {
      setLoadingProgress(10);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        throw new Error("Authentication token not found. Please log in as admin.");
      }

      setLoadingProgress(50);
      const response = await fetch(`/api/admin/verify`, {
        method: 'GET',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Invalid or expired token: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error("Token verification failed.");
      }

      setLoadingProgress(100);
      return true;
    } catch (err) {
      console.error("Error checking admin auth:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate. Please try again.");
      toast.error(err instanceof Error ? err.message : "Authentication failed.", {
        duration: 4000,
      });
      return false;
    }
  }, []);

  const fetchAdminProfile = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProgress(10);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      setLoadingProgress(50);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch admin profile: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.admin) {
        throw new Error(data.message || "Failed to fetch admin profile.");
      }

      setProfile(data.admin);
      setFormData({
        name: data.admin.name,
        email: data.admin.email,
        phone: data.admin.phone || "",
      });
      setLoadingProgress(100);
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch admin profile.");
      toast.error(error instanceof Error ? error.message : "Failed to fetch admin profile.", {
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const isAuthenticated = await checkAdminAuth();
      if (!isAuthenticated) {
        router.push("/admin/login");
        return;
      }
      await fetchAdminProfile();
    };

    initialize();
    const toastId = toast.loading("Loading profile...");
    return () => toast.dismiss(toastId);
  }, [checkAdminAuth, fetchAdminProfile, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      if (!formData.name.trim()) {
        throw new Error("Name is required.");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required.");
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update profile: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to update profile.");
      }

      setProfile((prev) => (prev ? { ...prev, ...formData } : null));
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      if (!passwordData.currentPassword) {
        throw new Error("Current password is required.");
      }
      if (!passwordData.newPassword) {
        throw new Error("New password is required.");
      }
      if (passwordData.newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long.");
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("New password and confirm password do not match.");
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/change-password`, {
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
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to change password: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to change password.");
      }

      setIsChangingPassword(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change password.");
    } finally {
      setIsSaving(false);
    }
  };

  const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error.message}</p>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  type="button"
                  onClick={resetErrorBoundary}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <FaRedo className="mr-2 h-4 w-4" aria-hidden="true" />
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/admin/login")}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaExclamationCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      setLoadingProgress(0);
                      checkAdminAuth().then((isAuthenticated) => {
                        if (isAuthenticated) fetchAdminProfile();
                        else router.push("/admin/login");
                      });
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <FaRedo className="mr-2 h-4 w-4" aria-hidden="true" />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/admin/login")}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setError(null);
        setLoading(true);
        setLoadingProgress(0);
        checkAdminAuth().then((isAuthenticated) => {
          if (isAuthenticated) fetchAdminProfile();
          else router.push("/admin/login");
        });
      }}
    >
      <motion.div
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        role="main"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Admin Profile</h1>
              <p className="mt-1 text-sm text-gray-500">View and manage your profile information</p>
            </div>
            {!isEditing && !isChangingPassword && (
              <div className="mt-4 sm:mt-0 flex space-x-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Edit profile"
                >
                  <FaEdit className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  aria-label="Change password"
                >
                  <FaKey className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                  Change Password
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading profile...</p>
                  <div className="mt-2 w-48 bg-gray-200 rounded-full h-2 mx-auto">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {loadingProgress < 50 ? "Checking authentication..." : "Fetching profile..."}
                  </p>
                </div>
              </div>
            </div>
          ) : isEditing ? (
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
                        aria-required="true"
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
                        aria-required="true"
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
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isSaving ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      aria-label="Save profile changes"
                    >
                      {isSaving ? (
                        <>
                          <FaSpinner className="animate-spin mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
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
                        aria-required="true"
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
                        aria-required="true"
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
                        aria-required="true"
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
                      aria-label="Cancel password change"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                        isSaving ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      aria-label="Change password"
                    >
                      {isSaving ? (
                        <>
                          <FaSpinner className="animate-spin mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <FaKey className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
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
                      <FaUser className="mr-2 text-gray-400" aria-hidden="true" /> Name
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaEnvelope className="mr-2 text-gray-400" aria-hidden="true" /> Email
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{profile.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FaPhone className="mr-2 text-gray-400" aria-hidden="true" /> Phone
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
      </motion.div>
    </ErrorBoundary>
  );
}