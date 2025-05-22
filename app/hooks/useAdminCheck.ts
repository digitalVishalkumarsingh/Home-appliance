"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from './useAuth';

/**
 * Hook to check if the current user is an admin and redirect if necessary
 * @param redirectNonAdmins - If true, redirects non-admin users to home page
 * @param redirectAdmins - If true, redirects admin users to admin dashboard
 * @returns Object containing isAdmin status and loading state
 */
export default function useAdminCheck(
  redirectNonAdmins: boolean = false,
  redirectAdmins: boolean = false
) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // Check if user is admin
    const adminStatus = isAuthenticated && user?.role === 'admin';
    setIsAdmin(adminStatus);

    // Handle redirects
    if (!isLoading) {
      if (redirectNonAdmins && !adminStatus) {
        // Redirect non-admin users to home page
        router.replace('/');
      } else if (redirectAdmins && adminStatus) {
        // Redirect admin users to admin dashboard
        router.replace('/admin/dashboard');
      }
      setIsChecking(false);
    }
  }, [isAuthenticated, isLoading, user, redirectNonAdmins, redirectAdmins, router]);

  return { isAdmin, isChecking };
}
