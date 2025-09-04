"use client";

import React, { useState } from "react";
import { ClientDashboardLayout } from "@/components/layout/ClientDashboardLayout";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { StatsCard } from "@/components/features/dashboard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClientComponentClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface EventFormData {
  event_type: string;
  event_date: string;
  location: string;
  guest_count: string;
  event_style: string;
  budget_range: string;
  planning_stage: string;
  ceremony_venue: string;
  reception_venue: string;
  ceremony_time: string;
  reception_time: string;
}

const EVENT_TYPES = [
  "wedding",
  "christening",
  "birthday",
  "anniversary",
  "corporate",
  "other",
];

const BUDGET_RANGES = [
  "Under €5,000",
  "€5,000 - €10,000",
  "€10,000 - €20,000",
  "€20,000 - €50,000",
  "Over €50,000",
];

const PLANNING_STAGES = [
  "Just starting",
  "Venue booked",
  "Vendors selected",
  "Details finalized",
  "Final preparations",
];

export default function EventDetailsPage() {
  const { data, loading, error, refetch } = useClientDashboard();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EventFormData>({
    event_type: "",
    event_date: "",
    location: "",
    guest_count: "",
    event_style: "",
    budget_range: "",
    planning_stage: "",
    ceremony_venue: "",
    reception_venue: "",
    ceremony_time: "",
    reception_time: "",
  });

  // Initialize form data when event data loads
  React.useEffect(() => {
    if (data?.event) {
      const event = data.event;
      setFormData({
        event_type: event.event_type || "",
        event_date: event.event_date
          ? new Date(event.event_date).toISOString().split("T")[0]
          : "",
        location: event.location || "",
        guest_count: event.guest_count || "",
        event_style: event.event_style || "",
        budget_range: event.budget_range || "",
        planning_stage: event.planning_stage || "",
        ceremony_venue: event.ceremony_venue || "",
        reception_venue: event.reception_venue || "",
        ceremony_time: event.ceremony_time || "",
        reception_time: event.reception_time || "",
      });
    }
  }, [data?.event]);

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user || !data?.event) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const { error: updateError } = await supabase
        .from("events")
        .update({
          event_type: formData.event_type,
          event_date: formData.event_date || null,
          location: formData.location,
          guest_count: formData.guest_count,
          event_style: formData.event_style,
          budget_range: formData.budget_range,
          planning_stage: formData.planning_stage,
          ceremony_venue: formData.ceremony_venue,
          reception_venue: formData.reception_venue,
          ceremony_time: formData.ceremony_time,
          reception_time: formData.reception_time,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.event.id);

      if (updateError) {
        throw updateError;
      }

      setIsEditing(false);
      await refetch();
    } catch (err) {
      console.error("Error updating event:", err);
      setSaveError(
        err instanceof Error ? err.message : "Failed to update event"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (data?.event) {
      const event = data.event;
      setFormData({
        event_type: event.event_type || "",
        event_date: event.event_date
          ? new Date(event.event_date).toISOString().split("T")[0]
          : "",
        location: event.location || "",
        guest_count: event.guest_count || "",
        event_style: event.event_style || "",
        budget_range: event.budget_range || "",
        planning_stage: event.planning_stage || "",
        ceremony_venue: event.ceremony_venue || "",
        reception_venue: event.reception_venue || "",
        ceremony_time: event.ceremony_time || "",
        reception_time: event.reception_time || "",
      });
    }
    setIsEditing(false);
    setSaveError(null);
  };

  if (loading) {
    return (
      <ClientDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (error) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon
              name="AlertCircle"
              size="lg"
              className="text-red-500 mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Event
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  if (!data?.event) {
    return (
      <ClientDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icon
              name="Calendar"
              size="lg"
              className="text-gray-400 mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Event Found
            </h3>
            <p className="text-gray-600 mb-4">
              You haven't set up your event yet.
            </p>
            <Link href="/dashboard/event/setup">
              <Button>Set Up Your Event</Button>
            </Link>
          </div>
        </div>
      </ClientDashboardLayout>
    );
  }

  const { event, partner, stats } = data;

  return (
    <ClientDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-900">Event Details</h1>
            <p className="text-gray-600 mt-1">
              Manage your {event.event_type} information and planning progress
            </p>
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={isSaving}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Icon name="Edit" size="sm" className="mr-2" />
                Edit Event
              </Button>
            )}
          </div>
        </div>

        {saveError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Icon name="AlertCircle" size="sm" className="text-red-500" />
                <p className="text-red-700">{saveError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Calendar" size="sm" className="text-primary-500" />
                Basic Information
              </CardTitle>
              <CardDescription>Core details about your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  {isEditing ? (
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) =>
                        handleInputChange("event_type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">
                      {event.event_type
                        ? event.event_type.charAt(0).toUpperCase() +
                          event.event_type.slice(1)
                        : "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date
                  </label>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) =>
                        handleInputChange("event_date", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : "Not specified"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      placeholder="Enter event location"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.location || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest Count
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.guest_count}
                      onChange={(e) =>
                        handleInputChange("guest_count", e.target.value)
                      }
                      placeholder="e.g., 150"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.guest_count || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Range
                  </label>
                  {isEditing ? (
                    <Select
                      value={formData.budget_range}
                      onValueChange={(value) =>
                        handleInputChange("budget_range", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUDGET_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">
                      {event.budget_range || "Not specified"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Style
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.event_style}
                      onChange={(e) =>
                        handleInputChange("event_style", e.target.value)
                      }
                      placeholder="e.g., Modern, Traditional, Rustic, Elegant"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.event_style || "Not specified"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planning Stage
                  </label>
                  {isEditing ? (
                    <Select
                      value={formData.planning_stage}
                      onValueChange={(value) =>
                        handleInputChange("planning_stage", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select planning stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANNING_STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-gray-900">
                      {event.planning_stage || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Venue Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="MapPin" size="sm" className="text-primary-500" />
                Venue Details
              </CardTitle>
              <CardDescription>
                Ceremony and reception venue information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ceremony Venue
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.ceremony_venue}
                      onChange={(e) =>
                        handleInputChange("ceremony_venue", e.target.value)
                      }
                      placeholder="Enter ceremony venue"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.ceremony_venue || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ceremony Time
                  </label>
                  {isEditing ? (
                    <Input
                      type="time"
                      value={formData.ceremony_time}
                      onChange={(e) =>
                        handleInputChange("ceremony_time", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.ceremony_time || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reception Venue
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.reception_venue}
                      onChange={(e) =>
                        handleInputChange("reception_venue", e.target.value)
                      }
                      placeholder="Enter reception venue"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.reception_venue || "Not specified"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reception Time
                  </label>
                  {isEditing ? (
                    <Input
                      type="time"
                      value={formData.reception_time}
                      onChange={(e) =>
                        handleInputChange("reception_time", e.target.value)
                      }
                    />
                  ) : (
                    <p className="text-gray-900">
                      {event.reception_time || "Not specified"}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Days Until Event"
            value={stats.daysUntilEvent}
            icon={<Icon name="Clock" size="md" className="text-primary-600" />}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Guests"
            value={`${stats.confirmedGuests}/${stats.totalGuests}`}
            icon={<Icon name="Users" size="md" className="text-primary-600" />}
            subtext="Confirmed"
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Budget"
            value={`€${stats.spentBudget.toLocaleString()}`}
            icon={
              <Icon name="DollarSign" size="md" className="text-primary-600" />
            }
            subtext={`of €${stats.totalBudget.toLocaleString()}`}
            loading={loading}
            error={error}
          />

          <StatsCard
            title="Tasks"
            value={`${stats.completedTasks}/${stats.totalTasks}`}
            icon={
              <Icon name="CheckSquare" size="md" className="text-primary-600" />
            }
            subtext="Completed"
            loading={loading}
            error={error}
          />
        </div>

        {/* Partner Collaboration Status */}
        {partner && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <Icon name="Heart" size="lg" className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Planning with {partner.full_name || partner.email}
                  </h3>
                  <p className="text-gray-600">
                    You're both working on this event together
                  </p>
                </div>
                <Link href="/dashboard/partner">
                  <Button variant="outline" size="sm">
                    Partner Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage different aspects of your event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboard/guests">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="UserPlus" size="sm" className="mr-2" />
                  Manage Guests
                </Button>
              </Link>
              <Link href="/dashboard/vendors">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="Store" size="sm" className="mr-2" />
                  Find Vendors
                </Button>
              </Link>
              <Link href="/dashboard/checklist">
                <Button variant="outline" className="w-full justify-start">
                  <Icon name="CheckSquare" size="sm" className="mr-2" />
                  View Checklist
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDashboardLayout>
  );
}
