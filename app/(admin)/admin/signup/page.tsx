"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { FaEye, FaEyeSlash, FaUserShield, FaSpinner, FaKey } from "react-icons/fa";
import Link from "next/link";

interface SignupFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  secretKey: string;
}

export default function AdminSignup() {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<SignupFormData>>({});

  // Check if user is already logged in as admin
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.role === "admin") {
            console.log("Admin already logged in, redirecting to dashboard");
            router.replace("/admin/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking existing auth:", error);
      }
    };

    checkExistingAuth();
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
      newErrors.password = "Password must include uppercase, lowercase, number, and special character";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.secretKey.trim()) {
      newErrors.secretKey = "Admin secret key is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof SignupFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/admin-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.replace(/\D/g, ""),
          password: formData.password,
          secretKey: formData.secretKey.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Admin account created successfully! Please login to continue.");
        
        // Redirect to admin login page
        setTimeout(() => {
          router.push("/admin/login");
        }, 1500);

      } else {
        toast.error(data.message || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserShield className="text-blue-600 text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Admin Account</h1>
          <p className="text-gray-600">Set up your admin access</p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your phone number"
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Create a strong password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Confirm your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Secret Key Field */}
          <div>
            <label htmlFor="secretKey" className="block text-sm font-medium text-gray-700 mb-2">
              <FaKey className="inline mr-1" />
              Admin Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                id="secretKey"
                name="secretKey"
                value={formData.secretKey}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12 ${
                  errors.secretKey ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter admin secret key"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                {showSecretKey ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.secretKey && (
              <p className="mt-1 text-sm text-red-600">{errors.secretKey}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Contact the system administrator for the admin secret key
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Admin Account"
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <div className="text-sm text-gray-600">
            Already have an admin account?{" "}
            <Link href="/admin/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign In
            </Link>
          </div>
          
          <div className="text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
