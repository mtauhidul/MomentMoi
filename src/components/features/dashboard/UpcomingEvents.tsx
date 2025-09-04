"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
} from "@/components/ui";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { UpcomingEvent } from "@/hooks/useVendorDashboard";
import type { DashboardError } from "@/lib/error-handler";

interface UpcomingEventsProps {
  events: UpcomingEvent[];
  loading: boolean;
  error: string | null;
  dashboardError: DashboardError | null;
}

export function UpcomingEvents({
  events,
  loading,
  error,
  dashboardError,
}: UpcomingEventsProps) {
  const router = useRouter();

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return timeString;
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg"
              >
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || dashboardError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p>Failed to load upcoming bookings</p>
            <p className="text-sm text-gray-500 mt-1">
              {error || dashboardError?.userMessage || "Please try again later"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/calendar")}
          >
            View Calendar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No upcoming bookings scheduled</p>
            <p className="text-sm">Your booked inquiries will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {event.clientName}
                    </h4>
                    {getStatusBadge(event.status)}
                  </div>

                  <div className="text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(event.eventDate)}
                      </span>
                      {event.startTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(event.startTime)}
                          {event.endTime && ` - ${formatTime(event.endTime)}`}
                        </span>
                      )}
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">{event.eventType}</span>
                    {event.guestCount && (
                      <span className="flex items-center gap-1 ml-4">
                        <Users className="w-3 h-3" />
                        {event.guestCount} guests
                      </span>
                    )}
                    {event.budgetAmount && (
                      <span className="flex items-center gap-1 ml-4">
                        <DollarSign className="w-3 h-3" />$
                        {event.budgetAmount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {event.notes && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {event.notes}
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      Booked {formatDate(event.createdAt)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        router.push(`/dashboard/calendar?event=${event.id}`)
                      }
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
