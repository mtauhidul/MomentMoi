"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { BudgetItem, BudgetStats, BudgetFilters, BudgetFormData, BudgetCategory } from "@/types/budget";

export function useBudget(eventId?: string) {
  const [items, setItems] = useState<BudgetItem[]>([]);
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

      fetchBudgetItems(targetEventId);

      // Set up real-time subscription
      const channel = supabase
        .channel("budget-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "budget_items",
            filter: `event_id=eq.${targetEventId}`,
          },
          () => {
            fetchBudgetItems(targetEventId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initialize();
  }, [eventId]);

  const fetchBudgetItems = async (targetEventId: string) => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("event_id", targetEventId)
        .order("category")
        .order("name");

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch budget items";
      setError(errorMessage);
      console.error("Failed to fetch budget items:", err);
    } finally {
      setLoading(false);
    }
  };

  const addBudgetItem = async (data: BudgetFormData) => {
    if (!currentEventId) {
      throw new Error("No event ID available");
    }

    try {
      const { data: newItem, error } = await supabase
        .from("budget_items")
        .insert({
          event_id: currentEventId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return newItem;
    } catch (err) {
      console.error("Failed to add budget item:", err);
      throw err;
    }
  };

  const updateBudgetItem = async (id: string, data: Partial<BudgetFormData>) => {
    try {
      const { data: updatedItem, error } = await supabase
        .from("budget_items")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedItem;
    } catch (err) {
      console.error("Failed to update budget item:", err);
      throw err;
    }
  };

  const deleteBudgetItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("budget_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (err) {
      console.error("Failed to delete budget item:", err);
      throw err;
    }
  };

  const getBudgetStats = (): BudgetStats => {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
    const totalSpent = totalActual;
    const remainingBudget = totalEstimated - totalSpent;
    const percentageSpent = totalEstimated > 0 ? (totalSpent / totalEstimated) * 100 : 0;

    const categories = new Set(items.map(item => item.category));
    const completedItems = items.filter(item => item.actual_cost !== null && item.actual_cost > 0).length;

    return {
      totalEstimated,
      totalActual,
      totalSpent,
      remainingBudget,
      percentageSpent,
      categoriesCount: categories.size,
      completedItems,
      totalItems: items.length,
    };
  };

  const getFilteredItems = (filters?: BudgetFilters): BudgetItem[] => {
    if (!filters) return items;

    return items.filter(item => {
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      if (filters.hasActualCost !== undefined) {
        const hasActual = item.actual_cost !== null && item.actual_cost > 0;
        if (filters.hasActualCost !== hasActual) {
          return false;
        }
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!item.name.toLowerCase().includes(searchLower) &&
            !item.category.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  };

  const getItemsByCategory = (category: BudgetCategory): BudgetItem[] => {
    return items.filter(item => item.category === category);
  };

  const getCategoryStats = (category: BudgetCategory): { estimated: number; actual: number; remaining: number } => {
    const categoryItems = getItemsByCategory(category);
    const estimated = categoryItems.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const actual = categoryItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
    const remaining = estimated - actual;

    return { estimated, actual, remaining };
  };

  return {
    items,
    loading,
    error,
    currentEventId,
    addBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    getBudgetStats,
    getFilteredItems,
    getItemsByCategory,
    getCategoryStats,
  };
}
