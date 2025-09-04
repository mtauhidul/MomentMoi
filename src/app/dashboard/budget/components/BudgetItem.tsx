"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import {
  BudgetItem as BudgetItemType,
  BUDGET_CATEGORY_LABELS,
} from "@/types/budget";

interface BudgetItemProps {
  item: BudgetItemType;
  onEdit: (item: BudgetItemType) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function BudgetItem({
  item,
  onEdit,
  onDelete,
  isDeleting = false,
}: BudgetItemProps) {
  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === 0) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusBadge = () => {
    if (item.actual_cost !== null && item.actual_cost > 0) {
      if (item.estimated_cost && item.actual_cost > item.estimated_cost) {
        return (
          <Badge variant="destructive" className="text-xs">
            Over Budget
          </Badge>
        );
      }
      return (
        <Badge
          variant="default"
          className="text-xs bg-green-100 text-green-800"
        >
          Paid
        </Badge>
      );
    }

    if (item.estimated_cost && item.estimated_cost > 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          Estimated
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-xs">
        Pending
      </Badge>
    );
  };

  const getProgressColor = () => {
    if (!item.estimated_cost || !item.actual_cost) return "bg-gray-200";

    const percentage = (item.actual_cost / item.estimated_cost) * 100;
    if (percentage > 100) return "bg-red-500";
    if (percentage > 80) return "bg-orange-500";
    return "bg-green-500";
  };

  const getProgressWidth = () => {
    if (!item.estimated_cost || !item.actual_cost) return "0%";
    return `${Math.min((item.actual_cost / item.estimated_cost) * 100, 100)}%`;
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-gray-900 truncate">
                {item.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {BUDGET_CATEGORY_LABELS[item.category]}
              </p>
            </div>
            <div className="ml-4">{getStatusBadge()}</div>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Estimated
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(item.estimated_cost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Actual
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(item.actual_cost)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {item.estimated_cost && item.actual_cost && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>
                  {((item.actual_cost / item.estimated_cost) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: getProgressWidth() }}
                />
              </div>
            </div>
          )}

          {/* Variance */}
          {item.estimated_cost && item.actual_cost && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Variance
              </p>
              <p
                className={`text-sm font-medium ${
                  item.actual_cost > item.estimated_cost
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {item.actual_cost > item.estimated_cost ? "+" : ""}
                {formatCurrency(item.actual_cost - item.estimated_cost)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(item)}
            className="px-3 py-2"
          >
            <Icon name="Edit" size="sm" className="mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="px-3 py-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            {isDeleting ? (
              <Icon name="Loader2" size="sm" className="mr-1 animate-spin" />
            ) : (
              <Icon name="Trash2" size="sm" className="mr-1" />
            )}
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
