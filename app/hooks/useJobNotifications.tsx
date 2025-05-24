// app/components/JobNotificationProvider.tsx
"use client";

import { createContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { logger } from "../config/logger";
import useAuth from "../hooks/useAuth";
import  useApi  from "./useApi";

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

export const JobNotificationContext = createContext<JobNotificationContextType | undefined>(undefined);

export function JobNotificationProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [acceptedJob, setAcceptedJob] = useState<Job | null>(null);
  const [jobHistory, setJobHistory] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<"network" | "auth" | null>(null);
  const { user, isAuthenticated, isTechnician, isLoading: authLoading } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const jobHistoryApi = useApi<{ success: boolean; jobs: Job[] }>({
    url: `${API_URL}/technicians/jobs`,
    method: "GET",
    withAuth: true,
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: "Failed to fetch job history",
  });

  const acceptJobApi = useApi<{ success: boolean; job: Job }>({
    url: `${API_URL}/technicians/jobs/:jobId/accept`,
    method: "POST",
    withAuth: true,
    showSuccessToast: true,
    showErrorToast: true,
    errorMessage: "Failed to accept job",
  });

  const rejectJobApi = useApi<{ success: boolean }>({
    url: `${API_URL}/technicians/jobs/:jobId/reject`,
    method: "POST",
    withAuth: true,
    showSuccessToast: true,
    showErrorToast: true,
    errorMessage: "Failed to reject job",
  });

  const earningsApi = useApi<JobEarningsResponse>({
    url: `${API_URL}/technicians/earnings`,
    method: "GET",
    withAuth: true,
    showSuccessToast: false,
    showErrorToast: true,
    errorMessage: "Failed to fetch earnings",
  });

  const fetchJobHistory = useCallback(async () => {
    if (typeof window === "undefined" || authLoading || !isAuthenticated || !isTechnician) {
      setIsLoading(false);
      if (!isAuthenticated) setError("auth");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await jobHistoryApi.execute({
        url: `${API_URL}/technicians/jobs`,
      });
      if (data?.success) {
        setJobHistory(data.jobs || []);
        logger.info("Job history fetched", { jobCount: data.jobs.length });
      } else {
        throw new Error("Invalid API response");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error fetching job history";
      logger.error(errorMessage, { error });
      setError(errorMessage.includes("token") || errorMessage.includes("401") ? "auth" : "network");
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, isTechnician, jobHistoryApi]);

  useEffect(() => {
    fetchJobHistory();
  }, [fetchJobHistory]);

  const acceptJob = useCallback(
    async (jobId: string) => {
      if (!isAuthenticated || !isTechnician) {
        setError("auth");
        toast.error("You must be authenticated as a technician to accept jobs");
        return;
      }

      try {
        const data = await acceptJobApi.execute({
          url: `${API_URL}/technicians/jobs/${jobId}/accept`,
        });
        if (data?.success) {
          setActiveJob(null);
          setAcceptedJob(data.job);
          await fetchJobHistory();
        } else {
          throw new Error("Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to accept job";
        logger.error(errorMessage, { error, jobId });
        setError(errorMessage.includes("token") || errorMessage.includes("401") ? "auth" : "network");
      }
    },
    [acceptJobApi, fetchJobHistory, isAuthenticated, isTechnician]
  );

  const rejectJob = useCallback(
    async (jobId: string, reason?: string) => {
      if (!isAuthenticated || !isTechnician) {
        setError("auth");
        toast.error("You must be authenticated as a technician to reject jobs");
        return;
      }

      try {
        const data = await rejectJobApi.execute({
          url: `${API_URL}/technicians/jobs/${jobId}/reject`,
          body: reason ? { reason } : undefined,
        });
        if (data?.success) {
          setJobHistory((prev) => prev.filter((job) => job.id !== jobId));
          if (activeJob?.id === jobId) setActiveJob(null);
          if (acceptedJob?.id === jobId) setAcceptedJob(null);
          logger.info("Job rejected", { jobId, reason });
        } else {
          throw new Error("Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to reject job";
        logger.error(errorMessage, { error, jobId });
        setError(errorMessage.includes("token") || errorMessage.includes("401") ? "auth" : "network");
      }
    },
    [rejectJobApi, activeJob, acceptedJob, isAuthenticated, isTechnician]
  );

  const clearJob = useCallback(() => {
    setActiveJob(null);
    setAcceptedJob(null);
    logger.info("Active and accepted jobs cleared");
  }, []);

  const refreshJobHistory = useCallback(async () => {
    await fetchJobHistory();
  }, [fetchJobHistory]);

  const fetchJobEarnings = useCallback(
    async (params: { limit?: number; skip?: number; status?: string; startDate?: string; endDate?: string } = {}) => {
      if (!isAuthenticated || !isTechnician) {
        setError("auth");
        toast.error("You must be authenticated as a technician to view earnings");
        return {
          success: false,
          summary: { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0 },
          jobHistory: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
        };
      }

      const { limit = 10, skip = 0, status, startDate, endDate } = params;
      try {
        const query = new URLSearchParams({
          limit: limit.toString(),
          skip: skip.toString(),
          ...(status && { status }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        }).toString();

        const data = await earningsApi.execute({
          url: `${API_URL}/technicians/earnings?${query}`,
        });

        if (data?.success) {
          logger.info("Earnings fetched", { totalItems: data.totalItems });
          return data;
        } else {
          throw new Error("Invalid API response");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch earnings";
        logger.error(errorMessage, { error });
        setError(errorMessage.includes("token") || errorMessage.includes("401") ? "auth" : "network");
        return {
          success: false,
          summary: { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0 },
          jobHistory: [],
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
        };
      }
    },
    [earningsApi, isAuthenticated, isTechnician]
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