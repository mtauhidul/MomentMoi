"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { ChecklistItem, ChecklistStats, ChecklistFilters } from "@/types/checklist";

export function useChecklist(eventId?: string) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      fetchChecklistItems(targetEventId);

      // Set up real-time subscription
      const channel = supabase
        .channel("checklist-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "checklist_items",
            filter: `event_id=eq.${targetEventId}`,
          },
          () => {
            fetchChecklistItems(targetEventId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initialize();
  }, [eventId]);

  const fetchChecklistItems = async (targetEventId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("event_id", targetEventId)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("title");

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch checklist items";
      setError(errorMessage);
      console.error("Failed to fetch checklist items:", err);
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = async (itemData: Omit<ChecklistItem, "id" | "event_id" | "created_at" | "updated_at">) => {
    if (!currentEventId) throw new Error("No event ID available");

    try {
      setError(null);
      const { data, error } = await supabase
        .from("checklist_items")
        .insert({ ...itemData, event_id: currentEventId })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setItems(prev => [...prev, data].sort((a, b) => {
        // Sort by due date first (nulls last), then by title
        if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title);
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }));

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add checklist item";
      setError(errorMessage);
      throw err instanceof Error ? err : new Error(errorMessage);
    }
  };

  const updateChecklistItem = async (itemId: string, updates: Partial<ChecklistItem>) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("checklist_items")
        .update(updates)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, ...data } : item
      ).sort((a, b) => {
        // Sort by due date first (nulls last), then by title
        if (!a.due_date && !b.due_date) return a.title.localeCompare(b.title);
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }));

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update checklist item";
      setError(errorMessage);
      throw err instanceof Error ? err : new Error(errorMessage);
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    try {
      setError(null);
      const { error } = await supabase
        .from("checklist_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      // Update local state
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete checklist item";
      setError(errorMessage);
      throw err instanceof Error ? err : new Error(errorMessage);
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    return await updateChecklistItem(itemId, { completed: !item.completed });
  };

  const getChecklistStats = (): ChecklistStats => {
    const now = new Date();
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const overdue = items.filter(item =>
      !item.completed &&
      item.due_date &&
      new Date(item.due_date) < now
    ).length;
    const upcoming = items.filter(item =>
      !item.completed &&
      item.due_date &&
      new Date(item.due_date) >= now
    ).length;

    return {
      total,
      completed,
      overdue,
      upcoming,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  };

  const filterChecklistItems = (filters: Partial<ChecklistFilters>) => {
    let filtered = [...items];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const now = new Date();
      switch (filters.status) {
        case 'completed':
          filtered = filtered.filter(item => item.completed);
          break;
        case 'pending':
          filtered = filtered.filter(item => !item.completed);
          break;
        case 'overdue':
          filtered = filtered.filter(item =>
            !item.completed &&
            item.due_date &&
            new Date(item.due_date) < now
          );
          break;
      }
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'due_date';
    const sortOrder = filters.sortOrder || 'asc';

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'due_date':
        default:
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  };

  return {
    // State
    items,
    loading,
    error,
    eventId: currentEventId,

    // Actions
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,

    // Computed values
    getChecklistStats,
    filterChecklistItems,

    // Utilities
    refetch: () => currentEventId ? fetchChecklistItems(currentEventId) : Promise.resolve(),
  };
}
