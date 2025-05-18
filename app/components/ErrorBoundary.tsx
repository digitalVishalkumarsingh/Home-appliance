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
    // Update state so the next render will show the fallback UI.
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
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-5 bg-gray-50">
          <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-50">
              <FaExclamationTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="mb-4 text-xl font-bold text-center text-gray-800">
              Something went wrong
            </h2>
            <div className="mb-6 text-sm text-gray-600">
              <p className="mb-2">
                We're sorry, but an unexpected error occurred. Our team has been
                notified.
              </p>
              {this.state.error && (
                <div className="p-3 mt-4 overflow-auto text-xs bg-gray-100 rounded-md max-h-32">
                  <p className="font-mono">{this.state.error.toString()}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <FaRedo className="mr-2" /> Try Again
              </button>
              <Link
                href="/"
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <FaHome className="mr-2" /> Return to Home
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
