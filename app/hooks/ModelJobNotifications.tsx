
"use client";

import { useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { logger } from "../config/logger";
import useAuth  from "../hooks/useAuth";
import React from "react";

export interface Job {
  id: string;
  title: string;
  location: { distance?: number };
}

export interface JobWithEarnings extends Job {
  earnings: {
    total: number;
    technicianEarnings: number;
    adminCommission: number;
    adminCommissionPercentage: number;
    paymentStatus?: "pending" | "paid" | "cancelled";
    payoutDate?: string | null;
    transactionId?: string | null;
  };
  completedAt?: string | null;
}

export interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  lastPayoutDate?: string | null;
  lastPayoutAmount?: number;
}

export interface JobEarningsResponse {
  message: string;
  success: boolean;
  summary: EarningsSummary;
  jobHistory: JobWithEarnings[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface JobNotificationContextType {
  activeJob: Job | null;
  acceptedJob: Job | null;
  jobHistory: Job[];
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

export const JobNotificationContext = React.createContext<JobNotificationContextType | undefined>(undefined);

export function JobNotificationProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [acceptedJob, setAcceptedJob] = useState<Job | null>(null);
  const [jobHistory, setJobHistory] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<"network" | "auth" | null>(null);
  const { user, isAuthenticated, isTechnician, isLoading: authLoading } = useAuth();
  // If token is part of user, extract it here
  const token = user && "token" in user ? (user as any).token : undefined;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  // Fetch job data
  useEffect(() => {
    const fetchJobs = async () => {
      if (typeof window === "undefined" || authLoading || !isAuthenticated || !isTechnician) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        if (!token) {
          setError("auth");
          logger.error("No authentication token for jobs");
          toast.error("Authentication required. Please log in.", { duration: 4000 });
          return;
        }

        const response = await fetch(`${API_URL}/technicians/jobs/active`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch jobs: ${response.status}`);
        }

        const data: { success: boolean; activeJob?: Job; acceptedJob?: Job; jobHistory: Job[] } = await response.json();
        if (data.success) {
          setActiveJob(data.activeJob || null);
          setAcceptedJob(data.acceptedJob || null);
          setJobHistory(data.jobHistory || []);
          logger.info("Jobs fetched", { activeJobId: data.activeJob?.id, acceptedJobId: data.acceptedJob?.id });
        } else {
          throw new Error("Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error fetching jobs";
        logger.error(errorMessage, { error });
        setError(errorMessage.includes("Failed to fetch") ? "network" : "auth");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [authLoading, isAuthenticated, isTechnician, token]);

  // Accept job
  const acceptJob = useCallback(
    async (jobId: string) => {
      try {
        if (!token) {
          throw new Error("No authentication token");
        }

        const response = await fetch(`${API_URL}/technicians/jobs/${jobId}/accept`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to accept job: ${response.status}`);
        }

        const data: {
          message: string; success: boolean; job: Job 
} = await response.json();
        if (data.success) {
          setActiveJob(null);
          setAcceptedJob(data.job);
          logger.info("Job accepted", { jobId });
          toast.success("Job accepted successfully");
        } else {
          throw new Error(data.message || "Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to accept job";
        logger.error(errorMessage, { error });
        toast.error(errorMessage, { duration: 4000 });
      }
    },
    [token]
  );

  // Reject job
  const rejectJob = useCallback(
    async (jobId: string, reason?: string) => {
      try {
        if (!token) {
          throw new Error("No authentication token");
        }

        const response = await fetch(`${API_URL}/technicians/jobs/${jobId}/reject`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to reject job: ${response.status}`);
        }

        const data: {
          message: string; success: boolean 
} = await response.json();
        if (data.success) {
          setActiveJob(null);
          logger.info("Job rejected", { jobId, reason });
          toast.success("Job rejected successfully");
        } else {
          throw new Error(data.message || "Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to reject job";
        logger.error(errorMessage, { error });
        toast.error(errorMessage, { duration: 4000 });
      }
    },
    [token]
  );

  // Clear active job
  const clearJob = useCallback(() => {
    setActiveJob(null);
    logger.info("Active job cleared");
  }, []);

  // Refresh job history
  const refreshJobHistory = useCallback(async () => {
    try {
      if (!token) {
        throw new Error("No authentication token");
      }

      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/technicians/jobs/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch job history: ${response.status}`);
      }

      const data: {
        message: string; success: boolean; jobHistory: Job[] 
} = await response.json();
      if (data.success) {
        setJobHistory(data.jobHistory || []);
        logger.info("Job history refreshed", { jobCount: data.jobHistory.length });
      } else {
        throw new Error(data.message || "Invalid API response");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh job history";
      logger.error(errorMessage, { error });
      setError(errorMessage.includes("Failed to fetch") ? "network" : "auth");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch job earnings
  const fetchJobEarnings = useCallback(
    async (params: { limit?: number; skip?: number; status?: string; startDate?: string; endDate?: string } = {}) => {
      try {
        if (!token) {
          throw new Error("No authentication token");
        }

        const query = new URLSearchParams();
        if (params.limit) query.append("limit", params.limit.toString());
        if (params.skip) query.append("skip", params.skip.toString());
        if (params.status) query.append("status", params.status);
        if (params.startDate) query.append("startDate", params.startDate);
        if (params.endDate) query.append("endDate", params.endDate);

        const response = await fetch(`${API_URL}/technicians/earnings?${query}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch earnings: ${response.status}`);
        }

        const data: JobEarningsResponse = await response.json();
        if (data.success) {
          logger.info("Earnings fetched", { totalItems: data.totalItems });
          return data;
        } else {
          throw new Error(data.message || "Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch earnings";
        logger.error(errorMessage, { error });
        throw error;
      }
    },
    [token]
  );

  return (
    <JobNotificationContext.Provider
      value={{
        activeJob,
        acceptedJob,
        jobHistory,
        isLoading,
        error,
        acceptJob,
        rejectJob,
        clearJob,
        refreshJobHistory,
        fetchJobEarnings,
      }}
    >
      {children}
    </JobNotificationContext.Provider>
  );
}

export function useJobNotifications(): JobNotificationContextType {
  const context = useContext(JobNotificationContext);

  if (!context) {
    const errorMessage = "useJobNotifications must be used within a JobNotificationProvider";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return context;
}
