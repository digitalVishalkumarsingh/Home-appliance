// app/hooks/useApi.ts
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface ApiOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  withAuth?: boolean;
  body?: any;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export default function useApi<T>(p0: { url: string; method: string; withAuth: boolean; showSuccessToast: boolean; showErrorToast: boolean; errorMessage: string; }) {
  const execute = useCallback(
    async ({
      url,
      method = 'GET',
      withAuth = false,
      body,
      showSuccessToast = false,
      showErrorToast = true,
      successMessage = 'Success!',
      errorMessage = 'An error occurred',
    }: ApiOptions): Promise<T> => {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (withAuth) {
          // Assume token is stored in a cookie or localStorage; adjust as needed
          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (showSuccessToast) {
          toast.success(successMessage);
        }
        return data as T;
      } catch (error) {
        if (showErrorToast) {
          toast.error(errorMessage);
        }
        throw error;
      }
    },
    []
  );

  return { execute };
}