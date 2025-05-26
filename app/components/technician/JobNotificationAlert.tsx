"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTools, FaClock, FaMapMarkerAlt, FaRupeeSign, FaExclamationTriangle, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useJobNotificationPolling } from "../../hooks/useJobNotificationPolling";

interface JobNotification {
  _id: string;
  bookingId: string;
  serviceName: string;
  customerName: string;
  address: string;
  amount: number;
  urgency: "normal" | "high" | "emergency";
  status: string;
  createdAt: string;
  description?: string;
  estimatedDuration?: string;
}

interface JobNotificationAlertProps {
  isAvailable: boolean;
  onJobAccept?: (jobId: string) => void;
  onJobReject?: (jobId: string) => void;
}

export default function JobNotificationAlert({
  isAvailable,
  onJobAccept,
  onJobReject
}: JobNotificationAlertProps) {
  const [currentNotification, setCurrentNotification] = useState<JobNotification | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { jobNotifications, isPolling } = useJobNotificationPolling(isAvailable, 10000);

  // Show the latest job notification
  useEffect(() => {
    if (jobNotifications.length > 0 && !currentNotification) {
      const latestJob = jobNotifications[0];
      setCurrentNotification(latestJob);
      setTimeLeft(30);

      // Play notification sound
      if (!isMuted) {
        try {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch(() => {
            console.warn("Could not play notification sound");
          });
        } catch (error) {
          console.warn("Notification sound not available");
        }
      }
    }
  }, [jobNotifications, currentNotification, isMuted]);

  // Countdown timer
  useEffect(() => {
    if (currentNotification && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && currentNotification) {
      // Auto-reject when time runs out
      handleReject();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentNotification, timeLeft]);

  const handleAccept = async () => {
    if (!currentNotification || isProcessing) return;

    setIsProcessing(true);
    try {
      // Get token for API call
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Call the existing accept endpoint
      const response = await fetch("/api/technicians/jobs/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: currentNotification._id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to accept job");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("Job accepted successfully! Check your active jobs.", { duration: 4000 });
        setCurrentNotification(null);

        // Call parent callback if provided
        if (onJobAccept) {
          await onJobAccept(currentNotification._id);
        }
      } else {
        throw new Error(data.message || "Failed to accept job");
      }
    } catch (error) {
      console.error("Error accepting job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to accept job. Please try again.", { duration: 4000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!currentNotification || isProcessing) return;

    setIsProcessing(true);
    try {
      // Get token for API call
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Call the existing reject endpoint
      const response = await fetch("/api/technicians/jobs/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: currentNotification._id,
          reason: "Declined by technician"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject job");
      }

      const data = await response.json();
      if (data.success) {
        toast.info("Job declined", { duration: 3000 });
        setCurrentNotification(null);

        // Call parent callback if provided
        if (onJobReject) {
          await onJobReject(currentNotification._id);
        }
      } else {
        throw new Error(data.message || "Failed to reject job");
      }
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to decline job. Please try again.", { duration: 4000 });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? "Notifications unmuted" : "Notifications muted", { duration: 2000 });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "border-red-500 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      default:
        return "border-blue-500 bg-blue-50";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    if (urgency === "emergency" || urgency === "high") {
      return <FaExclamationTriangle className="text-red-500" />;
    }
    return <FaTools className="text-blue-500" />;
  };

  if (!isAvailable || !isPolling) {
    return null;
  }

  return (
    <>
      {/* Notification Sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
      </audio>

      {/* Job Notification Alert */}
      <AnimatePresence>
        {currentNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.9 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md"
          >
            <div className={`bg-white rounded-lg shadow-2xl overflow-hidden border-2 ${getUrgencyColor(currentNotification.urgency)}`}>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {getUrgencyIcon(currentNotification.urgency)}
                    <div className="ml-2">
                      <h3 className="font-bold text-lg">New Job Alert!</h3>
                      <p className="text-xs text-blue-100">Booking #{currentNotification.bookingId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleMute}
                      className="text-white hover:text-gray-200 focus:outline-none"
                      title={isMuted ? "Unmute notifications" : "Mute notifications"}
                    >
                      {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{timeLeft}</div>
                      <div className="text-xs">seconds</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{currentNotification.serviceName}</h4>
                  <p className="text-sm text-gray-600">Customer: {currentNotification.customerName}</p>
                </div>

                {currentNotification.description && (
                  <div>
                    <p className="text-sm text-gray-700">{currentNotification.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="text-gray-400 mr-2" />
                    <span className="text-gray-700 truncate">{currentNotification.address}</span>
                  </div>
                  <div className="flex items-center">
                    <FaRupeeSign className="text-green-500 mr-1" />
                    <span className="font-semibold text-green-600">₹{currentNotification.amount}</span>
                  </div>
                </div>

                {currentNotification.estimatedDuration && (
                  <div className="flex items-center text-sm">
                    <FaClock className="text-gray-400 mr-2" />
                    <span className="text-gray-700">Duration: {currentNotification.estimatedDuration}</span>
                  </div>
                )}

                {currentNotification.urgency !== "normal" && (
                  <div className="bg-yellow-100 border border-yellow-300 rounded p-2">
                    <p className="text-sm text-yellow-800 font-medium">
                      {currentNotification.urgency === "emergency" ? "🚨 Emergency Service" : "⚡ High Priority"}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-4 py-3 flex space-x-3">
                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isProcessing ? "Processing..." : "Decline"}
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {isProcessing ? "Processing..." : "Accept Job"}
                </button>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-gray-200">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: "100%" }}
                  animate={{ width: `${(timeLeft / 30) * 100}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status indicator when polling */}
      {isPolling && jobNotifications.length === 0 && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center text-sm text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Listening for new jobs...
          </div>
        </div>
      )}
    </>
  );
}
