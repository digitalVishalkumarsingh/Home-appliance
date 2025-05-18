"use client";

import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";

interface ApiOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  withAuth?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T> extends ApiState<T> {
  execute: (overrideOptions?: Partial<ApiOptions>) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(options: ApiOptions): ApiResponse<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (overrideOptions?: Partial<ApiOptions>): Promise<T | null> => {
      const {
        url,
        method = "GET",
        body,
        headers = {},
        withAuth = true,
        showSuccessToast = false,
        showErrorToast = true,
        successMessage,
        errorMessage,
      } = { ...options, ...overrideOptions };

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Add auth token if required
        const requestHeaders: Record<string, string> = { ...headers };
        
        if (withAuth) {
          const token = localStorage.getItem("token");
          if (token) {
            requestHeaders["Authorization"] = `Bearer ${token}`;
          } else {
            throw new Error("Authentication token not found");
          }
        }

        // Add content type for JSON requests
        if (body && !requestHeaders["Content-Type"]) {
          requestHeaders["Content-Type"] = "application/json";
        }

        // Prepare request options
        const requestOptions: RequestInit = {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        };

        // Make the request
        const response = await fetch(url, requestOptions);

        // Parse response
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Handle error responses
        if (!response.ok) {
          let errorMsg = errorMessage || "An error occurred";
          
          if (typeof data === "object" && data !== null) {
            errorMsg = data.message || data.error || errorMsg;
          }
          
          throw new Error(errorMsg);
        }

        // Show success toast if enabled
        if (showSuccessToast) {
          toast.success(successMessage || "Operation successful");
        }

        setState({ data, loading: false, error: null });
        return data;
      } catch (error: any) {
        const errorMsg = error.message || "An unexpected error occurred";
        
        // Show error toast if enabled
        if (showErrorToast) {
          toast.error(errorMsg);
        }
        
        setState({ data: null, loading: false, error: errorMsg });
        return null;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export default useApi;
