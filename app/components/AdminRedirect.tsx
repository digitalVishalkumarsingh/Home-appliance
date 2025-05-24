"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/app/hooks/useAuth';
import { FaSpinner } from 'react-icons/fa';

/**
 * Interface for user object from useAuth hook.
 */
interface User {
  role?: string;
}

/**
 * Interface for useAuth hook return type.
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Component that redirects admin users to the admin dashboard.
 * Can be used at the top of user-specific pages.
 */
export default function AdminRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth() as AuthState;
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) return;

    // Check if user is admin
    const isAdmin = isAuthenticated && user?.role === 'admin';

    // Redirect admin users to admin dashboard
    if (isAdmin) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // If still loading or user is admin, show loading indicator
  if (isLoading || (isAuthenticated && user?.role === 'admin')) {
    return (
      <div
        className="fixed inset-0 bg-white/75 flex items-center justify-center z-50"
        aria-live="polite"
      >
        <div className="text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto" aria-hidden="true" />
          <p className="mt-2 text-gray-600">
            {isLoading ? "Checking authentication..." : "Redirecting to admin dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  // If user is not admin, render nothing
  return null;
}