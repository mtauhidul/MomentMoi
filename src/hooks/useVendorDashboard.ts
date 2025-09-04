import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  handleSupabaseError,
  createErrorContext,
  retryOperation,
  DASHBOARD_ERROR_MESSAGES,
  type DashboardError
} from "@/lib/error-handler";

export interface VendorStats {
  totalInquiries: number;
  pendingInquiries: number;
  totalBookings: number;
  profileViews: number;
  responseRate: number;
  avgResponseTime: string;
  businessName: string;
}

export interface RecentInquiry {
  id: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  message: string;
  status: "new" | "responded" | "booked" | "declined" | "archived";
  createdAt: string;
}

export interface UpcomingEvent {
  id: string;
  clientName: string;
  clientEmail: string;
  eventType: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  guestCount?: number;
  budgetAmount?: number;
  status: "confirmed" | "pending" | "cancelled";
  notes?: string;
  createdAt: string;
}

// Query key factory for consistent cache keys
const vendorDashboardKeys = {
  all: ['vendor-dashboard'] as const,
  vendor: (vendorId: string) => ['vendor-dashboard', 'vendor', vendorId] as const,
  stats: (vendorId: string) => ['vendor-dashboard', 'stats', vendorId] as const,
  inquiries: (vendorId: string) => ['vendor-dashboard', 'inquiries', vendorId] as const,
  events: (vendorId: string) => ['vendor-dashboard', 'events', vendorId] as const,
  profile: (vendorId: string) => ['vendor-dashboard', 'profile', vendorId] as const,
  growth: (vendorId: string) => ['vendor-dashboard', 'growth', vendorId] as const,
};

/**
 * Vendor Dashboard Hook
 * 
 * This hook is designed specifically for vendor accounts. It will:
 * 1. Check if the current user has a vendor profile
 * 2. Load vendor-specific dashboard data (stats, inquiries, events, etc.)
 * 3. Set up real-time subscriptions for vendor data
 * 4. Provide appropriate error messages for non-vendor users
 * 
 * Expected behavior for non-vendor users:
 * - Will show an error message indicating vendor profile is required
 * - Will not attempt to load vendor-specific data
 * - Will not set up real-time subscriptions
 * 
 * @returns Vendor dashboard data and state management
 */
export function useVendorDashboard() {
  const { user, userType } = useAuth();
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();

  // Get vendor ID first
  const [vendorId, setVendorId] = React.useState<string | null>(null);
  const [vendorIdLookupCompleted, setVendorIdLookupCompleted] = React.useState(false);
  const subscriptionsRef = React.useRef<RealtimeChannel[]>([]);



  // Get vendor profile ID with error handling and retry logic
  const getVendorId = React.useCallback(async () => {
    if (!user?.id) {
      console.log("No user ID available for vendor profile lookup");
      return null;
    }

    const context = createErrorContext('useVendorDashboard', 'getVendorId', user.id);

    // Retry logic for vendor profile lookup
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to get vendor ID (attempt ${attempt}/${maxRetries})`);

        // First check if user has a profile and is a vendor
        const { data: userProfile, error: userProfileError } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", user.id)
          .single();

        console.log(`🔍 useVendorDashboard - Profile query result (attempt ${attempt}):`, {
          userId: user.id,
          userProfile,
          userProfileError,
          userProfileErrorCode: userProfileError?.code,
          context
        });

        if (userProfileError) {
          console.error("Error getting user profile:", {
            error: userProfileError,
            userId: user.id,
            context: context,
            attempt
          });

          // If it's the last attempt, return null
          if (attempt === maxRetries) return null;

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        if (!userProfile) {
          console.error("No user profile found for user:", user.id);
          return null;
        }

        console.log("✅ useVendorDashboard - User profile found:", {
          userId: user.id,
          userType: userProfile.user_type,
          context
        });

        if (userProfile.user_type !== 'vendor') {
          console.log("❌ User is not a vendor, user_type:", userProfile.user_type, {
            userId: user.id,
            context
          });
          return null;
        }

        // Now get the vendor profile with better error handling
        const { data: vendorProfile, error: profileError } = await supabase
          .from("vendor_profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          // Check if this is a "not found" error that might resolve with retry
          if (profileError.code === 'PGRST116' && attempt < maxRetries) {
            console.log(`Vendor profile not found, retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }

          const dashboardError = handleSupabaseError(profileError, context);
          console.error("Error getting vendor ID:", {
            error: profileError,
            dashboardError: dashboardError,
            userId: user.id,
            userType: userProfile.user_type,
            context: context,
            attempt
          });
          return null;
        }

        if (!vendorProfile) {
          console.log("No vendor profile found for user:", user.id);
          return null;
        }

        console.log("Successfully found vendor profile:", vendorProfile.id);
        return vendorProfile.id;
      } catch (err) {
        console.error(`Error in getVendorId attempt ${attempt}:`, err);

        // If it's the last attempt, handle the error
        if (attempt === maxRetries) {
          const dashboardError = handleSupabaseError(err, context);
          console.error("Error getting vendor ID after all retries:", {
            error: err,
            dashboardError: dashboardError,
            userId: user.id,
            context: context
          });
          return null;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return null;
  }, [user?.id]); // Only include user.id as dependency to prevent infinite loops

  // Utility functions
  const calculateAverageResponseTime = (responseTimes: any[]): string => {
    if (responseTimes.length === 0) return "N/A";

    const totalHours = responseTimes.reduce((total, inquiry) => {
      const created = new Date(inquiry.created_at);
      const responded = new Date(inquiry.responded_at);
      const diffHours =
        (responded.getTime() - created.getTime()) / (1000 * 60 * 60);
      return total + diffHours;
    }, 0);

    const avgHours = totalHours / responseTimes.length;

    if (avgHours < 1) {
      return `${Math.round(avgHours * 60)} minutes`;
    } else if (avgHours < 24) {
      return `${avgHours.toFixed(1)} hours`;
    } else {
      return `${Math.round(avgHours / 24)} days`;
    }
  };

  const parseBudgetRange = (budgetRange: string): number | null => {
    try {
      const match = budgetRange.match(/[\d,]+/);
      if (match) {
        return parseFloat(match[0].replace(/,/g, ""));
      }
      return null;
    } catch {
      return null;
    }
  };

  // React Query for vendor stats
  const {
    data: vendorStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: vendorId ? vendorDashboardKeys.stats(vendorId) : vendorDashboardKeys.all,
    queryFn: async (): Promise<VendorStats> => {
      if (!vendorId) throw new Error("Vendor ID not available");

      const context = createErrorContext('useVendorDashboard', 'fetchVendorStats', user?.id, vendorId);

      console.log("🔄 useVendorDashboard - Fetching vendor stats for:", vendorId);

      return await retryOperation(async () => {
        // Get total inquiries
        const { count: totalInquiries, error: inquiriesError } = await supabase
          .from("vendor_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId);

        if (inquiriesError) throw inquiriesError;

        // Get pending inquiries (new status)
        const { count: pendingInquiries, error: pendingError } = await supabase
          .from("vendor_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId)
          .eq("status", "new");

        if (pendingError) throw pendingError;

        // Get total booked inquiries
        const { count: totalBookedInquiries, error: bookedInquiriesError } = await supabase
          .from("vendor_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId)
          .eq("status", "booked");

        if (bookedInquiriesError) throw bookedInquiriesError;

        // Calculate response rate
        const { count: respondedInquiries, error: respondedError } = await supabase
          .from("vendor_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("vendor_id", vendorId)
          .in("status", ["responded", "booked"]);

        if (respondedError) throw respondedError;

        const responseRate = totalInquiries
          ? Math.round(((respondedInquiries || 0) / totalInquiries) * 100)
          : 0;

        // Calculate average response time
        const { data: responseTimes, error: responseTimesError } = await supabase
          .from("vendor_inquiries")
          .select("created_at, responded_at")
          .eq("vendor_id", vendorId)
          .not("responded_at", "is", null);

        if (responseTimesError) throw responseTimesError;

        const avgResponseTime = calculateAverageResponseTime(responseTimes || []);

        // Get profile views from analytics table
        const { data: analyticsData, error: analyticsError } = await supabase
          .from("vendor_analytics")
          .select("profile_views")
          .eq("vendor_id", vendorId)
          .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
          .order("date", { ascending: false });

        if (analyticsError) throw analyticsError;

        // Sum up profile views for current month
        const totalProfileViews = analyticsData?.reduce((sum, record) => sum + (record.profile_views || 0), 0) || 0;

        // Get business name from vendor profile
        const { data: vendorProfile, error: profileError } = await supabase
          .from("vendor_profiles")
          .select("business_name")
          .eq("user_id", user?.id)
          .single();

        if (profileError) {
          console.warn("Could not fetch business name:", profileError);
        }

        return {
          totalInquiries: totalInquiries || 0,
          pendingInquiries: pendingInquiries || 0,
          totalBookings: totalBookedInquiries || 0,
          profileViews: totalProfileViews,
          responseRate,
          avgResponseTime,
          businessName: vendorProfile?.business_name || "Your Business",
        };
      }, 3, 1000, context);
    },
    enabled: !!vendorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // React Query for recent inquiries
  const {
    data: recentInquiries = [],
    isLoading: inquiriesLoading,
    error: inquiriesError,
    refetch: refetchInquiries,
  } = useQuery({
    queryKey: vendorId ? vendorDashboardKeys.inquiries(vendorId) : vendorDashboardKeys.all,
    queryFn: async (): Promise<RecentInquiry[]> => {
      if (!vendorId) throw new Error("Vendor ID not available");

      const context = createErrorContext('useVendorDashboard', 'fetchRecentInquiries', user?.id, vendorId);

      console.log("🔄 useVendorDashboard - Fetching recent inquiries for:", vendorId);

      return await retryOperation(async () => {
        const { data: inquiries, error } = await supabase
          .from("vendor_inquiries")
          .select(`
            id,
            created_at,
            message,
            status,
            event_type,
            event_date,
            client_name
          `)
          .eq("vendor_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;

        return (inquiries || []).map((inquiry) => ({
          id: inquiry.id,
          clientName: inquiry.client_name || "Anonymous",
          eventType: inquiry.event_type || "Event",
          eventDate: inquiry.event_date || "",
          message: inquiry.message || "",
          status: inquiry.status as "new" | "responded" | "booked" | "declined" | "archived",
          createdAt: inquiry.created_at,
        }));
      }, 3, 1000, context);
    },
    enabled: !!vendorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // React Query for upcoming events
  const {
    data: upcomingEvents = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: vendorId ? vendorDashboardKeys.events(vendorId) : vendorDashboardKeys.all,
    queryFn: async (): Promise<UpcomingEvent[]> => {
      if (!vendorId) throw new Error("Vendor ID not available");

      const context = createErrorContext('useVendorDashboard', 'fetchUpcomingEvents', user?.id, vendorId);

      console.log("🔄 useVendorDashboard - Fetching upcoming events for:", vendorId);

      return await retryOperation(async () => {
        const today = new Date().toISOString().split('T')[0];

        const { data: bookedInquiries, error } = await supabase
          .from("vendor_inquiries")
          .select(`
            id,
            client_name,
            client_email,
            event_type,
            event_date,
            guest_count,
            location,
            budget_range,
            message,
            created_at
          `)
          .eq("vendor_id", vendorId)
          .eq("status", "booked")
          .gte("event_date", today)
          .order("event_date", { ascending: true })
          .limit(10);

        if (error) throw error;

        return (bookedInquiries || []).map((inquiry) => ({
          id: inquiry.id,
          clientName: inquiry.client_name || "Anonymous",
          clientEmail: inquiry.client_email || "",
          eventType: inquiry.event_type || "Event",
          eventDate: inquiry.event_date,
          startTime: undefined,
          endTime: undefined,
          location: inquiry.location || undefined,
          guestCount: inquiry.guest_count || undefined,
          budgetAmount: inquiry.budget_range ? parseBudgetRange(inquiry.budget_range) || undefined : undefined,
          status: "confirmed" as const,
          notes: inquiry.message || undefined,
          createdAt: inquiry.created_at,
        }));
      }, 3, 1000, context);
    },
    enabled: !!vendorId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // React Query for profile completion
  const {
    data: profileCompletion = 0,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: user?.id ? vendorDashboardKeys.profile(user.id) : vendorDashboardKeys.all,
    queryFn: async (): Promise<number> => {
      if (!user?.id) throw new Error("User ID not available");

      const context = createErrorContext('useVendorDashboard', 'calculateProfileCompletion', user.id);

      console.log("🔄 useVendorDashboard - Calculating profile completion for:", user.id);

      return await retryOperation(async () => {
        const { data: profile, error } = await supabase
          .from("vendor_profiles")
          .select(`
            business_name,
            description,
            logo_url,
            business_category,
            event_types
          `)
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        if (!profile) return 0;

        const requiredFields = [
          "business_name",
          "description",
          "business_category",
        ];

        const completedFields = requiredFields.filter((field) => {
          const value = profile[field as keyof typeof profile];
          return value && value.toString().trim() !== "";
        });

        return Math.round((completedFields.length / requiredFields.length) * 100);
      }, 2, 1000, context);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // React Query for monthly growth
  const {
    data: monthlyGrowth = 0,
    isLoading: growthLoading,
    error: growthError,
    refetch: refetchGrowth,
  } = useQuery({
    queryKey: vendorId ? vendorDashboardKeys.growth(vendorId) : vendorDashboardKeys.all,
    queryFn: async (): Promise<number> => {
      if (!vendorId) throw new Error("Vendor ID not available");

      const context = createErrorContext('useVendorDashboard', 'calculateMonthlyGrowth', user?.id, vendorId);

      console.log("🔄 useVendorDashboard - Calculating monthly growth for:", vendorId);

      return await retryOperation(async () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const { data: lastMonthData, error: lastMonthError } = await supabase
          .from("vendor_analytics")
          .select("profile_views")
          .eq("vendor_id", vendorId)
          .gte("date", lastMonth.toISOString().split('T')[0])
          .lt("date", thisMonth.toISOString().split('T')[0]);

        if (lastMonthError) throw lastMonthError;

        const { data: thisMonthData, error: thisMonthError } = await supabase
          .from("vendor_analytics")
          .select("profile_views")
          .eq("vendor_id", vendorId)
          .gte("date", thisMonth.toISOString().split('T')[0]);

        if (thisMonthError) throw thisMonthError;

        const lastMonthViews = lastMonthData?.reduce((sum, record) => sum + (record.profile_views || 0), 0) || 0;
        const thisMonthViews = thisMonthData?.reduce((sum, record) => sum + (record.profile_views || 0), 0) || 0;

        return lastMonthViews > 0
          ? Math.round(((thisMonthViews - lastMonthViews) / lastMonthViews) * 100)
          : 0;
      }, 2, 1000, context);
    },
    enabled: !!vendorId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Initialize vendor ID
  React.useEffect(() => {
    const initializeVendor = async () => {
      if (!user || userType !== "vendor") {
        setVendorIdLookupCompleted(true);
        return;
      }

      console.log("Initializing vendor for user:", user.id);
      try {
        const id = await getVendorId();
        setVendorId(id);
      } catch (error) {
        console.error("Error during vendor initialization:", error);
      } finally {
        setVendorIdLookupCompleted(true);
      }
    };

    initializeVendor();
  }, [user, userType]);

  // Setup real-time subscriptions with cache invalidation
  React.useEffect(() => {
    if (!vendorId) return;

    const cleanupSubscriptions = () => {
      subscriptionsRef.current.forEach((subscription) => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      });
      subscriptionsRef.current = [];
    };

    cleanupSubscriptions();

    const context = createErrorContext('useVendorDashboard', 'setupRealTimeSubscriptions', user?.id, vendorId);

    try {
      const inquiriesSubscription = supabase
        .channel(`vendor-inquiries-${vendorId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "vendor_inquiries",
            filter: `vendor_id=eq.${vendorId}`,
          },
          (payload) => {
            console.log("Inquiries real-time update:", payload);
            queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.stats(vendorId) });
            queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.inquiries(vendorId) });
          }
        )
        .subscribe();

      const bookedInquiriesSubscription = supabase
        .channel(`vendor-inquiries-booked-${vendorId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "vendor_inquiries",
            filter: `vendor_id=eq.${vendorId}`,
          },
          (payload) => {
            console.log("Booked inquiries real-time update:", payload);
            queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.stats(vendorId) });
            queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.events(vendorId) });
          }
        )
        .subscribe();

      const analyticsSubscription = supabase
        .channel(`vendor-analytics-${vendorId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "vendor_analytics",
            filter: `vendor_id=eq.${vendorId}`,
          },
          (payload) => {
            console.log("Analytics real-time update:", payload);
            queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.stats(vendorId) });
            queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.growth(vendorId) });
          }
        )
        .subscribe();

      const profileSubscription = supabase
        .channel(`vendor-profile-${user?.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "vendor_profiles",
            filter: `user_id=eq.${user?.id}`,
          },
          (payload) => {
            console.log("Profile real-time update:", payload);
            queryClient.invalidateQueries({ queryKey: vendorDashboardKeys.profile(user?.id!) });
          }
        )
        .subscribe();

      subscriptionsRef.current = [
        inquiriesSubscription,
        bookedInquiriesSubscription,
        analyticsSubscription,
        profileSubscription,
      ];

      console.log("Real-time subscriptions established for vendor:", vendorId);
    } catch (err) {
      const dashboardError = handleSupabaseError(err, context);
      console.error("Error setting up real-time subscriptions:", dashboardError);
    }

    return cleanupSubscriptions;
  }, [vendorId, user?.id, supabase, queryClient]);

  // Calculate overall loading and error states
  const loading = statsLoading || inquiriesLoading || eventsLoading || profileLoading || growthLoading;
  const error = statsError?.message || inquiriesError?.message || eventsError?.message || profileError?.message || growthError?.message || null;

  // Smart refresh function
  const refetch = React.useCallback(async () => {
    await Promise.all([
      refetchStats(),
      refetchInquiries(),
      refetchEvents(),
      refetchProfile(),
      refetchGrowth(),
    ]);
  }, [refetchStats, refetchInquiries, refetchEvents, refetchProfile, refetchGrowth]);

  return {
    vendorStats: vendorStats || null,
    recentInquiries,
    upcomingEvents,
    profileCompletion,
    monthlyGrowth,
    loading,
    statsLoading,
    inquiriesLoading,
    eventsLoading,
    profileLoading,
    growthLoading,
    error,
    dashboardError: null, // Simplified for now
    refetch,
    refreshStats: refetchStats,
    refreshInquiries: refetchInquiries,
    refreshEvents: refetchEvents,
    refreshProfileData: React.useCallback(async () => {
      await Promise.all([refetchProfile(), refetchGrowth()]);
    }, [refetchProfile, refetchGrowth]),
  };
}
