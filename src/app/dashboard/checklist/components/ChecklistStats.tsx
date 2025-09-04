"use client";

import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/Card";
import { StatsCard } from "@/components/features/dashboard";
import { ChecklistStats as ChecklistStatsType } from "@/types/checklist";

interface ChecklistStatsProps {
  stats: ChecklistStatsType;
}

export function ChecklistStats({ stats }: ChecklistStatsProps) {
  const completionPercentage = Math.round(stats.completionRate);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
      {/* Total Tasks */}
      <StatsCard
        title="Total Tasks"
        value={stats.total}
        icon={<Icon name="CheckSquare" size="md" className="text-blue-600" />}
      />

      {/* Completed */}
      <StatsCard
        title="Completed"
        value={stats.completed}
        icon={<Icon name="CheckCircle" size="md" className="text-green-600" />}
      />

      {/* Overdue */}
      <StatsCard
        title="Overdue"
        value={stats.overdue}
        icon={<Icon name="AlertTriangle" size="md" className="text-red-600" />}
      />

      {/* Upcoming */}
      <StatsCard
        title="Upcoming"
        value={stats.upcoming}
        icon={<Icon name="Clock" size="md" className="text-yellow-600" />}
      />

      {/* Progress Bar */}
      {stats.total > 0 && (
        <Card className="border border-gray-200 rounded-lg p-6 md:col-span-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Overall Progress
              </h3>
              <span className="text-sm font-semibold text-gray-900">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-600">
              {stats.completed} of {stats.total} tasks completed
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
