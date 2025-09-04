"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Guest, GuestGroup, RSVPStatus } from "@/types/guests";

export function useGuests(eventId?: string) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  // Fetch event ID if not provided
  const fetchEventId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: event, error } = await supabase
        .from("events")
        .select("id")
        .eq("planner_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return event?.id || null;
    } catch (err) {
      console.error("Failed to fetch event ID:", err);
      return null;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      let targetEventId = eventId;
      
      if (!targetEventId) {
        targetEventId = await fetchEventId();
        setCurrentEventId(targetEventId || null);
      } else {
        setCurrentEventId(targetEventId);
      }

      if (!targetEventId) {
        setLoading(false);
        return;
      }

      fetchGuests(targetEventId);
      fetchGroups(targetEventId);

      // Set up real-time subscription
      const channel = supabase
        .channel("guests-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "guests",
            filter: `event_id=eq.${targetEventId}`,
          },
          () => {
            fetchGuests(targetEventId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initialize();
  }, [eventId]);

  const fetchGuests = async (targetEventId: string) => {
    try {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("event_id", targetEventId)
        .order("name");

      if (error) throw error;
      setGuests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch guests");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (targetEventId: string) => {
    try {
      setGroupsError(null);
      const { data, error } = await supabase
        .from("guest_groups")
        .select("*")
        .eq("event_id", targetEventId)
        .order("sort_order");

      if (error) throw error;
      setGroups(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch groups";
      setGroupsError(errorMessage);
      console.error("Failed to fetch groups:", err);
    }
  };

  const addGuest = async (guestData: Omit<Guest, "id" | "created_at" | "updated_at">) => {
    if (!currentEventId) throw new Error("No event ID available");

    try {
      const { data, error } = await supabase
        .from("guests")
        .insert(guestData)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setGuests(prev => [...prev, data]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to add guest");
    }
  };

  const updateGuest = async (guestId: string, updates: Partial<Guest>) => {
    try {
      const { data, error } = await supabase
        .from("guests")
        .update(updates)
        .eq("id", guestId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setGuests(prev => prev.map(guest => 
        guest.id === guestId ? { ...guest, ...data } : guest
      ));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update guest");
    }
  };

  const deleteGuest = async (guestId: string) => {
    try {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", guestId);

      if (error) throw error;
      
      // Update local state
      setGuests(prev => prev.filter(guest => guest.id !== guestId));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to delete guest");
    }
  };

  const updateRSVPStatus = async (guestId: string, status: RSVPStatus, responseDate?: Date) => {
    try {
      const updates = {
        rsvp_status: status,
        rsvp_response_date: responseDate ? responseDate.toISOString() : new Date().toISOString(),
      };

      return await updateGuest(guestId, updates);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update RSVP status");
    }
  };

  const getGuestStats = () => {
    const total = guests.length;
    const confirmed = guests.filter(g => g.rsvp_status === "confirmed").length;
    const pending = guests.filter(g => g.rsvp_status === "pending").length;
    const declined = guests.filter(g => g.rsvp_status === "declined").length;
    const maybe = guests.filter(g => g.rsvp_status === "maybe").length;

    return { total, confirmed, pending, declined, maybe };
  };

  const getGuestsByGroup = (groupName: string) => {
    return guests.filter(guest => guest.group_category === groupName);
  };

  const searchGuests = (searchTerm: string, statusFilter: string = "all") => {
    return guests.filter(guest => {
      const matchesSearch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || guest.rsvp_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

  const createGroup = async (groupData: Omit<GuestGroup, "id" | "event_id" | "created_at" | "updated_at">) => {
    if (!currentEventId) throw new Error("No event ID available");

    try {
      setGroupsError(null);
      const { data, error } = await supabase
        .from("guest_groups")
        .insert({ ...groupData, event_id: currentEventId })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setGroups(prev => [...prev, data]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create group";
      setGroupsError(errorMessage);
      throw err instanceof Error ? err : new Error(errorMessage);
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<GuestGroup>) => {
    try {
      setGroupsError(null);
      const { data, error } = await supabase
        .from("guest_groups")
        .update(updates)
        .eq("id", groupId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setGroups(prev => prev.map(group =>
        group.id === groupId ? { ...group, ...data } : group
      ));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update group";
      setGroupsError(errorMessage);
      throw err instanceof Error ? err : new Error(errorMessage);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      setGroupsError(null);
      const { error } = await supabase
        .from("guest_groups")
        .delete()
        .eq("id", groupId);

      if (error) throw error;

      // Update local state
      setGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete group";
      setGroupsError(errorMessage);
      throw err instanceof Error ? err : new Error(errorMessage);
    }
  };

  return {
    // State
    guests,
    groups,
    loading,
    error,
    groupsError,
    eventId: currentEventId,

    // Actions
    addGuest,
    updateGuest,
    deleteGuest,
    updateRSVPStatus,

    // Group Actions
    createGroup,
    updateGroup,
    deleteGroup,

    // Computed values
    getGuestStats,
    getGuestsByGroup,
    searchGuests,

    // Utilities
    refetch: () => currentEventId ? fetchGuests(currentEventId) : Promise.resolve(),
    refetchGroups: async () => {
      if (!currentEventId) return;
      try {
        await fetchGroups(currentEventId);
      } catch (err) {
        // Error is already handled in fetchGroups
        console.error("Failed to refetch groups:", err);
      }
    },
  };
}
