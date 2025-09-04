"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout, ClientDashboardLayout } from "@/components/layout";
import { useDashboard } from "@/hooks/useDashboard";
import {
  StatsCard,
  RecentInquiries,
  PerformanceMetrics,
  UpcomingEvents,
} from "@/components/features/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  SkeletonWelcomeHeader,
  SkeletonQuickActions,
} from "@/components/ui";
import { ErrorBoundary, ErrorFallback } from "@/components/ui/ErrorBoundary";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import {
  Calendar,
  MessageSquare,
  CheckCircle,
  Eye,
  TrendingUp,
  Plus,
  Building2,
  MapPin,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Users,
  Heart,
  Clock,
  DollarSign,
} from "lucide-react";

export default function DashboardPage() {
  const {
    user,
    loading: authLoading,
    profile,
    userType,
    refreshProfile,
  } = useAuth();
  const router = useRouter();
  const {
    data: dashboardData,
    loading: dataLoading,
    error,
    refetch,
  } = useDashboard();

  // Check if we have cached data available for instant UI
  const hasCachedData = !!dashboardData;
  const isRefreshing = dataLoading && hasCachedData;

  // Handle refresh with loading state
  const handleRefresh = async () => {
    try {
      await refetch();
      await refreshProfile(); // Also refresh profile data
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  // Handle onboarding redirection using centralized profile data
  useEffect(() => {
    if (!authLoading && user && profile) {
      console.log("Checking onboarding status for user:", user.id);
      console.log("Profile data:", profile);

      if (!profile.onboarding_completed) {
        console.log("Onboarding not completed, redirecting to onboarding");
        router.push("/onboarding");
        return;
      }

      console.log("Onboarding completed, staying on dashboard");
    }
  }, [user, authLoading, profile, router]);

  // Show loading only if we don't have cached data
  if ((authLoading || dataLoading) && !hasCachedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-body text-text-secondary">
            {authLoading ? "Authenticating..." : "Loading dashboard..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get display name based on user type
  const getDisplayName = () => {
    if (userType === "vendor") {
      return (
        dashboardData?.businessName || profile?.business_name || "Your Business"
      );
    } else if (userType === "planner") {
      return profile?.full_name || user.user_metadata?.full_name || "Planner";
    } else {
      return profile?.full_name || user.user_metadata?.full_name || "Welcome";
    }
  };

  // Determine error type for better error display
  const getErrorType = () => {
    if (error?.toLowerCase().includes("network")) {
      return "network";
    }
    if (error?.toLowerCase().includes("auth")) {
      return "auth";
    }
    return "data";
  };

  const errorType = getErrorType();

  // Render unified dashboard for all users using ClientDashboardLayout
  return (
    <ErrorBoundary fallback={ErrorFallback}>
      <NetworkStatus />
      <ClientDashboardLayout>
        <div className="space-y-6 max-w-8xl mx-auto">
          {/* Welcome Header with Refresh Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-light text-gray-900">
                  Welcome back, {getDisplayName()}! 👋
                  {isRefreshing && (
                    <span className="ml-2 inline-flex items-center gap-1 text-sm text-gray-500">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Refreshing...
                    </span>
                  )}
                </h1>
                <p className="text-gray-600">
                  {userType === "vendor"
                    ? "Here's what's happening with your business today"
                    : userType === "planner"
                    ? "Here's your event planning progress"
                    : "Discover amazing vendors for your special day"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || dataLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Enhanced Error Display */}
          {error && (
            <div
              className={`border rounded-lg p-4 ${
                errorType === "network"
                  ? "bg-orange-50 border-orange-200"
                  : errorType === "auth"
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {errorType === "network" ? (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                ) : errorType === "auth" ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      errorType === "network"
                        ? "text-orange-800"
                        : errorType === "auth"
                        ? "text-red-800"
                        : "text-blue-800"
                    }`}
                  >
                    {errorType === "network"
                      ? "Connection Issue"
                      : errorType === "auth"
                      ? "Authentication Error"
                      : "Data Loading Issue"}
                  </p>
                  <p
                    className={`text-sm ${
                      errorType === "network"
                        ? "text-orange-700"
                        : errorType === "auth"
                        ? "text-red-700"
                        : "text-blue-700"
                    }`}
                  >
                    {error}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`${
                    errorType === "network"
                      ? "text-orange-700 hover:text-orange-800"
                      : errorType === "auth"
                      ? "text-red-700 hover:text-red-800"
                      : "text-blue-700 hover:text-blue-800"
                  }`}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Dynamic Stats Grid based on user type */}
          {userType === "vendor" && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
              <StatsCard
                title="Total Inquiries"
                value={dashboardData?.vendorStats?.totalInquiries || 0}
                icon={<MessageSquare className="w-6 h-6 text-blue-600" />}
                loading={dataLoading}
                error={error}
              />

              <StatsCard
                title="Total Bookings"
                value={dashboardData?.vendorStats?.totalBookings || 0}
                icon={<CheckCircle className="w-6 h-6 text-green-600" />}
                loading={dataLoading}
                error={error}
              />

              <StatsCard
                title="Profile Views"
                value={dashboardData?.vendorStats?.profileViews || 0}
                icon={<Eye className="w-6 h-6 text-purple-600" />}
                loading={dataLoading}
                error={error}
              />

              <StatsCard
                title="Response Rate"
                value={`${dashboardData?.vendorStats?.responseRate || 0}%`}
                icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
                loading={dataLoading}
                error={error}
              />
            </div>
          )}

          {userType === "planner" && dashboardData?.eventData && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
              <StatsCard
                title="Days Until Event"
                value={dashboardData.eventData.stats?.daysUntilEvent || 0}
                icon={<Clock className="w-6 h-6 text-blue-600" />}
                loading={dataLoading}
                error={error}
              />

              <StatsCard
                title="Total Guests"
                value={dashboardData.eventData.stats?.totalGuests || 0}
                icon={<Users className="w-6 h-6 text-green-600" />}
                loading={dataLoading}
                error={error}
              />

              <StatsCard
                title="Budget Spent"
                value={`€${dashboardData.eventData.stats?.spentBudget || 0}`}
                icon={<DollarSign className="w-6 h-6 text-purple-600" />}
                loading={dataLoading}
                error={error}
              />

              <StatsCard
                title="Tasks Completed"
                value={`${dashboardData.eventData.stats?.completedTasks || 0}/${
                  dashboardData.eventData.stats?.totalTasks || 0
                }`}
                icon={<CheckCircle className="w-6 h-6 text-orange-600" />}
                loading={dataLoading}
                error={error}
              />
            </div>
          )}

          {userType === "viewer" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Get Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => router.push("/dashboard/vendors")}
                    >
                      <Building2 className="w-4 h-4" />
                      Browse Vendors
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() =>
                        router.push("/dashboard/vendors/favorites")
                      }
                    >
                      <Heart className="w-4 h-4" />
                      Saved Vendors
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => router.push("/dashboard/profile")}
                    >
                      <MapPin className="w-4 h-4" />
                      Set Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Performance Metrics - Only for vendors */}
          {userType === "vendor" && (
            <PerformanceMetrics
              avgResponseTime={
                dashboardData?.vendorStats?.avgResponseTime || "N/A"
              }
              pendingInquiries={
                dashboardData?.vendorStats?.pendingInquiries || 0
              }
              monthlyGrowth={dashboardData?.monthlyGrowth || 0}
              profileCompletion={dashboardData?.profileCompletion || 0}
              loading={dataLoading}
              error={error}
            />
          )}

          {/* User-specific Content */}
          {userType === "vendor" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions for Vendors */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => router.push("/dashboard/services/new")}
                      >
                        <Plus className="w-4 h-4" />
                        Add New Service
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => router.push("/dashboard/gallery")}
                      >
                        <Eye className="w-4 h-4" />
                        Manage Gallery
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => router.push("/dashboard/calendar")}
                      >
                        <Calendar className="w-4 h-4" />
                        Update Availability
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => router.push("/dashboard/profile")}
                      >
                        <Building2 className="w-4 h-4" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => router.push("/dashboard/profile")}
                      >
                        <MapPin className="w-4 h-4" />
                        Manage Locations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Inquiries for Vendors */}
              <div className="lg:col-span-2">
                <RecentInquiries
                  inquiries={dashboardData?.recentInquiries || []}
                  loading={dataLoading}
                  error={error}
                />
              </div>
            </div>
          )}

          {userType === "planner" && dashboardData?.eventData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Event Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboardData.eventData.event ? (
                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium text-gray-700">
                            Event Type
                          </h4>
                          <p className="text-gray-600">
                            {dashboardData.eventData.event.event_type}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700">
                            Event Date
                          </h4>
                          <p className="text-gray-600">
                            {new Date(
                              dashboardData.eventData.event.event_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700">Venue</h4>
                          <p className="text-gray-600">
                            {dashboardData.eventData.event.venue || "Not set"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        No event information available
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Activity tracking coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upcoming Events - Show for all users who have events */}
          {(userType === "vendor" ||
            (userType === "planner" && dashboardData?.eventData)) && (
            <UpcomingEvents
              events={dashboardData?.upcomingEvents || []}
              loading={dataLoading}
              error={error}
              dashboardError={null}
            />
          )}
        </div>
      </ClientDashboardLayout>
    </ErrorBoundary>
  );
}
