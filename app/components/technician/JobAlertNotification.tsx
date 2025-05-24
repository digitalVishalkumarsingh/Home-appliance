"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTools,
  FaMapMarkerAlt,
  FaRupeeSign,
  FaHourglassHalf,
  FaCheck,
  FaTimes,
  FaVolumeMute,
  FaVolumeUp,
  FaInfoCircle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// Define Job type (aligned with JobNotificationProvider and TechnicianJobContext)
interface Job {
  id: string;
  bookingId: string;
  orderId?: string;
  paymentId?: string;
  appliance: string;
  location: {
    address: string;
    fullAddress?: string;
    distance: number;
  };
  earnings: {
    total: number;
    technicianEarnings: number;
    adminCommission: number;
    adminCommissionPercentage: number;
  };
  customer: {
    name: string;
    phone?: string;
  };
  description?: string;
  urgency?: "normal" | "high" | "emergency";
  createdAt: string;
}

interface JobAlertProps {
  job: Job;
  timeoutSeconds: number;
  onAccept: (jobId: string) => Promise<void>;
  onReject: (jobId: string, reason?: string) => Promise<void>;
  onTimeout: (jobId: string) => void;
}

export default function JobAlertNotification({
  job,
  timeoutSeconds,
  onAccept,
  onReject,
  onTimeout,
}: JobAlertProps) {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxAudioPlays = 3; // Limit audio repetitions
  let audioPlayCount = useRef(0);

  // Initialize and manage audio
  const initializeAudio = useCallback(() => {
    if (typeof window === "undefined") return;

    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.loop = false; // Disable looping to control manually
    audioRef.current.onended = () => {
      if (audioPlayCount.current < maxAudioPlays && !isMuted && audioRef.current) {
        audioPlayCount.current += 1;
        audioRef.current.play().catch(error => {
          console.warn("Audio play failed:", error.message);
          toast.error("Unable to play notification sound", { duration: 3000 });
        });
      }
    };

    if (!isMuted) {
      audioPlayCount.current = 0;
      audioRef.current.play().catch(error => {
        console.warn("Audio play failed:", error.message);
        toast.error("Unable to play notification sound", { duration: 3000 });
      });
    }
  }, [isMuted]);

  useEffect(() => {
    initializeAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [initializeAudio]);

  // Countdown timer
  useEffect(() => {
    if (typeof window === "undefined") return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          try {
            onTimeout(job.id);
            if (audioRef.current) {
              audioRef.current.pause();
            }
          } catch (error) {
            if (error instanceof Error) {
              console.warn("Error in timeout handler:", error.message);
            } else {
              console.warn("Error in timeout handler:", error);
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [job.id, onTimeout]);

  // Handle accept job
  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      await onAccept(job.id);
      toast.success("Job accepted successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error accepting job";
      console.warn("Error accepting job:", errorMessage);
      toast.error(errorMessage.includes("Authentication") ? "Please log in again" : "Failed to accept job", {
        duration: 4000,
      });
    } finally {
      setIsProcessing(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  // Handle reject job
  const handleReject = async () => {
    if (!showRejectionForm) {
      setShowRejectionForm(true);
      return;
    }

    try {
      setIsProcessing(true);
      await onReject(job.id, rejectionReason || undefined);
      toast.success("Job rejected successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error rejecting job";
      console.warn("Error rejecting job:", errorMessage);
      toast.error(errorMessage.includes("Authentication") ? "Please log in again" : "Failed to reject job", {
        duration: 4000,
      });
    } finally {
      setIsProcessing(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (prev && audioRef.current) {
        // Unmute
        audioPlayCount.current = 0;
        audioRef.current.play().catch(error => {
          console.warn("Audio play failed:", error.message);
          toast.error("Unable to play notification sound", { duration: 3000 });
        });
      } else if (audioRef.current) {
        // Mute
        audioRef.current.pause();
      }
      return !prev;
    });
  }, []);

  // Calculate progress percentage
  const progressPercentage = Math.max(0, (timeLeft / timeoutSeconds) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border-2 border-blue-500">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <FaTools className="mr-2 h-5 w-5" />
              <div>
                <h3 className="font-bold text-lg">New Repair Job Available!</h3>
                <p className="text-xs text-blue-100">Booking #{job.bookingId}</p>
              </div>
            </div>
            <button
              onClick={toggleMute}
              className="text-white hover:text-gray-200 focus:outline-none"
              aria-label={isMuted ? "Unmute notification" : "Mute notification"}
            >
              {isMuted ? <FaVolumeMute className="h-5 w-5" /> : <FaVolumeUp className="h-5 w-5" />}
            </button>
          </div>

          {/* Job Details */}
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-start">
                <FaTools className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Appliance</p>
                  <p className="font-medium">{job.appliance || "Unknown"}</p>
                </div>
              </div>

              <div className="flex items-start">
                <FaMapMarkerAlt className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <div className="flex items-center">
                    <p className="font-medium">{job.location.distance ? `${job.location.distance} km away` : "Distance unknown"}</p>
                    <span className="mx-1 text-gray-400">•</span>
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{job.location.address || "No address"}</p>
                  </div>
                  {isExpanded && (
                    <p className="text-sm text-gray-600 mt-1 break-words">
                      {job.location.fullAddress || job.location.address || "No full address"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <FaRupeeSign className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Your Earnings (After Commission)</p>
                  <p className="font-medium text-green-600 text-lg">₹{job.earnings.technicianEarnings || 0}</p>
                  <div className="text-xs text-gray-500 mt-1 bg-gray-50 p-1 rounded">
                    <p>Service Price: ₹{job.earnings.total || 0}</p>
                    <p>Admin Fee ({job.earnings.adminCommissionPercentage || 0}%): -₹{job.earnings.adminCommission || 0}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <FaInfoCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{job.customer.name || "Unknown"}</p>
                  {job.customer.phone && (
                    <p className="text-xs text-gray-600">{job.customer.phone}</p>
                  )}
                </div>
              </div>

              {isExpanded && (
                <>
                  {job.description && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="text-sm">{job.description}</p>
                    </div>
                  )}

                  {(job.orderId || job.paymentId) && (
                    <div className="border-t pt-2 mt-2">
                      <p className="text-sm text-gray-500">Payment Details</p>
                      {job.orderId && <p className="text-xs text-gray-600">Order ID: {job.orderId}</p>}
                      {job.paymentId && <p className="text-xs text-gray-600">Payment ID: {job.paymentId}</p>}
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {isExpanded ? "Show less" : "Show more details"}
            </button>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center text-amber-600">
                  <FaHourglassHalf className="mr-1 h-4 w-4" />
                  <span className="text-sm font-medium">Accept within</span>
                </div>
                <span className="text-sm font-bold">{timeLeft} seconds</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${timeLeft <= 10 ? "bg-red-600" : "bg-amber-500"}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {showRejectionForm && (
              <div className="mt-4 border-t pt-3">
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for rejection (optional)
                </label>
                <div className="flex space-x-2">
                  <select
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a reason</option>
                    <option value="Too far away">Too far away</option>
                    <option value="Busy with another job">Busy with another job</option>
                    <option value="Not my specialization">Not my specialization</option>
                    <option value="Low earnings">Low earnings</option>
                    <option value="End of shift">End of shift</option>
                    <option value="Other">Other</option>
                  </select>
                  <button
                    onClick={() => setShowRejectionForm(false)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaCheck className="mr-2 -ml-1 h-5 w-5" />
                    Accept Job
                  </span>
                )}
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FaTimes className="mr-2 -ml-1 h-5 w-5" />
                    Reject Job
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}