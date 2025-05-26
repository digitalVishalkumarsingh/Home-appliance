"use client";

import { useState, useEffect, useCallback } from "react";
import { FaBell, FaSpinner } from "react-icons/fa";
import Link from "next/link";
import { toast } from "react-hot-toast";
import useAuth from "../../hooks/useAuth";
import { logger } from "../../config/logger";

// Define types (aligned with auth.ts and AvailabilityToggle)
interface UserPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

interface NotificationCountResponse {
  success: boolean;
  unreadCount: number;
  message?: string;
}

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"network" | "auth" | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Utility to get client-side token (consistent with JobNotificationProvider)
  const getClientToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("token");
    if (!token) logger.warn("No token found in localStorage");
    return token;
  }, []);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (typeof window === "undefined" || authLoading || !isAuthenticated || user?.role !== "technician") {
      logger.debug("Skipping notification count fetch: SSR or unauthorized", {
        isAuthenticated,
        role: user?.role,
        authLoading,
      });
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

      const response = await fetch(`/api/technicians/notifications/count`, {
        method: "GET",
        credentials: 'include', // Include cookies in the request
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        throw new Error(`Failed to fetch notification count: ${response.status}`);
      }

      const data: NotificationCountResponse = await response.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
        logger.info("Notification count fetched", { unreadCount: data.unreadCount });
      } else {
        throw new Error(data.message || "Invalid API response");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error fetching notification count";
      logger.error(errorMessage);
      setError(errorMessage.includes("Unauthorized") ? "auth" : "network");
      toast.error(errorMessage.includes("Unauthorized") ? "Please log in again" : "Failed to load notifications", {
        duration: 4000,
      });
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.role, API_URL, getClientToken]);

  // Polling with visibility awareness
  useEffect(() => {
    if (typeof window === "undefined") return;

    fetchUnreadCount();

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }, 60000); // Poll every 60 seconds when tab is visible

    return () => clearInterval(intervalId);
  }, [fetchUnreadCount]);

  if (loading) {
    return (
      <div className="relative inline-block">
        <FaSpinner className="animate-spin h-5 w-5 text-gray-400" aria-label="Loading notifications" />
      </div>
    );
  }

  if (error) {
    return (
      <Link href="/technician/notifications" className="relative inline-block">
        <FaBell className="h-6 w-6 text-gray-400" aria-label="Notifications unavailable" />
      </Link>
    );
  }

  return (
    <Link href="/technician/notifications" className="relative inline-block">
      <FaBell
        className="h-6 w-6 text-blue-300 hover:text-white transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}