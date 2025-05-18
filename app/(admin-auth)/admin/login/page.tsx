"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { FaLock, FaEnvelope, FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check if already logged in as admin
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
          const user = JSON.parse(userStr);
          if (user.role === "admin") {
            // Already logged in as admin, redirect to dashboard
            window.location.href = "/admin/dashboard";
          }
        }
      } catch (error) {
        console.error("Error checking admin auth:", error);
        // Clear potentially corrupted data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Convert email to lowercase
      const normalizedEmail = email.toLowerCase();

      // Create form data for a traditional form submission
      const formData = new FormData();
      formData.append('email', normalizedEmail);
      formData.append('password', password);

      // Make the login request
      const requestBody = { email: normalizedEmail, password };

      // Use absolute URL to avoid potential path issues
      const apiUrl = window.location.origin + '/api/auth/login';
      console.log("Making login request to:", apiUrl);

      // Make the fetch request
      let response;
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          // Add these options to help with potential CORS or network issues
          credentials: 'same-origin',
          mode: 'cors',
          cache: 'no-cache',
        });
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error("Network error: Unable to connect to the login service. Please check your connection and try again.");
      }



      // Parse the response
      let data: { success: any; message: string; user: { role: string; }; token: string; };
      try {
        data = await response.json();


      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        throw new Error("Invalid response from server. Please try again.");
      }

      console.log("Login response:", {
        status: response.status,
        success: data.success,
        message: data.message
      });

      // Handle error responses
      if (!response.ok || !data.success) {
        if (response.status === 401) {
          if (data.message === "User not found") {
            throw new Error("No account found with this email. Please check your email address.");
          } else if (data.message === "Invalid password") {
            throw new Error("Incorrect password. Please try again.");
          } else {
            throw new Error(data.message || "Authentication failed");
          }
        } else {
          throw new Error(data.message || "Login failed");
        }
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        toast.error("This account doesn't have admin privileges");
        return;
      }

      // Store auth data in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('freshAdminLogin', 'true');

      // Also set the token in cookies for middleware authentication
      document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Strict${window.location.protocol === 'https:' ? '; Secure' : ''}`;

      // Show success message
      toast.success("Login successful!");

      console.log("Login successful, redirecting to dashboard");

      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1000);

    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {isClient && (
            <div className="flex justify-center">
              <motion.img
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-20 w-auto"
                src="/Dizit-Solution.webp"
                alt="Dizit Solution Logo"
              />
            </div>
          )}
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access the admin dashboard
          </p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin h-5 w-5 mr-2" />
                ) : (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <FaLock className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" />
                  </span>
                )}
                {isLoading ? "Logging in..." : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Help</span>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-md border border-blue-100">
              <p className="font-medium text-blue-800 mb-1">Admin Login Information:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email addresses are case-sensitive (use lowercase)</li>
                <li>Default admin email: <span className="font-mono bg-white px-1 py-0.5 rounded">admin@gmail.com</span></li>
                <li>If you've forgotten your password, please create a new admin account</li>
              </ul>


            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link href="/admin/signup">
                <div className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-blue-600 hover:bg-blue-50 cursor-pointer">
                  Create Admin Account
                </div>
              </Link>
              <Link href="/">
                <div className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                  Return to Home
                </div>
              </Link>

            </div>


          </div>
        </motion.div>
      </div>
    </div>
  );
}
