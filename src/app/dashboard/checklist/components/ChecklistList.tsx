"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChecklistItem } from "./ChecklistItem";
import {
  ChecklistItem as ChecklistItemType,
  ChecklistFilters,
  ChecklistCategory,
} from "@/types/checklist";

interface ChecklistListProps {
  items: ChecklistItemType[];
  loading: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: ChecklistItemType) => void;
  onDelete: (id: string) => void;
}

export function ChecklistList({
  items,
  loading,
  onToggle,
  onEdit,
  onDelete,
}: ChecklistListProps) {
  const [filters, setFilters] = useState<
    Partial<ChecklistFilters & { category?: ChecklistCategory | "all" }>
  >({
    status: "all",
    search: "",
    sortBy: "due_date",
    sortOrder: "asc",
    category: "all",
  });

  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Status filter
    if (filters.status && filters.status !== "all") {
      const now = new Date();
      switch (filters.status) {
        case "completed":
          filtered = filtered.filter((item) => item.completed);
          break;
        case "pending":
          filtered = filtered.filter((item) => !item.completed);
          break;
        case "overdue":
          filtered = filtered.filter(
            (item) =>
              !item.completed && item.due_date && new Date(item.due_date) < now
          );
          break;
      }
    }

    // Category filter
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((item) => item.category === filters.category);
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm) ||
          (item.description &&
            item.description.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  }, [items, filters]);

  const handleFilterChange = (key: keyof ChecklistFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      search: "",
      sortBy: "due_date",
      sortOrder: "asc",
      category: "all",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                category: value as ChecklistCategory | "all",
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="ceremony">Ceremony</SelectItem>
              <SelectItem value="reception">Reception</SelectItem>
              <SelectItem value="attire">Attire</SelectItem>
              <SelectItem value="vendors">Vendors</SelectItem>
              <SelectItem value="stationery">Stationery</SelectItem>
              <SelectItem value="photography">Photography</SelectItem>
              <SelectItem value="transportation">Transportation</SelectItem>
              <SelectItem value="accommodations">Accommodations</SelectItem>
              <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy || "due_date"}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
          >
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="created_at">Created</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleFilterChange(
                "sortOrder",
                filters.sortOrder === "asc" ? "desc" : "asc"
              )
            }
          >
            <Icon
              name={filters.sortOrder === "asc" ? "ArrowUp" : "ArrowDown"}
              size="sm"
            />
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} tasks
        </p>
        {(filters.search ||
          filters.status !== "all" ||
          filters.category !== "all") && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Icon
              name="CheckSquare"
              size="lg"
              className="text-gray-300 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {items.length === 0
                ? "No tasks yet"
                : "No tasks match your filters"}
            </h3>
            <p className="text-gray-600">
              {items.length === 0
                ? "Create your first task to get started with your wedding planning."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="group">
              <ChecklistItem
                item={item}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
