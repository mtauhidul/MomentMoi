"use client";

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatsCard } from "@/components/features/dashboard";
import { useGuests } from "@/hooks/useGuests";

export function GuestStats() {
  const { guests, loading, getGuestStats } = useGuests();

  if (loading) return <div>Loading stats...</div>;

  const stats = getGuestStats();

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6">
      <StatsCard
        title="Total Guests"
        value={stats.total}
        icon={<Icon name="Users" size="md" className="text-primary-600" />}
        loading={loading}
      />
      <StatsCard
        title="Confirmed"
        value={stats.confirmed}
        icon={<Icon name="CheckCircle" size="md" className="text-green-600" />}
        loading={loading}
      />
      <StatsCard
        title="Maybe"
        value={stats.maybe}
        icon={<Icon name="HelpCircle" size="md" className="text-orange-600" />}
        loading={loading}
      />
      <StatsCard
        title="Pending"
        value={stats.pending}
        icon={<Icon name="Clock" size="md" className="text-yellow-600" />}
        loading={loading}
      />
      <StatsCard
        title="Declined"
        value={stats.declined}
        icon={<Icon name="XCircle" size="md" className="text-red-600" />}
        loading={loading}
      />
    </div>
  );
}
