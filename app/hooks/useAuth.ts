"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { logger } from "../config/logger";

// Define types (aligned with auth.ts, AvailabilityToggle, NotificationBadge, TechnicianHeader, TechnicianSidebar)
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

interface AuthResponse {
  success: boolean;
  user?: JwtPayload;
  message?: string;
}

interface LogoutResponse {
  success: boolean;
  message?: string;
}

export default function useAuth() {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Enhanced utility to get client-side token with better cookie handling
  const getClientToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;

    // First try localStorage
    let token = localStorage.getItem("token");
    if (token) {
      console.log("useAuth - Token found in localStorage");
      return token;
    }

    // Try multiple cookie sources
    try {
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());

      // Try main token cookie (httpOnly)
      let tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
        if (token) {
          console.log("useAuth - Token found in main cookie, syncing to localStorage");
          localStorage.setItem("token", token);
          return token;
        }
      }

      // Try auth_token cookie (non-httpOnly)
      tokenCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
        if (token) {
          console.log("useAuth - Token found in auth_token cookie, syncing to localStorage");
          localStorage.setItem("token", token);
          return token;
        }
      }

      // Try token_backup cookie
      tokenCookie = cookies.find(cookie => cookie.startsWith('token_backup='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
        if (token) {
          console.log("useAuth - Token found in token_backup cookie, syncing to localStorage");
          localStorage.setItem("token", token);
          return token;
        }
      }
    } catch (error) {
      console.error("useAuth - Error reading cookies:", error);
    }

    console.log("useAuth - No token found in localStorage or cookies");
    return null;
  }, []);

  // Fetch user data
  const fetchUser = useCallback(async (signal: AbortSignal) => {
    if (typeof window === "undefined") {
      logger.error("Running in SSR");
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const token = getClientToken();
      console.log('useAuth - fetchUser called:', {
        hasToken: !!token,
        tokenLength: token?.length
      });

      if (!token) {
        console.log('useAuth - No token found, throwing error');
        throw new Error("No authentication token found");
      }

      console.log('useAuth - Making API call to /api/auth/me');
      const response = await fetch(`/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal,
      });

      console.log('useAuth - API response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('useAuth - 401 Unauthorized response');
          throw new Error("Unauthorized");
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      console.log('useAuth - API response data:', {
        success: data.success,
        hasUser: !!data.user,
        userEmail: data.user?.email,
        userRole: data.user?.role
      });

      if (data.success && data.user) {
        console.log('useAuth - Setting authenticated state with user:', data.user.email);
        setUser(data.user);
        setIsAuthenticated(true);

        // Also sync to localStorage for consistency
        try {
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('useAuth - User data synced to localStorage');
        } catch (error) {
          console.error('useAuth - Failed to sync user to localStorage:', error);
        }

        logger.info("User data fetched", { userId: data.user.userId, role: data.user.role });
      } else {
        console.error('useAuth - Invalid API response:', data);
        throw new Error(data.message || "Invalid API response");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        logger.debug("Fetch user request aborted");
        console.log('useAuth - Fetch aborted');
        return;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error fetching user data";
      logger.error(errorMessage);
      console.log('useAuth - Error fetching user:', errorMessage);
      setUser(null);
      setIsAuthenticated(false);
      if (!errorMessage.includes("Unauthorized")) {
        toast.error("Failed to load user data", { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  }, [getClientToken]);

  // Run fetchUser on mount and when storage changes
  useEffect(() => {
    const abortController = new AbortController();
    console.log('useAuth - useEffect triggered, calling fetchUser');

    // Force token sync from cookies to localStorage on mount
    const token = getClientToken();
    console.log('useAuth - Initial token check:', { hasToken: !!token });

    fetchUser(abortController.signal);

    // Listen for storage changes to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        console.log('useAuth - Storage change detected, refetching user');
        fetchUser(new AbortController().signal);
      }
    };

    // Listen for custom auth events
    const handleAuthChange = () => {
      console.log('useAuth - Auth change event detected, refetching user');
      fetchUser(new AbortController().signal);
    };

    // Listen for cookie changes (for cross-tab sync)
    const handleFocus = () => {
      console.log('useAuth - Window focus detected, checking for token updates');
      const currentToken = getClientToken();
      if (currentToken && !isAuthenticated) {
        console.log('useAuth - Token found on focus, refetching user');
        fetchUser(new AbortController().signal);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      abortController.abort();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchUser, getClientToken, isAuthenticated]);

  // Enhanced logout function with comprehensive cleanup
  const logout = useCallback(async () => {
    if (typeof window === "undefined") {
      logger.error("Running in SSR");
      return;
    }

    console.log('useAuth - Starting logout process');

    try {
      const token = getClientToken();
      if (token) {
        try {
          console.log('useAuth - Calling logout API');
          const response = await fetch(`/api/auth/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            logger.warn(`Logout API failed: ${response.status}, proceeding with local logout`);
          } else {
            const data: LogoutResponse = await response.json();
            if (!data.success) {
              logger.warn(`Logout API returned error: ${data.message}, proceeding with local logout`);
            }
          }
        } catch (apiError) {
          logger.warn("Logout API call failed, proceeding with local logout", { error: apiError });
        }
      }

      console.log('useAuth - Clearing all authentication data');

      // Clear localStorage completely
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token_backup");

      // Clear sessionStorage as well
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("token_backup");

      // Comprehensive cookie clearing
      const cookiesToClear = [
        "token",
        "auth_token",
        "token_backup",
        "__stripe_mid",
        "__next_hmr_refresh_hash__"
      ];

      const domains = [
        window.location.hostname,
        `.${window.location.hostname}`,
        "localhost",
        ".localhost"
      ];

      const paths = ["/", "/api", "/auth"];

      // Clear cookies for all combinations of domains and paths
      cookiesToClear.forEach(cookieName => {
        domains.forEach(domain => {
          paths.forEach(path => {
            try {
              // Clear with domain and path
              document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
              // Clear without domain
              document.cookie = `${cookieName}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
              // Clear with secure flag
              document.cookie = `${cookieName}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure`;
            } catch (error) {
              // Ignore cookie clearing errors
            }
          });
        });
      });

      // Clear all cookies by iterating through document.cookie
      try {
        const cookies = document.cookie.split(";");
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          if (name) {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
            document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
          }
        });
      } catch (error) {
        logger.debug("Error clearing all cookies:", error);
      }

      // Clear any cached data
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('useAuth - Cleared browser caches');
        }
      } catch (error) {
        logger.debug("Error clearing caches:", error);
      }

      // Clear IndexedDB if any
      try {
        if ('indexedDB' in window) {
          // This is a basic clear - you might need to customize based on your app's IndexedDB usage
          const databases = await indexedDB.databases?.();
          if (databases) {
            await Promise.all(
              databases.map(db => {
                if (db.name) {
                  return new Promise((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name!);
                    deleteReq.onsuccess = () => resolve(undefined);
                    deleteReq.onerror = () => reject(deleteReq.error);
                  });
                }
              })
            );
          }
          console.log('useAuth - Cleared IndexedDB');
        }
      } catch (error) {
        logger.debug("Error clearing IndexedDB:", error);
      }

      // Update state
      setUser(null);
      setIsAuthenticated(false);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('authChange'));

      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);

      logger.info("User logged out successfully with complete cleanup");
      console.log('useAuth - Logout completed successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error during logout";
      logger.error(errorMessage);
      console.error('useAuth - Logout error:', errorMessage);

      // Still clear local state even if there's an error
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setIsAuthenticated(false);

      // Force redirect even on error
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);

      throw error; // Re-throw to let the calling component handle it
    }
  }, [getClientToken]);

  // Role-based flags (memoized via useCallback or computed on render)
  const isTechnician = user?.role === "technician";
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";

  // Debug current state
  useEffect(() => {
    console.log('useAuth - State changed:', {
      isAuthenticated,
      isLoading,
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      hasToken: !!getClientToken()
    });
  }, [isAuthenticated, isLoading, user, getClientToken]);

  // Manual token sync function
  const syncTokenFromCookies = useCallback(() => {
    console.log('useAuth - Manual token sync requested');
    const token = getClientToken();
    if (token && !isAuthenticated) {
      console.log('useAuth - Token found during manual sync, fetching user');
      fetchUser(new AbortController().signal);
    }
    return !!token;
  }, [getClientToken, isAuthenticated, fetchUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isTechnician,
    isAdmin,
    isUser,
    logout,
    fetchUser: () => fetchUser(new AbortController().signal),
    syncTokenFromCookies,
  };
}
