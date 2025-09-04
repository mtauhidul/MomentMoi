"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatsCard } from "@/components/features/dashboard";
import { BudgetStats as BudgetStatsType } from "@/types/budget";

interface BudgetStatsProps {
  stats: BudgetStatsType;
}

export function BudgetStats({ stats }: BudgetStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getBudgetStatusColor = () => {
    if (stats.percentageSpent > 100) return "text-red-600";
    if (stats.percentageSpent > 80) return "text-orange-600";
    return "text-green-600";
  };

  const getBudgetStatusBg = () => {
    if (stats.percentageSpent > 100) return "bg-red-50 border-red-200";
    if (stats.percentageSpent > 80) return "bg-orange-50 border-orange-200";
    return "bg-green-50 border-green-200";
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
      {/* Total Estimated */}
      <StatsCard
        title="Total Estimated"
        value={formatCurrency(stats.totalEstimated)}
        icon={<Icon name="DollarSign" size="md" className="text-blue-600" />}
      />

      {/* Total Spent */}
      <StatsCard
        title="Total Spent"
        value={formatCurrency(stats.totalSpent)}
        icon={<Icon name="TrendingDown" size="md" className="text-red-600" />}
      />

      {/* Remaining Budget */}
      <StatsCard
        title="Remaining Budget"
        value={formatCurrency(Math.abs(stats.remainingBudget))}
        icon={
          <Icon
            name={stats.remainingBudget >= 0 ? "TrendingUp" : "AlertTriangle"}
            size="md"
            className={
              stats.remainingBudget >= 0 ? "text-green-600" : "text-red-600"
            }
          />
        }
        subtext={stats.remainingBudget < 0 ? "Over budget" : undefined}
        valueClassName={
          stats.remainingBudget >= 0 ? "text-green-600" : "text-red-600"
        }
      />

      {/* Budget Progress */}
      <Card
        className={`border border-gray-200 rounded-lg p-6 ${getBudgetStatusBg()}`}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className={`text-2xl font-bold ${getBudgetStatusColor()}`}>
              {stats.percentageSpent.toFixed(1)}%
            </p>
            <Icon name="Target" size="md" className={getBudgetStatusColor()} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">Budget Used</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.percentageSpent > 100
                    ? "bg-red-500"
                    : stats.percentageSpent > 80
                    ? "bg-orange-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(stats.percentageSpent, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Stats */}
      <Card className="border border-gray-200 rounded-lg p-6 md:col-span-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
          <StatsCard
            title="Budget Items"
            value={stats.totalItems}
            icon={<Icon name="List" size="md" className="text-blue-600" />}
            layout="centered"
          />
          <StatsCard
            title="Items Paid"
            value={stats.completedItems}
            icon={
              <Icon name="CheckCircle" size="md" className="text-green-600" />
            }
            layout="centered"
          />
          <StatsCard
            title="Categories"
            value={stats.categoriesCount}
            icon={<Icon name="Folder" size="md" className="text-purple-600" />}
            layout="centered"
          />
          <StatsCard
            title="Completion Rate"
            value={`${
              stats.totalItems > 0
                ? ((stats.completedItems / stats.totalItems) * 100).toFixed(0)
                : 0
            }%`}
            icon={
              <Icon name="TrendingUp" size="md" className="text-orange-600" />
            }
            layout="centered"
          />
        </div>
      </Card>
    </div>
  );
}
