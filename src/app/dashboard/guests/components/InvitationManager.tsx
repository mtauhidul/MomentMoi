"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/features/dashboard";

export function InvitationManager() {
  // TODO: Replace with actual data and functionality
  const invitationStats = {
    totalInvitations: 25,
    sentInvitations: 20,
    pendingInvitations: 5,
    responseRate: 72, // percentage
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Invitation Management</h3>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-4">
        <StatsCard
          title="Total"
          value={invitationStats.totalInvitations}
          layout="centered"
          size="sm"
        />
        <StatsCard
          title="Sent"
          value={invitationStats.sentInvitations}
          layout="centered"
          size="sm"
        />
        <StatsCard
          title="Pending"
          value={invitationStats.pendingInvitations}
          layout="centered"
          size="sm"
        />
        <StatsCard
          title="Response Rate"
          value={`${invitationStats.responseRate}%`}
          layout="centered"
          size="sm"
        />
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline">
          Send Reminders
        </Button>
        <Button size="sm" variant="outline">
          Export List
        </Button>
        <Button size="sm" variant="outline">
          Track Responses
        </Button>
      </div>
    </Card>
  );
}
