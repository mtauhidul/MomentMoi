"use client";

import { Card, CardContent } from "@/components/ui";
import { StatsCard } from "@/components/features/dashboard";
import { Icon } from "@/components/ui/Icon";

interface BookingAnalyticsProps {
  bookings: any[];
  month: string;
}

export default function BookingAnalytics({
  bookings,
  month,
}: BookingAnalyticsProps) {
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed"
  ).length;
  const completedBookings = bookings.filter(
    (b) => b.status === "completed"
  ).length;
  const cancelledBookings = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;
  const totalRevenue = bookings
    .filter((b) => b.budget_amount)
    .reduce((sum, b) => sum + parseFloat(b.budget_amount), 0);

  // Calculate average booking value
  const bookingsWithBudget = bookings.filter((b) => b.budget_amount);
  const averageBookingValue =
    bookingsWithBudget.length > 0
      ? totalRevenue / bookingsWithBudget.length
      : 0;

  // Get upcoming bookings (confirmed and in the future)
  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" && new Date(b.event_date) >= new Date()
  ).length;

  // Get completion rate
  const completionRate =
    totalBookings > 0
      ? Math.round((completedBookings / totalBookings) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-8">
      <h3 className="text-lg font-semibold text-gray-900 !mb-0">
        Booking Analytics - {month}
      </h3>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
        <StatsCard
          title="Total Bookings"
          value={totalBookings}
          icon={<Icon name="Calendar" size="md" className="text-blue-500" />}
          layout="left-aligned"
          variant="default"
          size="sm"
        />

        <StatsCard
          title="Confirmed"
          value={confirmedBookings}
          subtext={
            totalBookings > 0
              ? `${Math.round((confirmedBookings / totalBookings) * 100)}%`
              : undefined
          }
          icon={<Icon name="TrendingUp" size="md" className="text-blue-500" />}
          valueClassName="text-blue-600"
          layout="left-aligned"
          variant="default"
          size="sm"
        />

        <StatsCard
          title="Completed"
          value={completedBookings}
          subtext={`${completionRate}% rate`}
          icon={<Icon name="Users" size="md" className="text-green-500" />}
          valueClassName="text-green-600"
          layout="left-aligned"
          variant="default"
          size="sm"
        />

        <StatsCard
          title="Revenue"
          value={`€${totalRevenue.toFixed(0)}`}
          subtext={
            bookingsWithBudget.length > 0
              ? `Avg: €${averageBookingValue.toFixed(0)}`
              : undefined
          }
          icon={<Icon name="Euro" size="md" className="text-green-500" />}
          valueClassName="text-green-600"
          layout="left-aligned"
          variant="default"
          size="sm"
        />

        <StatsCard
          title="Upcoming"
          value={upcomingBookings}
          subtext="Confirmed events"
          icon={<Icon name="Clock" size="md" className="text-orange-500" />}
          valueClassName="text-orange-600"
          layout="left-aligned"
          variant="default"
          size="sm"
        />

        <StatsCard
          title="Cancelled"
          value={cancelledBookings}
          subtext={
            totalBookings > 0
              ? `${Math.round((cancelledBookings / totalBookings) * 100)}% rate`
              : undefined
          }
          icon={<Icon name="XCircle" size="md" className="text-red-500" />}
          valueClassName="text-red-600"
          layout="left-aligned"
          variant="default"
          size="sm"
        />

        <StatsCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtext="Success rate"
          icon={
            <Icon name="CheckCircle" size="md" className="text-green-500" />
          }
          valueClassName="text-green-600"
          layout="left-aligned"
          variant="default"
          size="sm"
        />
      </div>

      {/* Recent Bookings Summary */}
      {bookings.length > 0 && (
        <Card variant="outlined" className="mt-6">
          <CardContent className="p-3">
            <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {bookings
                .sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                )
                .slice(0, 3)
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          booking.status === "confirmed"
                            ? "bg-blue-500"
                            : booking.status === "completed"
                            ? "bg-green-500"
                            : booking.status === "cancelled"
                            ? "bg-red-500"
                            : "bg-gray-500"
                        }`}
                      />
                      <span className="font-medium">{booking.client_name}</span>
                    </div>
                    <div className="text-gray-500">
                      {new Date(booking.event_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
