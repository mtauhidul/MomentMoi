"use client";

import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  planner_id: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  guest_count: string | null;
  event_style: string | null;
  budget_range: string | null;
  planning_stage: string | null;
  ceremony_venue: string | null;
  reception_venue: string | null;
  ceremony_time: string | null;
  reception_time: string | null;
  created_at: string;
  updated_at: string;
}

interface Partner {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: string;
}

interface Guest {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: string;
  dietary_restrictions: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistItem {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface BudgetItem {
  id: string;
  event_id: string;
  category: string;
  name: string;
  estimated_cost: number | null;
  actual_cost: number | null;
  created_at: string;
  updated_at: string;
}

interface ActivityItem {
  id: string;
  type: "guest_added" | "task_completed" | "budget_updated" | "vendor_contacted";
  message: string;
  timestamp: string;
}

interface ClientDashboardData {
  event: Event | null;
  partner: Partner | null;
  stats: {
    daysUntilEvent: number;
    totalGuests: number;
    confirmedGuests: number;
    totalBudget: number;
    spentBudget: number;
    completedTasks: number;
    totalTasks: number;
  };
  recentActivity: ActivityItem[];
  upcomingDeadlines: ChecklistItem[];
}

interface UseClientDashboardReturn {
  data: ClientDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<any>;
}

// Query key factory for consistent cache keys
const clientDashboardKeys = {
  all: ['client-dashboard'] as const,
  planner: (userId: string) => ['client-dashboard', 'planner', userId] as const,
};

export function useClientDashboard(): UseClientDashboardReturn {
  const { user, userType } = useAuth();
  const supabase = createClientComponentClient();
  const queryClient = useQueryClient();

  // React Query for client dashboard data
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: user?.id && userType === "planner" ? clientDashboardKeys.planner(user.id) : clientDashboardKeys.all,
    queryFn: async (): Promise<ClientDashboardData> => {
      if (!user) {
        throw new Error("User not available");
      }

      // Only fetch data for planner users
      if (userType !== "planner") {
        console.log("useClientDashboard - Skipping data fetch for non-planner user:", userType);
        return {
          event: null,
          partner: null,
          stats: {
            daysUntilEvent: 0,
            totalGuests: 0,
            confirmedGuests: 0,
            totalBudget: 0,
            spentBudget: 0,
            completedTasks: 0,
            totalTasks: 0,
          },
          recentActivity: [],
          upcomingDeadlines: [],
        };
      }

      console.log("🔄 useClientDashboard - Fetching planner dashboard data for user:", user.id);

      // Fetch user's event
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("planner_id", user.id)
        .single();

      if (eventsError && eventsError.code !== "PGRST116") {
        throw eventsError;
      }

      const event = events || null;

      // Fetch partner information if user has a couple profile
      let partner: Partner | null = null;
      if (event) {
        const { data: coupleProfile, error: coupleError } = await supabase
          .from("couple_profiles")
          .select("partner_id")
          .eq("user_id", user.id)
          .single();

        if (!coupleError && coupleProfile?.partner_id) {
          const { data: partnerData, error: partnerError } = await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url, user_type")
            .eq("id", coupleProfile.partner_id)
            .single();

          if (!partnerError) {
            partner = partnerData;
          }
        }
      }

      // Fetch guests if event exists
      let guests: Guest[] = [];
      if (event) {
        const { data: guestsData, error: guestsError } = await supabase
          .from("guests")
          .select("*")
          .eq("event_id", event.id);

        if (!guestsError) {
          guests = guestsData || [];
        }
      }

      // Fetch checklist items if event exists
      let checklistItems: ChecklistItem[] = [];
      if (event) {
        const { data: checklistData, error: checklistError } = await supabase
          .from("checklist_items")
          .select("*")
          .eq("event_id", event.id);

        if (!checklistError) {
          checklistItems = checklistData || [];
        }
      }

      // Fetch budget items if event exists
      let budgetItems: BudgetItem[] = [];
      if (event) {
        const { data: budgetData, error: budgetError } = await supabase
          .from("budget_items")
          .select("*")
          .eq("event_id", event.id);

        if (!budgetError) {
          budgetItems = budgetData || [];
        }
      }

      // Calculate stats
      const stats = {
        daysUntilEvent: event?.event_date
          ? Math.max(0, Math.ceil((new Date(event.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
          : 0,
        totalGuests: guests.length,
        confirmedGuests: guests.filter(g => g.rsvp_status === "confirmed").length,
        totalBudget: budgetItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0),
        spentBudget: budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0),
        completedTasks: checklistItems.filter(item => item.completed).length,
        totalTasks: checklistItems.length,
      };

      // Generate recent activity (simplified for now)
      const recentActivity: ActivityItem[] = [];

      // Add recent guest additions
      const recentGuests = guests
        .filter(g => new Date(g.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .slice(0, 3);

      recentGuests.forEach(guest => {
        recentActivity.push({
          id: guest.id,
          type: "guest_added",
          message: `Added ${guest.name} to guest list`,
          timestamp: guest.created_at,
        });
      });

      // Add recent task completions
      const recentCompletedTasks = checklistItems
        .filter(item => item.completed && new Date(item.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .slice(0, 3);

      recentCompletedTasks.forEach(task => {
        recentActivity.push({
          id: task.id,
          type: "task_completed",
          message: `Completed: ${task.title}`,
          timestamp: task.updated_at,
        });
      });

      // Add recent budget updates
      const recentBudgetUpdates = budgetItems
        .filter(item => new Date(item.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .slice(0, 3);

      recentBudgetUpdates.forEach(item => {
        const hasActualCost = item.actual_cost && item.actual_cost > 0;
        recentActivity.push({
          id: item.id,
          type: "budget_updated",
          message: hasActualCost
            ? `Paid ${item.name}: $${item.actual_cost}`
            : `Added budget item: ${item.name}`,
          timestamp: item.updated_at,
        });
      });

      // Sort by timestamp
      recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Get upcoming deadlines (tasks due in next 30 days)
      const upcomingDeadlines = checklistItems
        .filter(item =>
          item.due_date &&
          !item.completed &&
          new Date(item.due_date) > new Date() &&
          new Date(item.due_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        )
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 5);

      return {
        event,
        partner,
        stats,
        recentActivity,
        upcomingDeadlines,
      };
    },
    enabled: !!user?.id && userType === "planner",
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('auth') || error?.message?.includes('User not available')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Set up real-time subscriptions with cache invalidation instead of refetching
  React.useEffect(() => {
    if (!user || userType !== "planner") return;

    const channel = supabase
      .channel("client-dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `planner_id=eq.${user.id}` },
        (payload) => {
          console.log("Events real-time update:", payload);
          queryClient.invalidateQueries({
            queryKey: clientDashboardKeys.planner(user.id),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guests" },
        (payload) => {
          console.log("Guests real-time update:", payload);
          queryClient.invalidateQueries({
            queryKey: clientDashboardKeys.planner(user.id),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_items" },
        (payload) => {
          console.log("Checklist real-time update:", payload);
          queryClient.invalidateQueries({
            queryKey: clientDashboardKeys.planner(user.id),
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budget_items" },
        (payload) => {
          console.log("Budget real-time update:", payload);
          queryClient.invalidateQueries({
            queryKey: clientDashboardKeys.planner(user.id),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userType, supabase, queryClient]);

  return {
    data: data || null,
    loading,
    error: error?.message || null,
    refetch,
  };
}
