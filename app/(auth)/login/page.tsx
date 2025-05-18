"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import AuthFooter from "@/app/components/AuthFooter";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Hide login/signup buttons in header when on login page
  useEffect(() => {
    // Set a flag in sessionStorage to indicate we're on the login page
    sessionStorage.setItem("onAuthPage", "true");

    // Clean up when component unmounts
    return () => {
      sessionStorage.removeItem("onAuthPage");
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", { email: formData.email });

      // Validate input
      if (!formData.email || !formData.password) {
        throw new Error("Email and password are required");
      }

      // Call the login API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include", // Include cookies in the request
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(15000), // 15 seconds timeout
      });

      // Parse the response
      let data;
      try {
        // Check content type to prevent JSON parsing errors
        const contentType = response.headers.get("Content-Type");
        if (!contentType?.includes("application/json")) {
          console.error("Invalid content type:", contentType);
          throw new Error("Server returned non-JSON response");
        }

        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from server. Please try again.");
      }

      // Check if the response was successful
      if (!response.ok) {
        console.error("Login failed:", data);
        throw new Error(data.message || `Login failed with status: ${response.status}`);
      }

      // Validate the response data
      if (!data.token || !data.user) {
        console.error("Invalid login response:", data);
        throw new Error("Invalid response: Missing token or user data");
      }

      console.log("Login successful, storing token and user data");
      console.log("User role:", data.user.role);

      // Log additional user information for debugging
      console.log("User details:", {
        id: data.user._id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role
      });

      // Store token in localStorage for client-side access
      try {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Check if user is newly registered and set first login flag
        if (data.isNewUser) {
          localStorage.setItem("isFirstLogin", "true");
          console.log("New user detected, setting first login flag");
        }

        // Set login timestamp to help prevent redirect loops
        const timestamp = Date.now().toString();
        localStorage.setItem("loginTimestamp", timestamp);
        console.log("Login timestamp set:", timestamp);
      } catch (storageError) {
        console.error("Failed to store data in localStorage:", storageError);
        // Continue anyway as cookies are more important for auth
      }

      // Dispatch custom event to notify header component about auth change
      try {
        window.dispatchEvent(new Event("authChange"));
      } catch (eventError) {
        console.error("Failed to dispatch authChange event:", eventError);
      }

      // Store token in cookies for middleware authentication
      try {
        // Use secure cookie settings
        const cookieOptions = [
          `token=${data.token}`,
          'path=/',
          'max-age=86400',
          'SameSite=Strict'
        ];

        // Add secure flag in production
        if (window.location.protocol === 'https:') {
          cookieOptions.push('Secure');
        }

        // Set the cookie
        document.cookie = cookieOptions.join('; ');

        // Verify the cookie was set
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));

        if (tokenCookie) {
          console.log("Auth cookie set successfully");
        } else {
          console.warn("Failed to set auth cookie - trying alternative method");

          // Try setting the cookie again with a different approach
          const date = new Date();
          date.setTime(date.getTime() + 86400 * 1000); // 1 day
          document.cookie = `token=${data.token}; path=/; expires=${date.toUTCString()}; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;
          console.log("Attempted to set auth cookie with alternative method");
        }
      } catch (cookieError) {
        console.error("Error setting cookie:", cookieError);
        // Continue anyway, we'll try to use localStorage for auth
      }

      // Check if there's a pending booking
      const pendingBooking = sessionStorage.getItem("pendingBooking");

      // Function to handle redirection after successful login
      const handleRedirect = () => {
        try {
          // Redirect based on pending booking or user role
          if (pendingBooking) {
            // Clear the pending booking from session storage
            sessionStorage.removeItem("pendingBooking");
            // Redirect to contact page to complete the booking
            window.location.href = "/contact";
          } else if (data.user.role === "admin" || data.isAdmin === true) {
            console.log("Admin user detected, redirecting to admin dashboard");
            window.location.replace("/admin/dashboard");
          } else {
            console.log("Regular user detected, redirecting to profile page");
            window.location.href = "/profile";
          }
        } catch (redirectError) {
          console.error("Error during redirect:", redirectError);
          // Fallback to profile page
          window.location.href = "/profile";
        }
      };

      // For admin users, redirect immediately without popup
      if (data.user.role === "admin" || data.isAdmin === true) {
        console.log("Admin user detected, redirecting immediately to admin dashboard");

        // Set a flag to indicate this is a fresh login
        localStorage.setItem("freshAdminLogin", "true");

        // Force immediate redirect using window.location.replace for admin users
        // This is more forceful than window.location.href
        window.location.replace("/admin/dashboard");

        // As a fallback, also try the href method after a short delay
        setTimeout(() => {
          console.log("Fallback redirect to admin dashboard");
          window.location.href = "/admin/dashboard";
        }, 1000);

        // Don't execute any more code after redirect attempt
        return;
      } else {
        // For regular users, show success popup
        try {
          Swal.fire({
            title: "Login Successful!",
            text: `Welcome back, ${data.user.name || data.user.email}!`,
            icon: "success",
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false
          }).then(handleRedirect);
        } catch (swalError) {
          console.error("Error showing success popup:", swalError);
          // If Swal fails, just redirect
          handleRedirect();
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg"
        >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FaSignInAlt
                  className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                  aria-hidden="true"
                />
              </span>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </motion.div>
      </div>
      <AuthFooter />
    </div>
  );
}
