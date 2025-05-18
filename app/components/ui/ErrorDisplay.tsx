"use client";

import { FaExclamationTriangle, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export default function ErrorDisplay({
  title = "Error",
  message,
  onRetry,
  showRetry = false,
}: ErrorDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <FaRedo className="mr-2 -ml-1 h-4 w-4" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function NetworkError({
  onRetry,
  showRetry = true,
}: {
  onRetry?: () => void;
  showRetry?: boolean;
}) {
  return (
    <ErrorDisplay
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}

export function AuthError({
  onRetry,
  showRetry = true,
}: {
  onRetry?: () => void;
  showRetry?: boolean;
}) {
  return (
    <ErrorDisplay
      title="Authentication Error"
      message="You are not authorized to access this resource. Please log in and try again."
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}

export function NotFoundError({
  onRetry,
  showRetry = true,
  resourceType = "resource",
}: {
  onRetry?: () => void;
  showRetry?: boolean;
  resourceType?: string;
}) {
  return (
    <ErrorDisplay
      title="Not Found"
      message={`The requested ${resourceType} could not be found. It may have been deleted or moved.`}
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}

export function ServerError({
  onRetry,
  showRetry = true,
}: {
  onRetry?: () => void;
  showRetry?: boolean;
}) {
  return (
    <ErrorDisplay
      title="Server Error"
      message="Something went wrong on our server. Please try again later or contact support if the problem persists."
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}
