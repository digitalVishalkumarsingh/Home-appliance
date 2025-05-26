"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { logger } from "../config/logger";
import useAuth from "./useAuth";

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

interface JobNotificationResponse {
  success: boolean;
  jobNotifications: JobNotification[];
  total: number;
  technicianId?: string;
  isAvailable?: boolean;
  message?: string;
  fallback?: boolean;
}

interface UseJobNotificationPollingReturn {
  jobNotifications: JobNotification[];
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  checkNow: () => Promise<void>;
}

export function useJobNotificationPolling(
  isAvailable: boolean = true,
  pollingInterval: number = 10000 // 10 seconds
): UseJobNotificationPollingReturn {
  const [jobNotifications, setJobNotifications] = useState<JobNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get client-side token
  const getClientToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) logger.warn("No token found in localStorage");
    return token;
  }, []);

  // Fetch job notifications
  const fetchJobNotifications = useCallback(async (): Promise<void> => {
    if (typeof window === "undefined" || authLoading || !isAuthenticated || user?.role !== "technician") {
      logger.debug("Skipping job notification fetch: SSR, unauthorized, or not technician", {
        isAuthenticated,
        role: user?.role,
        authLoading,
      });
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const token = getClientToken();
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const response = await fetch("/api/technicians/job-notifications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error(`Failed to fetch job notifications: ${response.status}`);
      }

      const data: JobNotificationResponse = await response.json();
      
      if (data.success) {
        const newNotifications = data.jobNotifications || [];
        
        // Check for new notifications
        const previousIds = jobNotifications.map(n => n._id);
        const newIds = newNotifications.map(n => n._id);
        const hasNewNotifications = newIds.some(id => !previousIds.includes(id));
        
        setJobNotifications(newNotifications);
        setLastChecked(new Date());
        
        // Show toast for new notifications (only if not using fallback data)
        if (hasNewNotifications && newNotifications.length > 0 && !data.fallback) {
          const newCount = newIds.filter(id => !previousIds.includes(id)).length;
          toast.success(`${newCount} new job notification${newCount > 1 ? 's' : ''} available!`, {
            duration: 4000,
            icon: "🔔",
          });
          
          // Play notification sound
          try {
            const audio = new Audio("/sounds/notification.mp3");
            await audio.play();
          } catch (audioError) {
            logger.warn("Failed to play notification sound", { error: audioError });
          }
        }

        // Log fallback usage
        if (data.fallback) {
          logger.info("Using fallback job notification data");
        }

        logger.debug("Job notifications fetched", {
          count: newNotifications.length,
          isAvailable: data.isAvailable,
          fallback: data.fallback
        });
      } else {
        throw new Error(data.message || "Invalid API response");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        logger.debug("Job notification fetch aborted");
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : "Unknown error fetching job notifications";
      logger.error(errorMessage);
      setError(errorMessage);
      
      if (!errorMessage.includes("Unauthorized")) {
        toast.error("Failed to check for new jobs", { duration: 3000 });
      }
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.role, getClientToken, jobNotifications]);

  // Start polling
  const startPolling = useCallback(() => {
    if (isPolling || !isAvailable) return;
    
    setIsPolling(true);
    logger.info("Starting job notification polling", { interval: pollingInterval });
    
    // Initial fetch
    fetchJobNotifications();
    
    // Set up interval
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible" && isAvailable) {
        fetchJobNotifications();
      }
    }, pollingInterval);
  }, [isPolling, isAvailable, pollingInterval, fetchJobNotifications]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (!isPolling) return;
    
    setIsPolling(false);
    logger.info("Stopping job notification polling");
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [isPolling]);

  // Manual check
  const checkNow = useCallback(async (): Promise<void> => {
    await fetchJobNotifications();
  }, [fetchJobNotifications]);

  // Auto start/stop polling based on availability
  useEffect(() => {
    if (isAvailable && !isPolling) {
      startPolling();
    } else if (!isAvailable && isPolling) {
      stopPolling();
    }
  }, [isAvailable, isPolling, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    jobNotifications,
    isLoading,
    error,
    lastChecked,
    isPolling,
    startPolling,
    stopPolling,
    checkNow,
  };
}
