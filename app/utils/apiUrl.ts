/**
 * Production-safe API URL utilities for Vercel deployment
 */

// Get the base URL for API calls
export const getApiUrl = (): string => {
  // In production (Vercel), use the deployment URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || `https://${process.env.VERCEL_URL}/api`;
  }
  
  // In development, use localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
};

// Get the base URL for the application
export const getBaseUrl = (): string => {
  // In production (Vercel), use the deployment URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`;
  }
  
  // In development, use localhost
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
};

// Get the full URL for internal API calls (server-side)
export const getInternalApiUrl = (): string => {
  // For server-side calls in production
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}`;
  }
  
  // In development
  return 'http://localhost:3000';
};

// Validate that required environment variables are set
export const validateEnvironment = (): { isValid: boolean; missing: string[] } => {
  const required = [
    'MONGODB_URI',
    'MONGODB_DB', 
    'JWT_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  return {
    isValid: missing.length === 0,
    missing
  };
};

// Get environment-specific configuration
export const getConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    isProduction,
    isDevelopment,
    apiUrl: getApiUrl(),
    baseUrl: getBaseUrl(),
    internalApiUrl: getInternalApiUrl(),
    environment: validateEnvironment()
  };
};
