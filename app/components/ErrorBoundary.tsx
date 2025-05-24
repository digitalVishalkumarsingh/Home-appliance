"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { FaExclamationTriangle, FaHome, FaRedo } from "react-icons/fa";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-5 bg-gray-50">
          <div
            className="w-full max-w-md p-8 bg-white rounded-lg shadow-md"
            role="alert"
          >
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-50">
              <FaExclamationTriangle
                className="w-8 h-8 text-red-500"
                aria-hidden="true"
              />
            </div>
            <h2 className="mb-4 text-xl font-bold text-center text-gray-800">
              Something went wrong
            </h2>
            <div className="mb-6 text-sm text-gray-600">
              <p className="mb-2">
                We&apos;re sorry, but an unexpected error occurred. Our team has been
                notified.
              </p>
              {this.state.error && (
                <div
                  className="p-3 mt-4 overflow-auto text-xs bg-gray-100 rounded-lg max-h-32"
                  aria-live="polite"
                >
                  <p className="font-mono">{this.state.error.toString()}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center transition-colors"
                aria-label="Reload the page"
              >
                <FaRedo className="mr-2" aria-hidden="true" /> Try Again
              </button>
              <Link
                href="/"
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center transition-colors"
                aria-label="Return to home page"
              >
                <FaHome className="mr-2" aria-hidden="true" /> Return to Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;