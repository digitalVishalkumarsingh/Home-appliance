"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Button from "../ui/Button";
import useAuth from "../../hooks/useAuth";
import { useTechnicianJob } from "../../contexts/TechnicianJobContext";
import { logger } from "../../config/logger";
import { NetworkError, AuthError } from "../ui/ErrorDisplay";

// Define types (aligned with auth.ts and TechnicianJobContext)
interface UserPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

interface Job {
  id: string;
  bookingId: string;
  appliance: string;
  location: {
    address: string;
    distance: number;
    fullAddress: string;
  };
  earnings: {
    total: number;
    technicianEarnings: number;
    adminCommission: number;
    adminCommissionPercentage: number;
  };
  customer: string;
  description: string;
  urgency: string;
  createdAt: string;
}

interface AvailabilityResponse {
  success: boolean;
  isAvailable: boolean;
  message?: string;
}

export default function AvailabilityToggle() {
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<"network" | "auth" | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeJob, acceptedJob } = useTechnicianJob();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Utility to get client-side token (consistent with JobNotificationProvider)
  const getClientToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) logger.warn("No token found in localStorage");
    return token;
  }, []);

  // Fetch availability status
  useEffect(() => {
    const fetchAvailability = async () => {
      if (typeof window === "undefined" || authLoading || !isAuthenticated || user?.role !== "technician") {
        logger.debug("Skipping availability fetch: SSR or unauthorized", {
          isAuthenticated,
          role: user?.role,
          authLoading,
        });
        setIsAvailable(true);
        setLoading(false);
        return;
      }

      if (!API_URL) {
        logger.error("API URL not configured");
        setError("network");
        toast.error("Server configuration error", { duration: 4000 });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = getClientToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await fetch(`${API_URL}/technicians/toggle-availability`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error("Unauthorized");
          throw new Error(`Failed to fetch availability: ${response.status}`);
        }

        const data: AvailabilityResponse = await response.json();
        if (data.success) {
          setIsAvailable(data.isAvailable);
          logger.info("Availability fetched", { isAvailable: data.isAvailable });
        } else {
          throw new Error(data.message || "Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error fetching availability";
        logger.error(errorMessage);
        setError(errorMessage.includes("Unauthorized") ? "auth" : "network");
        toast.error(errorMessage.includes("Unauthorized") ? "Please log in again" : "Failed to load availability", {
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [authLoading, isAuthenticated, user?.role, API_URL, getClientToken]);

  // Toggle availability status
  const toggleAvailability = async () => {
    if (updating) return;
    if (activeJob || acceptedJob) {
      const jobId = activeJob?.id || acceptedJob?.id;
      toast.error(`Cannot change availability while job ${jobId} is active or accepted`, { duration: 4000 });
      logger.warn("Availability toggle blocked", { activeJobId: activeJob?.id, acceptedJobId: acceptedJob?.id });
      return;
    }

    if (!API_URL) {
      logger.error("API URL not configured");
      setError("network");
      toast.error("Server configuration error", { duration: 4000 });
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const maxRetries = 2;
      let attempt = 0;
      let response: Response | null = null;

      while (attempt <= maxRetries) {
        try {
          response = await fetch(`${API_URL}/technicians/toggle-availability`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) break;
          if (attempt === maxRetries) {
            if (response.status === 401) throw new Error("Unauthorized");
            throw new Error(`Failed to toggle availability: ${response.status}`);
          }
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff
        } catch (fetchError) {
          if (attempt === maxRetries) throw fetchError;
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }

      if (!response) throw new Error("No response from API");

      const data: AvailabilityResponse = await response.json();
      if (data.success) {
        setIsAvailable(data.isAvailable);
        toast.success(data.message || `You are now ${data.isAvailable ? "available" : "unavailable"} for jobs`, {
          duration: 4000,
        });
        logger.info("Availability toggled", { isAvailable: data.isAvailable });
      } else {
        throw new Error(data.message || "Invalid API response");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error toggling availability";
      logger.error(errorMessage);
      setError(errorMessage.includes("Unauthorized") ? "auth" : "network");
      toast.error(errorMessage.includes("Unauthorized") ? "Please log in again" : "Failed to toggle availability", {
        duration: 4000,
      });
    } finally {
      setUpdating(false);
    }
  };

  // Retry handler
  const handleRetry = useCallback(() => {
    if (error === "network") {
      toggleAvailability();
    } else if (error === "auth") {
      toast.error("Please log in again", { duration: 4000 });
      // Optionally trigger re-auth via useAuth
    }
  }, [error]);

  if (loading) {
    return (
      <Button
        variant="ghost"
        isLoading={true}
        className="bg-gray-100 rounded-full shadow-sm"
        disabled
      >
        Loading status...
      </Button>
    );
  }

  if (error) {
    return error === "network" ? (
      <NetworkError onRetry={handleRetry} showRetry={true} />
    ) : (
      <AuthError onRetry={handleRetry} showRetry={true} />
    );
  }

  return (
    <Button
      variant={isAvailable ? "success" : "danger"}
      isLoading={updating}
      loadingText="Updating..."
      toggleSwitch
      onClick={toggleAvailability}
      disabled={updating || !!activeJob || !!acceptedJob}
      className="rounded-full"
    >
      {isAvailable ? "Available for Jobs" : "Unavailable"}
      {!updating && (
        <span className={`text-xs ml-1 ${isAvailable ? "text-green-100" : "text-red-100"}`}>
          {isAvailable ? "(Online)" : "(Offline)"}
        </span>
      )}
    </Button>
  );
}