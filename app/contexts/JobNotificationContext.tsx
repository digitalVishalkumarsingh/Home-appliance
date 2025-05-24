"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "react-hot-toast";
import JobAlertNotification from "../components/technician/JobAlertNotification";
import { JobEarningsResponse } from "../hooks/ModelJobNotifications";
import { getCurrentUser } from "../lib/auth";
import { logger } from "../../app/config/logger";

// Define types for clarity (assuming these are in ModelJobNotifications)
interface LocalJob {
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

interface JobNotificationContextType {
  activeJob: LocalJob | null;
  jobHistory: LocalJob[];
  isLoading: boolean;
  error: "network" | "auth" | null;
  acceptJob: (jobId: string) => Promise<void>;
  rejectJob: (jobId: string, reason?: string) => Promise<void>;
  clearJob: () => void;
  refreshJobHistory: () => Promise<void>;
  fetchJobEarnings: (params?: {
    limit?: number;
    skip?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<JobEarningsResponse>;
}

export const JobNotificationContext = createContext<JobNotificationContextType | undefined>(undefined);

export function useJobNotification() {
  const context = useContext(JobNotificationContext);
  if (context === undefined) {
    throw new Error("useJobNotification must be used within a JobNotificationProvider");
  }
  return context;
}

interface JobNotificationProviderProps {
  children: ReactNode;
}

export function JobNotificationProvider({ children }: JobNotificationProviderProps) {
  const [activeJob, setActiveJob] = useState<LocalJob | null>(null);
  const [jobHistory, setJobHistory] = useState<LocalJob[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<"network" | "auth" | null>(null);

  // Utility to get token client-side
  const getClientToken = (): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) logger.warn("No token found in localStorage");
    return token;
  };

  // Fetch job history
  const fetchJobHistory = async () => {
    if (typeof window === "undefined") {
      logger.debug("Skipping job history fetch in server environment");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const user = await getCurrentUser();
      if (!user || user.role !== "technician") {
        logger.warn("User is not a technician or not authenticated");
        setError("auth");
        toast.error("Not authorized to fetch job history");
        return;
      }

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(`${apiUrl}/technicians/jobs/history?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job history: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.jobHistory)) {
        setJobHistory(data.jobHistory);
      } else {
        throw new Error(data.message || "Invalid job history response");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error fetching job history";
      logger.error(errorMessage, { error: err });
      setError(errorMessage.includes("Authentication") ? "auth" : "network");
      toast.error("Failed to fetch job history");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch commission rate
  const fetchCommissionRate = async (): Promise<number> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(`${apiUrl}/admin/settings/commission`);
      if (!response.ok) {
        throw new Error(`Failed to fetch commission rate: ${response.status}`);
      }

      const data = await response.json();
      return data.commissionRate || 30; // Default to 30%
    } catch (err) {
      logger.error("Error fetching commission rate", { error: err instanceof Error ? err.message : String(err) });
      return 30; // Default to 30%
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (typeof window === "undefined") {
      logger.debug("Skipping WebSocket initialization in server environment");
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 5000;

    const connectWebSocket = async () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        logger.error("Max WebSocket reconnect attempts reached");
        setError("network");
        toast.error("Unable to connect to job notifications");
        return;
      }

      try {
        const user = await getCurrentUser();
        if (!user || user.role !== "technician") {
          logger.warn("User is not a technician or not authenticated");
          setError("auth");
          return;
        }

        const token = getClientToken();
        if (!token) {
          logger.error("No token found for WebSocket connection");
          setError("auth");
          return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
        if (!wsUrl) {
          throw new Error("WebSocket URL not configured");
        }

        // Fetch job history on mount
        fetchJobHistory();

        // Initialize WebSocket
        ws = new WebSocket(`${wsUrl}/technician?token=${token}`);
        setSocket(ws);

        ws.onopen = () => {
          logger.info("WebSocket connected");
          reconnectAttempts = 0; // Reset on successful connection
        };

        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "new_job" && data.job) {
              const adminCommissionPercentage = await fetchCommissionRate();
              const totalAmount = data.job.totalAmount ?? 0;
              const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
              const technicianEarnings = totalAmount - adminCommission;

              const newJob: LocalJob = {
                id: data.job.id,
                bookingId: data.job.bookingId,
                appliance: data.job.appliance ?? "Unknown",
                location: {
                  address: data.job.location?.address ?? "",
                  distance: data.job.location?.distance ?? 0,
                  fullAddress: data.job.location?.fullAddress ?? "",
                },
                earnings: {
                  total: totalAmount,
                  technicianEarnings,
                  adminCommission,
                  adminCommissionPercentage,
                },
                customer: data.job.customer ?? "Unknown",
                description: data.job.description ?? "",
                urgency: data.job.urgency ?? "normal",
                createdAt: data.job.createdAt ?? new Date().toISOString(),
              };

              setActiveJob(newJob);

              try {
                const audio = new Audio("/sounds/notification.mp3");
                await audio.play();
              } catch (err) {
                logger.error("Failed to play notification sound", { error: err instanceof Error ? err.message : String(err) });
              }
            }
          } catch (err) {
            logger.error("Error processing WebSocket message", { error: err instanceof Error ? err.message : String(err) });
          }
        };

        ws.onerror = (err) => {
          logger.error("WebSocket error", { error: (err as Event).type || "Unknown error" });
        };

        ws.onclose = () => {
          logger.info(`WebSocket closed, reconnecting in ${baseReconnectDelay}ms (attempt ${reconnectAttempts + 1})`);
          setSocket(null);
          reconnectAttempts++;
          setTimeout(connectWebSocket, baseReconnectDelay * Math.pow(1.5, reconnectAttempts));
        };
      } catch (err) {
        logger.error("Error initializing WebSocket", { error: err instanceof Error ? err.message : String(err) });
        setError("network");
        setTimeout(connectWebSocket, baseReconnectDelay * Math.pow(1.5, reconnectAttempts));
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
        logger.info("WebSocket connection closed on cleanup");
      }
    };
  }, []);

  // Handle job acceptance
  const acceptJob = async (jobId: string): Promise<void> => {
    if (!activeJob || activeJob.id !== jobId) {
      logger.error("Job not found or already processed", { jobId });
      throw new Error("Job not found or already processed");
    }

    try {
      setIsLoading(true);
      setError(null);

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
        body: JSON.stringify({ jobId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to accept job: ${response.status}`);
      }

      setJobHistory((prev) => [activeJob, ...prev]);
      setActiveJob(null);
      toast.success("Job accepted successfully! Navigate to your bookings to see details.");

      setTimeout(() => {
        fetchJobHistory();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error accepting job";
      logger.error(errorMessage, { error: err });
      setError(errorMessage.includes("Authentication") ? "auth" : "network");
      toast.error("Failed to accept job. Please try again.");
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job rejection
  const rejectJob = async (jobId: string, reason?: string): Promise<void> => {
    if (!activeJob || activeJob.id !== jobId) {
      logger.error("Job not found or already processed", { jobId });
      throw new Error("Job not found or already processed");
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const response = await fetch(`${apiUrl}/technicians/jobs/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId, reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject job: ${response.status}`);
      }

      setActiveJob(null);
      toast.success("Job rejected successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error rejecting job";
      logger.error(errorMessage, { error: err });
      setError(errorMessage.includes("Authentication") ? "auth" : "network");
      toast.error("Failed to reject job. Please try again.");
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job timeout
  const handleTimeout = (jobId: string) => {
    if (activeJob && activeJob.id === jobId) {
      setActiveJob(null);
      toast.error("Job offer expired");
    }
  };

  // Clear active job
  const clearJob = () => {
    setActiveJob(null);
  };

  // Fetch job earnings
  const fetchJobEarnings = async (params?: {
    limit?: number;
    skip?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<JobEarningsResponse> => {
    if (typeof window === "undefined") {
      logger.error("Cannot fetch job earnings in server environment");
      throw new Error("Cannot fetch job earnings in server environment");
    }

    try {
      setIsLoading(true);
      setError(null);

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.skip) queryParams.append("skip", params.skip.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);

      const response = await fetch(`${apiUrl}/technicians/jobs/earnings?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job earnings: ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch job earnings");
      }

      return {
        summary: data.summary,
        jobHistory: data.jobHistory,
        message: data.message ?? "",
        success: data.success ?? false,
        totalItems: data.totalItems ?? 0,
        totalPages: data.totalPages ?? 0,
        currentPage: data.currentPage ?? 1,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error fetching job earnings";
      logger.error(errorMessage, { error: err });
      setError(errorMessage.includes("Authentication") ? "auth" : "network");
      toast.error("Failed to fetch job earnings");
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <JobNotificationContext.Provider
      value={{
        activeJob,
        jobHistory,
        isLoading,
        error,
        acceptJob,
        rejectJob,
        clearJob,
        refreshJobHistory: fetchJobHistory,
        fetchJobEarnings,
      }}
    >
      {children}
      {activeJob && (
        <JobAlertNotification
          job={{
            ...activeJob,
            appliance: activeJob.appliance ?? "Unknown",
            customer: typeof activeJob.customer === "object" && activeJob.customer !== null
              ? activeJob.customer
              : { name: activeJob.customer ?? "Unknown" },
            createdAt: activeJob.createdAt ?? new Date().toISOString(),
            location: {
              address: activeJob.location?.address ?? "",
              distance: activeJob.location?.distance ?? 0,
              fullAddress: activeJob.location?.fullAddress ?? "",
            },
            earnings: {
              total: activeJob.earnings?.total ?? 0,
              technicianEarnings: activeJob.earnings?.technicianEarnings ?? 0,
              adminCommission: activeJob.earnings?.adminCommission ?? 0,
              adminCommissionPercentage: activeJob.earnings?.adminCommissionPercentage ?? 0,
            },
            urgency:
              activeJob.urgency === "normal" ||
              activeJob.urgency === "high" ||
              activeJob.urgency === "emergency"
                ? activeJob.urgency
                : "normal",
          }}
          timeoutSeconds={30}
          onAccept={acceptJob}
          onReject={rejectJob}
          onTimeout={handleTimeout}
        />
      )}
    </JobNotificationContext.Provider>
  );
}