"use client";

import { ReactNode } from "react";
import { FaExclamationTriangle, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";
import Button from "./Button";

/**
 * Props for the ErrorDisplay component.
 */
interface ErrorDisplayProps {
  /** Optional title for the error message. Defaults to "Error". */
  title?: string;
  /** The error message to display. */
  message: string;
  /** Optional callback function to handle retry action. */
  onRetry?: () => void;
  /** Whether to show the retry button. Defaults to false. */
  showRetry?: boolean;
}

/**
 * A reusable error display component with a fade-in animation, icon, and optional retry button.
 * @param props - The component props.
 */
export default function ErrorDisplay({
  title = "Error",
  message,
  onRetry,
  showRetry = false,
}: ErrorDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <FaExclamationTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {showRetry && onRetry && (
            <div className="mt-4">
              <Button
                variant="danger"
                size="sm"
                onClick={onRetry}
                leftIcon={<FaRedo className="h-4 w-4" />}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Props for specific error components.
 */
interface SpecificErrorProps {
  /** Optional callback function to handle retry action. */
  onRetry?: () => void;
  /** Whether to show the retry button. Defaults to true. */
  showRetry?: boolean;
}

/**
 * Displays a network error message.
 * @param props - The component props.
 */
export function NetworkError({ onRetry, showRetry = true }: SpecificErrorProps) {
  return (
    <ErrorDisplay
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}

/**
 * Displays an authentication error message.
 * @param props - The component props.
 */
export function AuthError({ onRetry, showRetry = true }: SpecificErrorProps) {
  return (
    <ErrorDisplay
      title="Authentication Error"
      message="You are not authorized to access this resource. Please log in and try again."
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}

/**
 * Props for NotFoundError component.
 */
interface NotFoundErrorProps extends SpecificErrorProps {
  /** Type of resource that was not found. Defaults to "resource". */
  resourceType?: string;
}

/**
 * Displays a not found error message.
 * @param props - The component props.
 */
export function NotFoundError({
  onRetry,
  showRetry = true,
  resourceType = "resource",
}: NotFoundErrorProps) {
  return (
    <ErrorDisplay
      title="Not Found"
      message={`The requested ${resourceType} could not be found. It may have been deleted or moved.`}
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}

/**
 * Displays a server error message.
 * @param props - The component props.
 */
export function ServerError({ onRetry, showRetry = true }: SpecificErrorProps) {
  return (
    <ErrorDisplay
      title="Server Error"
      message="Something went wrong on our server. Please try again later or contact support if the problem persists."
      onRetry={onRetry}
      showRetry={showRetry}
    />
  );
}