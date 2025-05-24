// app/lib/apiClient.ts
"use client";

import { toast } from 'react-hot-toast';

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    
    // First try localStorage
    let token = localStorage.getItem("token");
    if (token) {
      return token;
    }
    
    // If not in localStorage, try to get from cookies as fallback
    try {
      const cookies = document.cookie.split(';').map(cookie => cookie.trim());
      const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1];
        if (token) {
          // Sync to localStorage for future use
          localStorage.setItem("token", token);
          return token;
        }
      }
    } catch (error) {
      console.debug("Error reading cookies:", error);
    }
    
    return null;
  }

  private async makeRequest(url: string, options: ApiOptions = {}): Promise<Response> {
    const { requireAuth = true, ...fetchOptions } = options;
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add authorization header if required
    if (requireAuth) {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle authentication errors
    if (response.status === 401 && requireAuth) {
      toast.error('Session expired. Please log in again.');
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Authentication failed');
    }

    return response;
  }

  async get(url: string, options: ApiOptions = {}): Promise<Response> {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  async post(url: string, data?: any, options: ApiOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(url: string, data?: any, options: ApiOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(url: string, options: ApiOptions = {}): Promise<Response> {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }

  async patch(url: string, data?: any, options: ApiOptions = {}): Promise<Response> {
    return this.makeRequest(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export a singleton instance
export const apiClient = new ApiClient();

// Helper function for common API patterns
export async function fetchWithAuth(url: string, options: ApiOptions = {}) {
  const response = await apiClient.get(url, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'API request failed');
  }
  
  return data;
}

export async function postWithAuth(url: string, data?: any, options: ApiOptions = {}) {
  const response = await apiClient.post(url, data, options);
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  
  const responseData = await response.json();
  
  if (!responseData.success) {
    throw new Error(responseData.message || 'API request failed');
  }
  
  return responseData;
}
