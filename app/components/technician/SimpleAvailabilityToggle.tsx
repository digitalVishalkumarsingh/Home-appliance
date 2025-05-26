"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { useJobNotificationPolling } from "../../hooks/useJobNotificationPolling";

interface SimpleAvailabilityToggleProps {
  onToggle?: (isAvailable: boolean) => void;
  variant?: "default" | "header"; // For different styling contexts
}

export default function SimpleAvailabilityToggle({ onToggle, variant = "default" }: SimpleAvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Job notification polling integration
  const {
    jobNotifications,
    isPolling,
    startPolling,
    stopPolling
  } = useJobNotificationPolling(isAvailable, 10000);

  // Get client-side token
  const getClientToken = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  };

  // Fetch availability status
  useEffect(() => {
    const fetchAvailability = async () => {
      if (typeof window === "undefined" || authLoading || !isAuthenticated || user?.role !== "technician") {
        setIsAvailable(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = getClientToken();
        if (!token) {
          setIsAvailable(true);
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/technicians/toggle-availability`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setIsAvailable(data.isAvailable);
          }
        }
      } catch (error) {
        console.log("Failed to fetch availability, using default");
        setIsAvailable(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [authLoading, isAuthenticated, user?.role]);

  // Toggle availability
  const toggleAvailability = async () => {
    if (updating) return;

    try {
      setUpdating(true);
      const token = getClientToken();
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const response = await fetch(`/api/technicians/toggle-availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAvailable(data.isAvailable);

          // Control job notification polling
          if (data.isAvailable) {
            startPolling();
          } else {
            stopPolling();
          }

          // Notify parent component
          if (onToggle) {
            onToggle(data.isAvailable);
          }

          const message = data.isAvailable ? "You're now available for jobs" : "You're now unavailable";
          toast.success(message, { duration: 3000 });
        } else {
          throw new Error(data.message || "Failed to update availability");
        }
      } else {
        throw new Error("Failed to update availability");
      }
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error("Failed to update availability");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Toggle Switch */}
      <button
        onClick={toggleAvailability}
        disabled={updating}
        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isAvailable
            ? "bg-green-500 hover:bg-green-600"
            : "bg-gray-300 hover:bg-gray-400"
        } ${updating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        aria-label={`Toggle availability ${isAvailable ? "off" : "on"}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out ${
            isAvailable ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>

      {/* Status Text */}
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${
          variant === "header"
            ? (isAvailable ? "text-green-200" : "text-gray-200")
            : (isAvailable ? "text-green-700" : "text-gray-700")
        }`}>
          {updating ? "Updating..." : (isAvailable ? "Available" : "Unavailable")}
        </span>
        {isAvailable && jobNotifications.length > 0 && (
          <span className={`text-xs ${variant === "header" ? "text-yellow-200" : "text-orange-600"}`}>
            {jobNotifications.length} job{jobNotifications.length > 1 ? 's' : ''} pending
          </span>
        )}
        {isAvailable && isPolling && (
          <span className={`text-xs ${variant === "header" ? "text-blue-200" : "text-blue-600"}`}>
            • Listening for jobs
          </span>
        )}
      </div>
    </div>
  );
}
