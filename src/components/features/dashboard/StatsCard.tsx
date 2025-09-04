"use client";

import { Card, CardContent, Skeleton } from "@/components/ui";
import {
  ErrorBoundary,
  ErrorFallback,
  DataErrorFallback,
} from "@/components/ui/ErrorBoundary";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { DashboardError } from "@/lib/error-handler";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  subtext?: string | number;
  loading?: boolean;
  error?: string | null;
  dashboardError?: DashboardError | null;
  className?: string;
  valueClassName?: string;
  subtextClassName?: string;
  layout?: "centered" | "left-aligned";
  variant?: "default" | "elevated" | "compact";
  size?: "default" | "sm" | "lg";
}

export function StatsCard({
  title,
  value,
  icon,
  subtext,
  loading,
  error,
  dashboardError,
  className,
  valueClassName,
  subtextClassName,
  layout = "centered",
  variant = "default",
  size = "default",
}: StatsCardProps) {
  // Determine error type for better error display
  const getErrorType = () => {
    if (dashboardError) {
      return dashboardError.type;
    }
    if (error?.toLowerCase().includes("network")) {
      return "network";
    }
    if (error?.toLowerCase().includes("auth")) {
      return "auth";
    }
    return "data";
  };

  // Get card styling based on variant
  const getCardStyles = () => {
    const baseStyles = "border rounded-lg";
    const variantStyles = {
      default: "border-gray-200",
      elevated: "border-gray-200 shadow-sm",
      compact: "border-gray-200",
    };
    return `${baseStyles} ${variantStyles[variant]}`;
  };

  // Get padding based on size
  const getPadding = () => {
    const sizeStyles = {
      sm: "p-3",
      default: "p-6",
      lg: "p-8",
    };
    return sizeStyles[size];
  };

  // Get layout classes
  const getLayoutClasses = () => {
    const layoutStyles = {
      centered: "flex flex-col text-center",
      "left-aligned": "flex flex-col",
    };
    return layoutStyles[layout];
  };

  // Get value size classes
  const getValueSizeClasses = () => {
    const sizeStyles = {
      sm: "text-xl",
      default: "text-2xl",
      lg: "text-3xl",
    };
    return sizeStyles[size];
  };

  const errorType = getErrorType();

  if (error || dashboardError) {
    return (
      <Card className={`${getCardStyles()} ${getPadding()} ${className || ""}`}>
        <div className={`${getLayoutClasses()} gap-4`}>
          <div className="flex items-center justify-between w-full">
            <span
              className={`${getValueSizeClasses()} font-bold text-gray-900 mb-0`}
            >
              !
            </span>
            {errorType === "network" ? (
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            ) : errorType === "auth" ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : (
              <Info className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-600 text-left">
            Error
          </span>
        </div>
      </Card>
    );
  }

  return (
    <ErrorBoundary fallback={DataErrorFallback}>
      <Card className={`${getCardStyles()} ${getPadding()} ${className || ""}`}>
        <div className={`${getLayoutClasses()} gap-4`}>
          {loading ? (
            <>
              <div className="flex items-center justify-between w-full">
                <Skeleton
                  className={`${
                    size === "sm" ? "h-6" : size === "lg" ? "h-10" : "h-8"
                  } w-16 mb-0`}
                />
                {icon && <Skeleton className="w-6 h-6 rounded" />}
              </div>
              <Skeleton className="h-4 w-20" />
              {subtext && <Skeleton className="h-3 w-16 mt-1" />}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between w-full">
                <span
                  className={`${getValueSizeClasses()} font-bold text-gray-900 mb-0 ${
                    valueClassName || ""
                  }`}
                >
                  {typeof value === "number" ? value.toLocaleString() : value}
                </span>
                {icon}
              </div>
              <span className="text-sm font-medium text-gray-600 text-left">
                {title}
              </span>
            </>
          )}
        </div>
      </Card>
    </ErrorBoundary>
  );
}
