"use client";

import { StatsCard } from "./StatsCard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
} from "@/components/ui";
import {
  ErrorBoundary,
  ErrorFallback,
  DataErrorFallback,
} from "@/components/ui/ErrorBoundary";
import { DashboardError } from "@/lib/error-handler";
import { Clock, MessageSquare, Eye, CheckCircle } from "lucide-react";

interface PerformanceMetricsProps {
  avgResponseTime: string;
  pendingInquiries: number;
  monthlyGrowth: number;
  profileCompletion: number;
  loading?: boolean;
  error?: string | null;
  dashboardError?: DashboardError | null;
}

export function PerformanceMetrics({
  avgResponseTime,
  pendingInquiries,
  monthlyGrowth,
  profileCompletion,
  loading,
  error,
  dashboardError,
}: PerformanceMetricsProps) {
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

  const errorType = getErrorType();

  if (error || dashboardError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <DataErrorFallback
            error={
              new Error(
                error ||
                  dashboardError?.userMessage ||
                  "Failed to load performance data"
              )
            }
            resetError={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <ErrorBoundary fallback={DataErrorFallback}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
        <div className="grid grid-cols-4 gap-6">
          <StatsCard
            title="Avg Response Time"
            value={avgResponseTime}
            icon={<Clock className="w-6 h-6 text-blue-600" />}
            loading={loading}
            error={error}
            dashboardError={dashboardError}
            layout="centered"
            variant="default"
            size="sm"
          />

          <StatsCard
            title="Pending Inquiries"
            value={pendingInquiries}
            icon={<MessageSquare className="w-6 h-6 text-orange-600" />}
            loading={loading}
            error={error}
            dashboardError={dashboardError}
            layout="centered"
            variant="default"
            size="sm"
          />

          <StatsCard
            title="This Month Views"
            value={`${monthlyGrowth >= 0 ? "+" : ""}${monthlyGrowth}%`}
            icon={<Eye className="w-6 h-6 text-purple-600" />}
            loading={loading}
            error={error}
            dashboardError={dashboardError}
            valueClassName={
              monthlyGrowth >= 0 ? "text-green-600" : "text-red-600"
            }
            layout="centered"
            variant="default"
            size="sm"
          />

          <StatsCard
            title="Profile Completion"
            value={`${profileCompletion}%`}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            loading={loading}
            error={error}
            dashboardError={dashboardError}
            layout="centered"
            variant="default"
            size="sm"
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
