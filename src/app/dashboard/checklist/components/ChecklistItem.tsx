"use client";

import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ChecklistItem as ChecklistItemType,
  ChecklistCategory,
} from "@/types/checklist";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  item: ChecklistItemType;
  onToggle: (id: string) => void;
  onEdit: (item: ChecklistItemType) => void;
  onDelete: (id: string) => void;
}

export function ChecklistItem({
  item,
  onToggle,
  onEdit,
  onDelete,
}: ChecklistItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getCategoryColor = (category?: ChecklistCategory) => {
    switch (category) {
      case "planning":
        return "bg-blue-100 text-blue-800";
      case "ceremony":
        return "bg-purple-100 text-purple-800";
      case "reception":
        return "bg-green-100 text-green-800";
      case "attire":
        return "bg-pink-100 text-pink-800";
      case "vendors":
        return "bg-orange-100 text-orange-800";
      case "stationery":
        return "bg-indigo-100 text-indigo-800";
      case "photography":
        return "bg-yellow-100 text-yellow-800";
      case "transportation":
        return "bg-gray-100 text-gray-800";
      case "accommodations":
        return "bg-teal-100 text-teal-800";
      case "miscellaneous":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatCategory = (category?: ChecklistCategory) => {
    if (!category) return null;
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } catch (error) {
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOverdue =
    !item.completed &&
    item.due_date &&
    isPast(new Date(item.due_date)) &&
    !isToday(new Date(item.due_date));
  const isDueToday =
    !item.completed && item.due_date && isToday(new Date(item.due_date));

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200 hover:shadow-md",
        item.completed && "bg-green-50 border-green-200",
        isOverdue && "bg-red-50 border-red-200",
        isDueToday && "bg-yellow-50 border-yellow-200"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.id)}
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            item.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 hover:border-primary-500"
          )}
        >
          {item.completed && <Icon name="Check" size="sm" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    "font-medium text-sm",
                    item.completed && "line-through text-gray-500"
                  )}
                >
                  {item.title}
                </h3>
                {item.category && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      getCategoryColor(item.category)
                    )}
                  >
                    {formatCategory(item.category)}
                  </span>
                )}
              </div>
              {item.description && (
                <p
                  className={cn(
                    "text-xs text-gray-600 mt-1",
                    item.completed && "line-through"
                  )}
                >
                  {item.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(item)}
                className="h-8 w-8 p-0"
              >
                <Icon name="Edit" size="sm" className="text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              >
                <Icon name="Trash2" size="sm" className="text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Due Date */}
          {item.due_date && (
            <div className="flex items-center gap-1 mt-2">
              <Icon name="Calendar" size="xs" className="text-gray-400" />
              <span
                className={cn(
                  "text-xs",
                  isOverdue && "text-red-600 font-medium",
                  isDueToday && "text-yellow-600 font-medium",
                  !isOverdue && !isDueToday && "text-gray-500"
                )}
              >
                Due {format(new Date(item.due_date), "MMM dd, yyyy")}
                {isDueToday && " (Today)"}
                {isOverdue && " (Overdue)"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
