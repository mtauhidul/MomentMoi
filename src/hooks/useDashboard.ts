import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useVendorDashboard } from "./useVendorDashboard";
import { useClientDashboard } from "./useClientDashboard";

export interface DashboardData {
  // Common data for all user types
  userType: "planner" | "vendor" | "viewer";
  businessName?: string;
  eventName?: string;
  
  // Vendor-specific data
  vendorStats?: {
    totalInquiries: number;
    pendingInquiries: number;
    totalBookings: number;
    profileViews: number;
    responseRate: number;
    avgResponseTime: string;
    businessName: string;
  };
  recentInquiries?: any[];
  upcomingEvents?: any[];
  profileCompletion?: number;
  monthlyGrowth?: number;
  
  // Planner-specific data
  eventData?: {
    event: any;
    partner: any;
    stats: {
      daysUntilEvent: number;
      totalGuests: number;
      confirmedGuests: number;
      totalBudget: number;
      spentBudget: number;
      completedTasks: number;
      totalTasks: number;
    };
    recentActivity: any[];
    upcomingDeadlines: any[];
  };
  
  // Viewer-specific data
  viewerData?: {
    savedVendors: any[];
    recentSearches: any[];
  };
}

export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  userType: "planner" | "vendor" | "viewer" | null;
}

// Query key factory for consistent cache keys
const dashboardKeys = {
  all: ['dashboard'] as const,
  vendor: (userId: string) => ['dashboard', 'vendor', userId] as const,
  planner: (userId: string) => ['dashboard', 'planner', userId] as const,
  viewer: (userId: string) => ['dashboard', 'viewer', userId] as const,
};

export function useDashboard(): UseDashboardReturn {
  const { user, userType: centralizedUserType, profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Use centralized user type
  const userType = centralizedUserType;

  // Always call both hooks - they handle user type logic internally
  // This follows React's Rules of Hooks while maintaining clean architecture
  const vendorDashboard = useVendorDashboard();
  const clientDashboard = useClientDashboard();

  // React Query for dashboard data - simplified to leverage underlying hook caching
  const {
    data: dashboardData,
    isLoading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: user?.id && userType ? dashboardKeys[userType](user.id) : dashboardKeys.all,
    queryFn: async (): Promise<DashboardData> => {
      console.log("🔄 useDashboard - Composing dashboard data for userType:", userType, "user:", user?.id);

      if (!userType) {
        throw new Error("User type not available");
      }

      let data: DashboardData = {
        userType,
      };

      if (userType === "vendor") {
        console.log("🏪 useDashboard - Setting up vendor dashboard data");

        // Wait for vendor data to be available
        if (vendorDashboard.loading) {
          throw new Error("Vendor data still loading");
        }

        if (vendorDashboard.error) {
          throw new Error(vendorDashboard.error);
        }

        data = {
          ...data,
          vendorStats: vendorDashboard.vendorStats || undefined,
          recentInquiries: vendorDashboard.recentInquiries,
          upcomingEvents: vendorDashboard.upcomingEvents,
          profileCompletion: vendorDashboard.profileCompletion,
          monthlyGrowth: vendorDashboard.monthlyGrowth,
          businessName: vendorDashboard.vendorStats?.businessName || profile?.business_name || "Your Business",
        };

      } else if (userType === "planner") {
        // Wait for client data to be available
        if (clientDashboard.loading) {
          throw new Error("Planner data still loading");
        }

        if (clientDashboard.error) {
          throw new Error(clientDashboard.error);
        }

        data = {
          ...data,
          eventData: clientDashboard.data || undefined,
          eventName: clientDashboard.data?.event?.event_type || "Your Event",
        };

      } else if (userType === "viewer") {
        // Viewer dashboard - minimal data
        data = {
          ...data,
          viewerData: {
            savedVendors: [],
            recentSearches: [],
          },
        };
      }

      return data;
    },
    enabled: !!user?.id && !!userType && !authLoading &&
             // Only enable when underlying data is ready
             (userType === "vendor" ? !vendorDashboard.loading :
              userType === "planner" ? !clientDashboard.loading :
              true),
    staleTime: 2 * 60 * 1000, // 2 minutes - data stays fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
    retry: (failureCount, error) => {
      // Don't retry on auth errors or loading states
      if (error?.message?.includes('auth') ||
          error?.message?.includes('User type not available') ||
          error?.message?.includes('still loading')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Enhanced refetch function that invalidates all related queries
  const handleRefetch = async () => {
    // Invalidate dashboard query
    await queryClient.invalidateQueries({
      queryKey: user?.id && userType ? dashboardKeys[userType](user.id) : dashboardKeys.all,
    });

    // Also refetch the underlying hooks if they have refetch functions
    if (userType === "vendor" && vendorDashboard.refetch) {
      await vendorDashboard.refetch();
    } else if (userType === "planner" && clientDashboard.refetch) {
      await clientDashboard.refetch();
    }
  };

  // Calculate overall loading state
  const isLoading = authLoading ||
                   (userType === "vendor" ? vendorDashboard.loading :
                    userType === "planner" ? clientDashboard.loading :
                    false) ||
                   queryLoading;

  // Combine errors from all sources
  const error = queryError?.message || vendorDashboard.error || clientDashboard.error || null;

  return {
    data: dashboardData || null,
    loading: isLoading,
    error,
    refetch: handleRefetch,
    userType,
  };
}
