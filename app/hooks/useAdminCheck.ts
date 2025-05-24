"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../hooks/useAuth";

interface AdminCheckResult {
  isAdmin: boolean | null;
  isChecking: boolean;
  error: string | null;
}

/**
 * Hook to check if the current user is an admin and redirect if necessary
 * @param redirectNonAdmins - If true, redirects non-admin users to the home page
 * @param redirectAdmins - If true, redirects admin users to the admin dashboard
 * @returns Object containing isAdmin status, isChecking state, and error state
 */
export default function useAdminCheck(
  redirectNonAdmins: boolean = false,
  redirectAdmins: boolean = false
): AdminCheckResult {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Configurable redirect paths with defaults
  const HOME_PATH = process.env.NEXT_PUBLIC_HOME_PATH || "/";
  const ADMIN_DASHBOARD_PATH = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_PATH || "/admin/dashboard";

  useEffect(() => {
    if (isLoading) return;

    try {
      // Validate authentication and user
      if (!isAuthenticated || !user || !user.userId) {
        setError("Authentication failed: No user or session");
        setIsAdmin(false);
        setIsChecking(false);
        if (redirectNonAdmins) {
          router.replace(HOME_PATH);
          return; // Early return to prevent further updates
        }
        return;
      }

      const adminStatus = user.role === "admin";
      setIsAdmin(adminStatus);
      setIsChecking(false);
      setError(null);

      if (redirectNonAdmins && !adminStatus) {
        router.replace(HOME_PATH);
        return; // Early return
      } else if (redirectAdmins && adminStatus) {
        router.replace(ADMIN_DASHBOARD_PATH);
        return; // Early return
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error in admin check";
      setError(errorMessage);
      setIsAdmin(false);
      setIsChecking(false);
      // Log to console in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.error(errorMessage, { error, userId: user?.userId });
      }
    }
  }, [isAuthenticated, isLoading, user, redirectNonAdmins, redirectAdmins, router]);

  return { isAdmin, isChecking, error };
}