"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaEnvelope, FaPaperPlane } from "react-icons/fa";
import Swal from "sweetalert2";

import { logger } from "@/app/config/logger";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Hide login/signup buttons in header when on auth page
  useEffect(() => {
    sessionStorage.setItem("onAuthPage", "true");
    return () => sessionStorage.removeItem("onAuthPage");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Validate email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }

      // Call the forgot password API endpoint
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(15000), // 15 seconds timeout
      });

      // Parse the response
      let data;
      try {
        const contentType = response.headers.get("Content-Type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Server returned non-JSON response");
        }
        data = await response.json();
      } catch (jsonError) {
        // The logger now has built-in error handling
        logger.error("Failed to parse JSON response", { error: jsonError });
        throw new Error("Invalid response from server. Please try again.");
      }

      // Check if the response was successful
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status: ${response.status}`);
      }

      // Show success message
      setSuccess(true);
      Swal.fire({
        title: "Email Sent!",
        text: "If an account exists with this email, you will receive password reset instructions.",
        icon: "success",
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: true,
      });
    } catch (err: any) {
      // The logger now has built-in error handling
      logger.error("Forgot password error", { error: err.message });
      setError(err.message || "An error occurred. Please try again.");
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
              Reset Your Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {success ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <p>Password reset email sent! Please check your inbox.</p>
              <p className="mt-2">
                Return to{" "}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Login
                </Link>
              </p>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
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
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <FaPaperPlane
                      className="h-5 w-5 text-blue-500 group-hover:text-blue-400"
                      aria-hidden="true"
                    />
                  </span>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>

              <div className="text-center">
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    
    </div>
  );
}
