"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface User {
  _id?: string;
  id?: string;
  name?: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    isAdmin: false,
  });
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        // Check if we're in the browser environment
        if (typeof window === "undefined") {
          return;
        }

        const token = localStorage.getItem("token");
        const userStr = localStorage.getItem("user");

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            setAuthState({
              user,
              token,
              isLoading: false,
              isAuthenticated: true,
              isAdmin: user.role === "admin",
            });
          } catch (error) {
            console.error("Error parsing user data:", error);
            // Clear invalid data
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            setAuthState({
              user: null,
              token: null,
              isLoading: false,
              isAuthenticated: false,
              isAdmin: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
          isAdmin: false,
        });
      }
    };

    initAuth();

    // Listen for auth changes (e.g., from other tabs)
    const handleAuthChange = () => {
      initAuth();
    };

    window.addEventListener("authChange", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  // Login function
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        if (data.success) {
          // Store user data and token
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          // Update auth state
          setAuthState({
            user: data.user,
            token: data.token,
            isLoading: false,
            isAuthenticated: true,
            isAdmin: data.user.role === "admin",
          });

          // Dispatch custom event to notify other components about auth change
          window.dispatchEvent(new Event("authChange"));

          toast.success("Login successful");
          return true;
        } else {
          toast.error(data.message || "Login failed");
          return false;
        }
      } catch (error: any) {
        console.error("Login error:", error);
        toast.error(error.message || "Login failed. Please try again.");
        return false;
      }
    },
    []
  );

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("freshAdminLogin");

    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
    });

    // Dispatch custom event to notify other components about auth change
    window.dispatchEvent(new Event("authChange"));

    toast.success("Logged out successfully");
    router.push("/");
  }, [router]);

  // Update user data
  const updateUser = useCallback((userData: Partial<User>) => {
    try {
      if (!authState.user) return;

      const updatedUser = { ...authState.user, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));

      // Dispatch custom event to notify other components about auth change
      window.dispatchEvent(new Event("authChange"));
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }, [authState.user]);

  // Check if user has a specific role
  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (!authState.user) return false;

      if (Array.isArray(role)) {
        return role.includes(authState.user.role);
      }

      return authState.user.role === role;
    },
    [authState.user]
  );

  return {
    ...authState,
    login,
    logout,
    updateUser,
    hasRole,
  };
}

export default useAuth;
