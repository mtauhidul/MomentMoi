"use client";

import React, { useState, useMemo } from "react";
import { BudgetItem as BudgetItemComponent } from "./BudgetItem";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import {
  BudgetItem,
  BudgetCategory,
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
} from "@/types/budget";

interface BudgetListProps {
  items: BudgetItem[];
  loading: boolean;
  onEdit: (item: BudgetItem) => void;
  onDelete: (id: string) => void;
  deletingItemId?: string;
}

type SortOption =
  | "name"
  | "category"
  | "estimated_cost"
  | "actual_cost"
  | "created_at";
type FilterOption = "all" | "paid" | "unpaid" | "over_budget";

export function BudgetList({
  items,
  loading,
  onEdit,
  onDelete,
  deletingItemId,
}: BudgetListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<BudgetCategory | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCategory = BUDGET_CATEGORY_LABELS[item.category]
          .toLowerCase()
          .includes(query);
        if (!matchesName && !matchesCategory) return false;
      }

      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Status filter
      switch (statusFilter) {
        case "paid":
          if (!item.actual_cost || item.actual_cost === 0) return false;
          break;
        case "unpaid":
          if (item.actual_cost && item.actual_cost > 0) return false;
          break;
        case "over_budget":
          if (
            !item.estimated_cost ||
            !item.actual_cost ||
            item.actual_cost <= item.estimated_cost
          )
            return false;
          break;
      }

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "category":
          aValue = BUDGET_CATEGORY_LABELS[a.category];
          bValue = BUDGET_CATEGORY_LABELS[b.category];
          break;
        case "estimated_cost":
          aValue = a.estimated_cost || 0;
          bValue = b.estimated_cost || 0;
          break;
        case "actual_cost":
          aValue = a.actual_cost || 0;
          bValue = b.actual_cost || 0;
          break;
        case "created_at":
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [items, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder]);

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...BUDGET_CATEGORIES.map((category) => ({
      value: category,
      label: BUDGET_CATEGORY_LABELS[category],
    })),
  ];

  const statusOptions = [
    { value: "all", label: "All Items" },
    { value: "paid", label: "Paid Items" },
    { value: "unpaid", label: "Unpaid Items" },
    { value: "over_budget", label: "Over Budget" },
  ];

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "category", label: "Category" },
    { value: "estimated_cost", label: "Estimated Cost" },
    { value: "actual_cost", label: "Actual Cost" },
    { value: "created_at", label: "Date Added" },
  ];

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-32"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Icon
                name="Search"
                size="sm"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Select
              value={categoryFilter}
              onValueChange={(value) =>
                setCategoryFilter(value as BudgetCategory | "all")
              }
              options={categoryOptions}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as FilterOption)}
              options={statusOptions}
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
                options={sortOptions}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={toggleSortOrder}
                className="px-3"
              >
                <Icon
                  name={sortOrder === "asc" ? "ArrowUp" : "ArrowDown"}
                  size="sm"
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredAndSortedItems.length} of {items.length} items
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <Icon
              name="FileText"
              size="lg"
              className="mx-auto text-gray-400 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {items.length === 0
                ? "No budget items yet"
                : "No items match your filters"}
            </h3>
            <p className="text-gray-600">
              {items.length === 0
                ? "Start by adding your first budget item"
                : "Try adjusting your search or filter criteria"}
            </p>
          </div>
        ) : (
          filteredAndSortedItems.map((item) => (
            <BudgetItemComponent
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={deletingItemId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
