"use client";

import React from "react";
import { AlertCircle, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { Button } from "./Button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  retryCount?: number;
  maxRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  lastErrorTime: number;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      lastErrorTime: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to external service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Integrate with error tracking service (Sentry, etc.)
      console.error("Production error:", {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  resetError = () => {
    const { retryCount, maxRetries = 3 } = this.props;
    const currentRetryCount = this.state.retryCount + 1;

    if (currentRetryCount <= maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        retryCount: currentRetryCount,
      });
    } else {
      // Max retries reached, show permanent error
      this.setState({
        hasError: true,
        error: new Error(
          "Maximum retry attempts reached. Please refresh the page."
        ),
        retryCount: currentRetryCount,
      });
    }
  };

  getErrorType = (error: Error): "network" | "auth" | "data" | "unknown" => {
    const message = error.message.toLowerCase();

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout")
    ) {
      return "network";
    }

    if (
      message.includes("auth") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")
    ) {
      return "auth";
    }

    if (
      message.includes("data") ||
      message.includes("database") ||
      message.includes("query")
    ) {
      return "data";
    }

    return "unknown";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.resetError}
          retryCount={this.state.retryCount}
          maxRetries={this.props.maxRetries || 3}
          errorType={this.getErrorType(this.state.error!)}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  retryCount?: number;
  maxRetries?: number;
  errorType?: "network" | "auth" | "data" | "unknown";
}

export function DefaultErrorFallback({
  error,
  resetError,
  retryCount = 0,
  maxRetries = 3,
  errorType = "unknown",
}: ErrorFallbackProps) {
  const getErrorIcon = () => {
    switch (errorType) {
      case "network":
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case "auth":
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case "data":
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case "network":
        return "Connection Error";
      case "auth":
        return "Authentication Error";
      case "data":
        return "Data Loading Error";
      default:
        return "Something went wrong";
    }
  };

  const getErrorMessage = () => {
    if (retryCount >= maxRetries) {
      return "Maximum retry attempts reached. Please refresh the page or contact support.";
    }

    switch (errorType) {
      case "network":
        return "Unable to connect to the server. Please check your internet connection.";
      case "auth":
        return "Your session has expired. Please log in again.";
      case "data":
        return "Unable to load the requested data. Please try again.";
      default:
        return error.message || "An unexpected error occurred";
    }
  };

  const getRetryButtonText = () => {
    if (retryCount >= maxRetries) {
      return "Refresh Page";
    }
    return `Try Again (${retryCount + 1}/${maxRetries + 1})`;
  };

  return (
    <div className="flex items-center justify-center min-h-[200px] p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          {getErrorIcon()}
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {getErrorTitle()}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{getErrorMessage()}</p>
          {retryCount > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Attempt {retryCount} of {maxRetries + 1}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={
              retryCount >= maxRetries
                ? () => window.location.reload()
                : resetError
            }
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {getRetryButtonText()}
          </Button>
          {retryCount >= maxRetries && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/dashboard")}
              className="text-xs"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Functional error boundary for specific sections
export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const errorType = error.message.toLowerCase().includes("network")
    ? "network"
    : "unknown";

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-800">
            Error loading data
          </h4>
          <p className="text-sm text-red-700 mt-1">
            {error.message || "Failed to load this section"}
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetError}
              className="h-7 px-2 text-xs"
            >
              Retry
            </Button>
            {errorType === "network" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="h-7 px-2 text-xs"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Specialized error fallback for dashboard sections
export function DashboardErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-800">
            Dashboard section unavailable
          </h4>
          <p className="text-sm text-amber-700 mt-1">
            This section is temporarily unavailable. Other dashboard features
            remain functional.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetError}
            className="mt-2 h-7 px-2 text-xs text-amber-700 hover:text-amber-800"
          >
            Retry Section
          </Button>
        </div>
      </div>
    </div>
  );
}

// Error fallback for data loading states
export function DataErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-blue-800">
            Data loading issue
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            Unable to load the latest data. This may be a temporary issue.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetError}
            className="mt-2 h-7 px-2 text-xs text-blue-700 hover:text-blue-800"
          >
            Reload Data
          </Button>
        </div>
      </div>
    </div>
  );
}
