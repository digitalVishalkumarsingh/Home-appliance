"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaRupeeSign,
  FaTools,
  FaCalendarAlt,
  FaClock,
  FaDirections,
  FaCheckCircle,
  FaTimes,
  FaSpinner,
  FaBell,
  FaCommentAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// Define Job type explicitly (based on TechnicianJobContext and JobNotificationProvider)
interface Job {
  bookingId: string;
  appliance: string;
  description?: string;
  customer: {
    name: string;
    phone?: string;
  };
  location: {
    address: string;
    distance: number;
    coordinates?: { lat: number; lng: number };
  };
  earnings: {
    total: number;
    technicianEarnings: number;
    adminCommission: number;
    adminCommissionPercentage: number;
  };
  createdAt: string;
  status: "pending" | "accepted" | "in-progress" | "completed" | "rejected";
  paymentMethod?: "online" | "cash";
}

interface AcceptedJobDetailsProps {
  job: Job;
  onClose: () => void;
  onStartService: () => void;
  onCompleteService: () => void;
  onSendArrivalMessage: (message: string) => Promise<void>;
}

export default function AcceptedJobDetails({
  job,
  onClose,
  onStartService,
  onCompleteService,
  onSendArrivalMessage,
}: AcceptedJobDetailsProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [serviceStarted, setServiceStarted] = useState(job.status === "in-progress");
  const [showArrivalForm, setShowArrivalForm] = useState(false);
  const [arrivalMessage, setArrivalMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState("15-20");
  const [jobAccepted, setJobAccepted] = useState(job.status === "accepted" || job.status === "in-progress");

  // Utility to get client-side token (consistent with JobNotificationProvider)
  const getClientToken = (): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) console.warn("No token found in localStorage");
    return token;
  };

  // Function to open Google Maps with directions
  const openDirections = useCallback(() => {
    const encodedAddress = encodeURIComponent(job.location.address || "");
    const url = job.location.coordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${job.location.coordinates.lat},${job.location.coordinates.lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(url, "_blank");
  }, [job.location]);

  // Function to handle job acceptance
  const handleAcceptJob = async () => {
    try {
      setIsStarting(true);

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(`${apiUrl}/technicians/jobs/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job.bookingId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to accept job: ${response.status}`);
      }

      setJobAccepted(true);
      toast.success("Job accepted successfully");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error accepting job:", error.message);
        toast.error(error.message.includes("Authentication") ? "Please log in again" : "Failed to accept job");
      } else {
        console.error("Error accepting job:", String(error));
        toast.error("Failed to accept job");
      }
    } finally {
      setIsStarting(false);
    }
  };

  // Function to handle sending arrival notification
  const handleSendArrivalNotification = async () => {
    try {
      setIsSendingMessage(true);

      const message = arrivalMessage.trim() || `I'm on my way to your location. Estimated arrival time: ${estimatedArrival} minutes.`;
      await onSendArrivalMessage(message);

      toast.success("Arrival notification sent to customer");
      setShowArrivalForm(false);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error sending arrival notification:", error.message);
      } else {
        console.error("Error sending arrival notification:", String(error));
      }
      toast.error("Failed to send notification");
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Function to handle starting the service
  const handleStartService = async () => {
    if (showArrivalForm) return; // Prevent multiple clicks while form is open
    setShowArrivalForm(true);
  };

  // Function to start service after notification
  const startServiceAfterNotification = async () => {
    try {
      setIsStarting(true);

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(`${apiUrl}/technicians/jobs/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job.bookingId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to start service: ${response.status}`);
      }

      setServiceStarted(true);
      toast.success("Service started successfully");
      onStartService();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error starting service:", error.message);
        toast.error(error.message.includes("Authentication") ? "Please log in again" : "Failed to start service");
      } else {
        console.error("Error starting service:", error);
        toast.error("Failed to start service");
      }
    } finally {
      setIsStarting(false);
    }
  };

  // Function to handle completing the service
  const handleCompleteService = async () => {
    try {
      setIsCompleting(true);

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(`${apiUrl}/technicians/jobs/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: job.bookingId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to complete service: ${response.status}`);
      }

      toast.success("Service completed successfully");
      onCompleteService();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error completing service:", error.message);
        toast.error(error.message.includes("Authentication") ? "Please log in again" : "Failed to complete service");
      } else {
        console.error("Error completing service:", error);
        toast.error("Failed to complete service");
      }
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Booking Details</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">Booking ID: {job.bookingId}</p>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Service Info */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <FaTools className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{job.appliance || "Unknown Appliance"}</h3>
                <p className="text-sm text-gray-600 mt-1">{job.description || "No description provided"}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-start">
              <div className="bg-green-100 p-2 rounded-full mr-3">
                <FaUser className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{job.customer.name || "Unknown Customer"}</h3>
                {job.customer.phone && (
                  <div className="flex items-center mt-1">
                    <FaPhone className="h-4 w-4 text-gray-500 mr-1" />
                    <a href={`tel:${job.customer.phone}`} className="text-sm text-blue-600 hover:underline">
                      {job.customer.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-start">
              <div className="bg-red-100 p-2 rounded-full mr-3">
                <FaMapMarkerAlt className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Service Location</h3>
                <p className="text-sm text-gray-600 mt-1">{job.location.address || "No address provided"}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600 mr-2">
                    {job.location.distance ? `${job.location.distance} km away` : "Distance not available"}
                  </span>
                  <button
                    onClick={openDirections}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FaDirections className="mr-1 h-4 w-4" />
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Earnings */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-start">
              <div className="bg-yellow-100 p-2 rounded-full mr-3">
                <FaRupeeSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Your Earnings</h3>
                <p className="text-lg font-semibold text-green-600 mt-1">
                  ₹{job.earnings.technicianEarnings || 0}
                </p>
                <div className="text-xs text-gray-500 mt-1">
                  <p>Service Price: ₹{job.earnings.total || 0}</p>
                  <p>
                    Admin Fee ({job.earnings.adminCommissionPercentage || 0}%): -₹{job.earnings.adminCommission || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-4">
            <div className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <FaCalendarAlt className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Schedule</h3>
                <div className="flex items-center mt-1">
                  <FaClock className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-sm text-gray-600">
                    {job.createdAt
                      ? `${new Date(job.createdAt).toLocaleDateString()} at ${new Date(job.createdAt).toLocaleTimeString()}`
                      : "Schedule not available"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrival Notification Form */}
        {showArrivalForm && (
          <div className="p-4 bg-blue-50 border-t border-blue-100">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <FaBell className="h-5 w-5 text-blue-600 mr-2" />
              Send Arrival Notification
            </h3>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Arrival Time (minutes)
              </label>
              <select
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="5-10">5-10 minutes</option>
                <option value="10-15">10-15 minutes</option>
                <option value="15-20">15-20 minutes</option>
                <option value="20-30">20-30 minutes</option>
                <option value="30-45">30-45 minutes</option>
                <option value="45-60">45-60 minutes</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Message (Optional)
              </label>
              <textarea
                value={arrivalMessage}
                onChange={(e) => setArrivalMessage(e.target.value)}
                placeholder={`I'm on my way to your location. Estimated arrival time: ${estimatedArrival} minutes.`}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowArrivalForm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const sent = await handleSendArrivalNotification();
                  if (sent) await startServiceAfterNotification();
                }}
                disabled={isSendingMessage || isStarting}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
              >
                {isSendingMessage || isStarting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 h-4 w-4 inline" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaCommentAlt className="mr-2 h-4 w-4 inline" />
                    Send & Start
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gray-50 p-4 flex justify-between">
          {!jobAccepted ? (
            <button
              onClick={handleAcceptJob}
              disabled={isStarting}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-400"
            >
              {isStarting ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                  Accepting...
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2 h-5 w-5" />
                  Accept Job
                </>
              )}
            </button>
          ) : !serviceStarted ? (
            <button
              onClick={handleStartService}
              disabled={isStarting || showArrivalForm}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center disabled:bg-blue-400"
            >
              {isStarting ? (
                <>
                  <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                  Starting...
                </>
              ) : (
                <>
                  <FaDirections className="mr-2 h-5 w-5" />
                  Go to Service
                </>
              )}
            </button>
          ) : (
            <div className="w-full flex space-x-3">
              <button
                onClick={() => setShowArrivalForm(true)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <FaBell className="mr-2 h-5 w-5" />
                Send Update
              </button>
              <button
                onClick={handleCompleteService}
                disabled={isCompleting}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center justify-center disabled:bg-green-400"
              >
                {isCompleting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2 h-5 w-5" />
                    Completing...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-2 h-5 w-5" />
                    Complete
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Payment Info */}
        {serviceStarted && (
          <div className="p-4 bg-green-50 border-t border-green-100">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center">
              <FaMoneyBillWave className="h-5 w-5 text-green-600 mr-2" />
              Payment Information
            </h3>
            <p className="text-sm text-gray-600">
              {job.paymentMethod === "online" ? (
                "Customer has already paid online. No cash collection needed."
              ) : (
                <>
                  <span className="font-medium">Collect Cash: ₹{job.earnings.total || 0}</span>
                  <br />
                  <span className="text-xs">Please collect cash from the customer after completing the service.</span>
                </>
              )}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}