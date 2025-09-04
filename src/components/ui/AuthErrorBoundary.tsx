"use client";

import React from "react";
import {
  handleErrorBoundaryError,
  createErrorContext,
} from "@/lib/error-handler";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    retry: () => void;
    reset: () => void;
  }>;
}

export class AuthErrorBoundary extends React.Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): Partial<AuthErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error with comprehensive context
    const errorContext = createErrorContext(
      "AuthErrorBoundary",
      "component_error"
    );

    console.error("🚨 Auth Error Boundary caught error:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
    });

    // Use the error handler for structured logging
    handleErrorBoundaryError(error, errorInfo, errorContext);

    this.setState({
      error,
      errorInfo,
      retryCount: this.state.retryCount + 1,
    });
  }

  handleRetry = () => {
    console.log("🔄 Retrying after auth error boundary catch", {
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReset = () => {
    console.log("🏠 Resetting auth error boundary and redirecting to home", {
      retryCount: this.state.retryCount,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });

    // Redirect to home or login page
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.handleRetry}
            reset={this.handleReset}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-700">
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">
                  Something went wrong during authentication.
                </p>
                <p className="text-sm">
                  This error has been logged and we're working to fix it.
                </p>
              </div>

              {this.state.retryCount < 3 && (
                <Button
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="primary"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>

              {process.env.NODE_ENV === "development" && (
                <details className="mt-4 p-3 bg-gray-50 rounded text-xs">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-red-600">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component to wrap auth pages with error boundary
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{
    error: Error;
    retry: () => void;
    reset: () => void;
  }>
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary fallback={fallback}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
