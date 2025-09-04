"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  SkeletonInquiry,
} from "@/components/ui";
import {
  ErrorBoundary,
  ErrorFallback,
  DataErrorFallback,
} from "@/components/ui/ErrorBoundary";
import { Users, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardError } from "@/lib/error-handler";

interface RecentInquiry {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  message: string;
  status: "new" | "responded" | "booked" | "declined" | "archived";
  createdAt: string;
}

interface RecentInquiriesProps {
  inquiries: RecentInquiry[];
  loading?: boolean;
  error?: string | null;
  dashboardError?: DashboardError | null;
}

export function RecentInquiries({
  inquiries,
  loading,
  error,
  dashboardError,
}: RecentInquiriesProps) {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "responded":
        return <Badge variant="primary">Responded</Badge>;
      case "booked":
        return <Badge variant="success">Booked</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "archived":
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

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
          <CardTitle className="text-lg">Recent Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <DataErrorFallback
            error={
              new Error(
                error ||
                  dashboardError?.userMessage ||
                  "Failed to load recent inquiries"
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Inquiries</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/inquiries")}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonInquiry key={i} />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No inquiries yet</p>
              <p className="text-sm">New inquiries will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {inquiry.clientName}
                      </h4>
                      {getStatusBadge(inquiry.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {inquiry.eventType} • {formatDate(inquiry.eventDate)}
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {inquiry.message}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-gray-500">
                        {formatDate(inquiry.createdAt)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/dashboard/inquiries/${inquiry.id}`)
                        }
                      >
                        Respond
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
}
