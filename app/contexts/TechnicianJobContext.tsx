"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { toast } from "react-hot-toast";
import JobAlertNotification from "../components/technician/JobAlertNotification";
import AcceptedJobDetails from "../components/technician/AcceptedJobDetails";
import useAuth  from "../hooks/useAuth";
import { logger } from "../../app/config/logger";

// Define Job interface
export interface Job {
  paymentMethod?: "online" | "cash";
  id: string;
  bookingId: string;
  orderId?: string;
  paymentId?: string;
  appliance: string;
  location: {
    address: string;
    fullAddress?: string;
    distance?: number;
    coordinates?: { lat: number; lng: number };
  };
  earnings: {
    total: number;
    technicianEarnings: number;
    adminCommission: number;
    adminCommissionPercentage: number;
    paymentStatus?: "pending" | "paid" | "cancelled";
    payoutDate?: string;
    transactionId?: string;
  };
  customer: {
    name: string;
    phone?: string;
  };
  description?: string;
  urgency?: "normal" | "high" | "emergency";
  status: "pending" | "accepted" | "in-progress" | "completed" | "rejected";
  createdAt: string;
  completedAt?: string;
  assignedAt?: string;
}

// Define earnings summary interface
export interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  lastPayoutDate?: string;
  lastPayoutAmount?: number;
}

// Define job earnings response interface
export interface JobEarningsResponse {
  success: boolean;
  summary: EarningsSummary;
  jobHistory: Job[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

// Define WebSocket message interface
interface WebSocketMessage {
  type: "new_job" | "ping" | "pong";
  job?: Partial<Job> & { totalAmount?: number };
}

// Define context type
export interface TechnicianJobContextType {
  activeJob: Job | null;
  acceptedJob: Job | null;
  jobHistory: Job[];
  isLoading: boolean;
  error: string | null;
  acceptJob: (jobId: string) => Promise<void>;
  rejectJob: (jobId: string, reason?: string) => Promise<void>;
  clearJob: () => void;
  startService: () => Promise<void>;
  completeService: () => Promise<void>;
  sendArrivalMessage: (message: string) => Promise<void>;
  closeAcceptedJobDetails: () => void;
  refreshJobHistory: () => Promise<void>;
  fetchJobEarnings: (params?: {
    limit?: number;
    skip?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<JobEarningsResponse>;
}

// Create context
export const TechnicianJobContext = createContext<TechnicianJobContextType | undefined>(undefined);

// Custom hook to use the context
export function useTechnicianJob(): TechnicianJobContextType {
  const context = useContext(TechnicianJobContext);
  if (context === undefined) {
    const errorMessage = "useTechnicianJob must be used within a TechnicianJobProvider";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  return context;
}

// Provider component
export function TechnicianJobProvider({ children }: { children: ReactNode }) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [acceptedJob, setAcceptedJob] = useState<Job | null>(null);
  const [jobHistory, setJobHistory] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

  // Utility to get client-side token (consistent with useAuth, AvailabilityToggle, NotificationBadge)
  const getClientToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) logger.debug("No token found in localStorage");
    return token;
  }, []);

  // Fetch commission rate
  const fetchCommissionRate = useCallback(async (signal: AbortSignal): Promise<number> => {
    if (!API_URL) {
      logger.error("API_URL not configured");
      return 30;
    }

    try {
      const response = await fetch(`${API_URL}/admin/settings/commission`, {
        headers: { "Content-Type": "application/json" },
        signal,
      });
      if (!response.ok) throw new Error(`Failed to fetch commission rate: ${response.status}`);
      const data = await response.json();
      const commissionRate = data.commissionRate || 30;
      logger.info("Commission rate fetched", { commissionRate });
      return commissionRate;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        logger.debug("Commission rate fetch aborted");
        return 30;
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error fetching commission rate";
      logger.error(errorMessage);
      toast.error("Failed to load commission rate. Using default.", { duration: 4000 });
      return 30;
    }
  }, [API_URL]);

  // Fetch job history
  const fetchJobHistory = useCallback(async (signal?: AbortSignal) => {
    if (typeof window === "undefined" || authLoading || !isAuthenticated || user?.role !== "technician" || !API_URL) {
      logger.debug("Skipping job history fetch: SSR, unauthorized, or API_URL missing", {
        isAuthenticated,
        role: user?.role,
        authLoading,
      });
      return;
    }

    try {
      const token = getClientToken();
      if (!token) throw new Error("Authentication token missing");

      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/technicians/jobs/history?limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal,
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        throw new Error(`Failed to fetch job history: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.jobHistory)) {
        setJobHistory(data.jobHistory);
        logger.info("Job history fetched", { jobCount: data.jobHistory.length });
      } else {
        logger.warn("Invalid job history response, setting empty array");
        setJobHistory([]);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        logger.debug("Job history fetch aborted");
        return;
      }
      const errorMessage = err instanceof Error ? err.message : "Unknown error fetching job history";
      logger.error(errorMessage);
      setError(errorMessage);
      if (!errorMessage.includes("Unauthorized")) {
        toast.error("Failed to fetch job history", { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.role, API_URL, getClientToken]);

  // Initialize WebSocket and fetch job history
  useEffect(() => {
    if (typeof window === "undefined" || authLoading || !isAuthenticated || user?.role !== "technician" || !WS_URL || !API_URL) {
      logger.debug("Skipping WebSocket initialization: SSR, unauthorized, or URLs missing", {
        isAuthenticated,
        role: user?.role,
        authLoading,
      });
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseReconnectDelay = 5000;

    const connectWebSocket = async () => {
      try {
        const token = getClientToken();
        if (!token) {
          logger.error("No token for WebSocket connection");
          return;
        }

        const abortController = new AbortController();
        await fetchJobHistory(abortController.signal);

        const wsUrl = `${WS_URL}/technician?token=${token}`;
        ws = new WebSocket(wsUrl);
        setSocket(ws);

        ws.onopen = () => {
          logger.info("WebSocket connected", { userId: user?.userId });
          reconnectAttempts = 0;
          toast.success("Connected to job notifications", { duration: 2000 });
        };

        ws.onmessage = async (event) => {
          try {
            const data: WebSocketMessage = JSON.parse(event.data);
            if (data.type === "new_job" && data.job) {
              const abortController = new AbortController();
              const adminCommissionPercentage = await fetchCommissionRate(abortController.signal);
              const totalAmount = data.job.totalAmount || 0;
              const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
              const technicianEarnings = totalAmount - adminCommission;

              const newJob: Job = {
                paymentMethod: data.job.paymentMethod,
                id: data.job.id || crypto.randomUUID(),
                bookingId: data.job.bookingId || "",
                orderId: data.job.orderId,
                paymentId: data.job.paymentId,
                appliance: data.job.appliance || "Unknown",
                location: {
                  address: data.job.location?.address || "Unknown",
                  fullAddress: data.job.location?.fullAddress,
                  distance: data.job.location?.distance ?? 0,
                  coordinates: data.job.location?.coordinates,
                },
                earnings: {
                  total: totalAmount,
                  technicianEarnings,
                  adminCommission,
                  adminCommissionPercentage,
                  paymentStatus: data.job.earnings?.paymentStatus,
                  payoutDate: data.job.earnings?.payoutDate,
                  transactionId: data.job.earnings?.transactionId,
                },
                customer: data.job.customer || { name: "Unknown" },
                description: data.job.description,
                urgency: data.job.urgency,
                status: data.job.status || "pending",
                createdAt: data.job.createdAt || new Date().toISOString(),
                completedAt: data.job.completedAt,
                assignedAt: data.job.assignedAt,
              };

              setActiveJob(newJob);
              logger.info("New job received", { jobId: newJob.id });

              try {
                const audio = new Audio("/sounds/notification.mp3");
                await audio.play();
              } catch (err) {
                logger.warn("Failed to play notification sound");
                toast.error("Notification sound blocked by browser", { duration: 2000 });
              }
            }
          } catch (err) {
            logger.error("Error processing WebSocket message");
          }
        };

        ws.onerror = () => {
          logger.error("WebSocket error");
        };

        ws.onclose = () => {
          logger.info("WebSocket closed", { reconnectAttempts });
          setSocket(null);
          if (reconnectAttempts < maxReconnectAttempts && document.visibilityState === "visible") {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
            reconnectTimeout = setTimeout(() => {
              reconnectAttempts++;
              connectWebSocket();
            }, delay);
            logger.info(`Reconnecting WebSocket in ${delay}ms`, { attempt: reconnectAttempts + 1 });
          } else {
            logger.error("Max WebSocket reconnect attempts reached or tab inactive");
            setError("Failed to reconnect to job notifications");
            toast.error("Lost connection to job notifications", { duration: 4000 });
          }
        };

        // Heartbeat to keep connection alive (only when tab is visible)
        heartbeatInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN && document.visibilityState === "visible") {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);

        return () => {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        };
      } catch (err) {
        logger.error("Error initializing WebSocket");
      }
    };

    connectWebSocket();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [authLoading, isAuthenticated, user?.role, user?.userId, WS_URL, API_URL, getClientToken, fetchJobHistory]);

  // Handle job offer acceptance
  const acceptJob = useCallback(
    async (jobId: string): Promise<void> => {
      if (!activeJob || activeJob.id !== jobId || !API_URL) {
        const errorMessage = "Job not found, already processed, or API_URL missing";
        logger.error(errorMessage, { jobId });
        throw new Error(errorMessage);
      }

      try {
        const token = getClientToken();
        if (!token) throw new Error("Authentication token missing");

        setIsLoading(true);
        setError(null);

        const abortController = new AbortController();
        const response = await fetch(`${API_URL}/technicians/jobs/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            logger.error("Unauthorized: Logging out");
            await logout();
            throw new Error("Unauthorized");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to accept job: ${response.status}`);
        }

        setAcceptedJob({ ...activeJob, status: "accepted" });
        setActiveJob(null);
        toast.success("Job accepted! Proceed to service details.", { duration: 4000 });
        logger.info("Job accepted", { jobId });

        setTimeout(() => fetchJobHistory(), 2000); // Debounced refresh
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error accepting job";
        logger.error(errorMessage, { jobId });
        setError(errorMessage);
        if (!errorMessage.includes("Unauthorized")) {
          toast.error("Failed to accept job", { duration: 4000 });
        }
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [activeJob, API_URL, getClientToken, logout, fetchJobHistory]
  );

  // Handle job rejection
  const rejectJob = useCallback(
    async (jobId: string, reason?: string): Promise<void> => {
      if (!activeJob || activeJob.id !== jobId || !API_URL) {
        const errorMessage = "Job not found, already processed, or API_URL missing";
        logger.error(errorMessage, { jobId });
        throw new Error(errorMessage);
      }

      try {
        const token = getClientToken();
        if (!token) throw new Error("Authentication token missing");

        setIsLoading(true);
        setError(null);

        const abortController = new AbortController();
        const response = await fetch(`${API_URL}/technicians/jobs/reject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId, reason }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            logger.error("Unauthorized: Logging out");
            await logout();
            throw new Error("Unauthorized");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to reject job: ${response.status}`);
        }

        setActiveJob(null);
        toast.success("Job rejected successfully", { duration: 4000 });
        logger.info("Job rejected", { jobId, reason });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error rejecting job";
        logger.error(errorMessage, { jobId });
        setError(errorMessage);
        if (!errorMessage.includes("Unauthorized")) {
          toast.error("Failed to reject job", { duration: 4000 });
        }
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [activeJob, API_URL, getClientToken, logout]
  );

  // Clear active job
  const clearJob = useCallback(() => {
    setActiveJob(null);
    logger.info("Active job cleared");
  }, []);

  // Close accepted job details
  const closeAcceptedJobDetails = useCallback(() => {
    setAcceptedJob(null);
    logger.info("Accepted job details closed");
  }, []);

  // Start service
  const startService = useCallback(
    async (): Promise<void> => {
      if (!acceptedJob || !API_URL) {
        const errorMessage = "No accepted job found or API_URL missing";
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const token = getClientToken();
        if (!token) throw new Error("Authentication token missing");

        setIsLoading(true);
        setError(null);

        const abortController = new AbortController();
        const response = await fetch(`${API_URL}/technicians/jobs/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ jobId: acceptedJob.id }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            logger.error("Unauthorized: Logging out");
            await logout();
            throw new Error("Unauthorized");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to start service: ${response.status}`);
        }

        setAcceptedJob({ ...acceptedJob, status: "in-progress" });
        toast.success("Service started successfully", { duration: 4000 });
        logger.info("Service started", { jobId: acceptedJob.id });
        setTimeout(() => fetchJobHistory(), 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error starting service";
        logger.error(errorMessage, { jobId: acceptedJob?.id });
        setError(errorMessage);
        if (!errorMessage.includes("Unauthorized")) {
          toast.error("Failed to start service", { duration: 4000 });
        }
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [acceptedJob, API_URL, getClientToken, logout, fetchJobHistory]
  );

  // Send arrival message to customer
  const sendArrivalMessage = useCallback(
    async (message: string): Promise<void> => {
      if (!acceptedJob || !API_URL) {
        const errorMessage = "No accepted job found or API_URL missing";
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const token = getClientToken();
        if (!token) throw new Error("Authentication token missing");

        setIsLoading(true);
        setError(null);

        const abortController = new AbortController();
        const response = await fetch(`${API_URL}/technicians/bookings/${acceptedJob.bookingId}/notify-customer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            notificationType: "arrival",
            message,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            logger.error("Unauthorized: Logging out");
            await logout();
            throw new Error("Unauthorized");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to send arrival notification: ${response.status}`);
        }

        toast.success("Arrival notification sent", { duration: 4000 });
        logger.info("Arrival notification sent", { jobId: acceptedJob.id, message });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error sending arrival message";
        logger.error(errorMessage, { jobId: acceptedJob?.id });
        setError(errorMessage);
        if (!errorMessage.includes("Unauthorized")) {
          toast.error("Failed to send arrival notification", { duration: 4000 });
        }
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [acceptedJob, API_URL, getClientToken, logout]
  );

  // Complete service
  const completeService = useCallback(
    async (): Promise<void> => {
      if (!acceptedJob || !API_URL) {
        const errorMessage = "No accepted job found or API_URL missing";
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const token = getClientToken();
        if (!token) throw new Error("Authentication token missing");

        setIsLoading(true);
        setError(null);

        const abortController = new AbortController();
        const response = await fetch(`${API_URL}/technicians/bookings/${acceptedJob.bookingId}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            jobId: acceptedJob.id,
            bookingId: acceptedJob.bookingId,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            logger.error("Unauthorized: Logging out");
            await logout();
            throw new Error("Unauthorized");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to complete service: ${response.status}`);
        }

        setAcceptedJob(null);
        toast.success("Service completed successfully", { duration: 4000 });
        logger.info("Service completed", { jobId: acceptedJob.id });
        setTimeout(() => fetchJobHistory(), 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error completing service";
        logger.error(errorMessage, { jobId: acceptedJob?.id });
        setError(errorMessage);
        if (!errorMessage.includes("Unauthorized")) {
          toast.error("Failed to complete service", { duration: 4000 });
        }
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [acceptedJob, API_URL, getClientToken, logout, fetchJobHistory]
  );

  // Handle job timeout
  const handleTimeout = useCallback(() => {
    if (activeJob) {
      setActiveJob(null);
      toast.error("Job offer expired", { duration: 4000 });
      logger.info("Job offer timed out", { jobId: activeJob.id });
    }
  }, [activeJob]);

  // Fetch job earnings
  const fetchJobEarnings = useCallback(
    async (params?: {
      limit?: number;
      skip?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<JobEarningsResponse> => {
      if (typeof window === "undefined" || authLoading || !isAuthenticated || user?.role !== "technician" || !API_URL) {
        const errorMessage = "Cannot fetch job earnings: SSR, unauthorized, or API_URL missing";
        logger.error(errorMessage, { isAuthenticated, role: user?.role });
        throw new Error(errorMessage);
      }

      try {
        const token = getClientToken();
        if (!token) throw new Error("Authentication token missing");

        setIsLoading(true);
        setError(null);

        const queryParams = new URLSearchParams();
        if (params?.limit) queryParams.append("limit", params.limit.toString());
        if (params?.skip) queryParams.append("skip", params.skip.toString());
        if (params?.status) queryParams.append("status", params.status);
        if (params?.startDate) queryParams.append("startDate", params.startDate);
        if (params?.endDate) queryParams.append("endDate", params.endDate);

        const abortController = new AbortController();
        const response = await fetch(`${API_URL}/technicians/jobs/earnings?${queryParams.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            logger.error("Unauthorized: Logging out");
            await logout();
            throw new Error("Unauthorized");
          }
          throw new Error(`Failed to fetch job earnings: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.message || "Invalid job earnings response");

        logger.info("Job earnings fetched", { jobCount: data.jobHistory.length });
        return {
          success: data.success,
          summary: data.summary,
          jobHistory: data.jobHistory,
          pagination: data.pagination,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error fetching job earnings";
        logger.error(errorMessage);
        setError(errorMessage);
        if (!errorMessage.includes("Unauthorized")) {
          toast.error("Failed to fetch job earnings", { duration: 4000 });
        }
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [authLoading, isAuthenticated, user?.role, API_URL, getClientToken, logout]
  );

  return (
    <TechnicianJobContext.Provider
      value={{
        activeJob,
        acceptedJob,
        jobHistory,
        isLoading,
        error,
        acceptJob,
        rejectJob,
        clearJob,
        startService,
        completeService,
        sendArrivalMessage,
        closeAcceptedJobDetails,
        refreshJobHistory: fetchJobHistory,
        fetchJobEarnings,
      }}
    >
      {children}
      {activeJob && (
        <JobAlertNotification
          job={{
            ...activeJob,
            location: {
              ...activeJob.location,
              distance: activeJob.location.distance ?? 0,
            },
          }}
          timeoutSeconds={30}
          onAccept={acceptJob}
          onReject={rejectJob}
          onTimeout={handleTimeout}
        />
      )}
      {acceptedJob && (
        <AcceptedJobDetails
          job={{
            ...acceptedJob,
            location: {
              ...acceptedJob.location,
              distance: acceptedJob.location.distance ?? 0,
            },
          }}
          onClose={closeAcceptedJobDetails}
          onStartService={startService}
          onCompleteService={completeService}
          onSendArrivalMessage={sendArrivalMessage}
        />
      )}
    </TechnicianJobContext.Provider>
  );
}