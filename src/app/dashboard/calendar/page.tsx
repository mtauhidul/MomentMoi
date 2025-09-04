"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Save,
  ExternalLink,
  Trash2,
  CheckCircle,
  Clock,
  Info,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { createClientComponentClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  CalendarLinkForm,
  BookingDetailsModal,
  BookingAnalytics,
} from "@/components/features/calendar";
import { BookingService } from "@/lib/booking-service";

interface AvailabilityData {
  date: string;
  is_available: boolean;
}

interface ExternalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  isExternal: true;
}

interface Booking {
  id: string;
  vendor_id: string;
  inquiry_id: string;
  service_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  guest_count?: number;
  location?: string;
  budget_amount?: number;
  notes?: string;
  status: "confirmed" | "completed" | "cancelled" | "rescheduled";
  created_at: string;
  updated_at: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthLoading, setMonthLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [isSelectingDates, setIsSelectingDates] = useState(false);
  const [bulkLoading, setBulkLoading] = useState<
    "available" | "unavailable" | null
  >(null);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);

  // External events state
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [externalEventsLoading, setExternalEventsLoading] = useState(false);
  const [lastExternalSync, setLastExternalSync] = useState<Date | null>(null);

  // Booking state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Get current month's start and end dates
  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  // Generate calendar days
  const getCalendarDays = () => {
    const days = [];
    const firstDay = new Date(startOfMonth);
    const lastDay = new Date(endOfMonth);

    // Add padding days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDay);
      date.setDate(date.getDate() - i - 1);
      days.push({ date, isCurrentMonth: false });
    }

    // Add current month days
    for (
      let date = new Date(firstDay);
      date <= lastDay;
      date.setDate(date.getDate() + 1)
    ) {
      days.push({ date: new Date(date), isCurrentMonth: true });
    }

    // Add padding days from next month
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const date = new Date(lastDay);
      date.setDate(date.getDate() + i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  // Load bookings for the current month
  const loadBookings = async () => {
    if (!user) return;

    try {
      setBookingsLoading(true);
      console.log(
        "🔍 Loading bookings for month:",
        startOfMonth.toISOString().split("T")[0],
        "to",
        endOfMonth.toISOString().split("T")[0]
      );

      // Get vendor profile
      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !vendorProfile) {
        console.error(
          "Error fetching vendor profile for bookings:",
          profileError
        );
        return;
      }

      console.log("✅ Vendor profile found for bookings:", vendorProfile.id);

      const bookingService = new BookingService();
      const bookingsData = await bookingService.getVendorBookings(
        vendorProfile.id,
        startOfMonth.toISOString().split("T")[0],
        endOfMonth.toISOString().split("T")[0]
      );

      console.log("📅 Bookings loaded:", bookingsData.length, "bookings");
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date): Booking[] => {
    const dateString = date.toISOString().split("T")[0];
    return bookings.filter((booking) => booking.event_date === dateString);
  };

  // Handle booking click to show details
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingModalOpen(true);
  };

  // Handle booking status update
  const handleBookingStatusUpdate = async (
    bookingId: string,
    status: string
  ) => {
    try {
      const bookingService = new BookingService();
      const success = await bookingService.updateBookingStatus(
        bookingId,
        status
      );

      if (success) {
        // Reload bookings to reflect the change
        loadBookings();
        setBookingModalOpen(false);
      } else {
        alert("Failed to update booking status. Please try again.");
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("An error occurred while updating the booking status.");
    }
  };

  // Load external events for the current month
  const loadExternalEvents = async (isRefresh = false) => {
    console.log("🔍 loadExternalEvents called", { calendarUrl, isRefresh });

    if (!calendarUrl) {
      console.log("❌ No calendar URL found, clearing external events");
      setExternalEvents([]);
      return;
    }

    try {
      if (isRefresh) {
        setExternalEventsLoading(true);
      }

      const startDate = startOfMonth.toISOString();
      const endDate = endOfMonth.toISOString();

      console.log("📅 Fetching external events for date range:", {
        startDate,
        endDate,
      });

      const response = await fetch(
        `/api/vendor/external-events?startDate=${startDate}&endDate=${endDate}`
      );

      console.log("📡 External events API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ External events API response data:", data);
        setExternalEvents(data.events || []);
        setLastExternalSync(data.lastSync ? new Date(data.lastSync) : null);
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to load external events:",
          response.statusText,
          errorText
        );
        setExternalEvents([]);
      }
    } catch (error) {
      console.error("❌ Error loading external events:", error);
      setExternalEvents([]);
    } finally {
      setExternalEventsLoading(false);
    }
  };

  // Refresh external events
  const refreshExternalEvents = () => {
    loadExternalEvents(true);
  };

  // Get external events for a specific date
  const getExternalEventsForDate = (date: Date): ExternalEvent[] => {
    const dateString = date.toISOString().split("T")[0];
    const events = externalEvents.filter((event) => {
      const eventDate = event.start.toISOString().split("T")[0];
      return eventDate === dateString;
    });

    if (events.length > 0) {
      console.log("📅 External events for date", dateString, ":", events);
    }

    return events;
  };

  // Get event tooltip content
  const getEventTooltip = (events: ExternalEvent[]): string => {
    if (events.length === 0) return "";

    return events
      .map((event) => {
        const startTime = event.start.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const endTime = event.end.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${event.title} (${startTime} - ${endTime})`;
      })
      .join("\n");
  };

  // Check if a date has conflicts (both booked and external events)
  const hasDateConflicts = (date: Date): boolean => {
    const isAvailable = getAvailabilityStatus(date);
    const externalEvents = getExternalEventsForDate(date);
    return !isAvailable && externalEvents.length > 0;
  };

  // Load calendar URL
  const loadCalendarUrl = async () => {
    console.log("🔍 loadCalendarUrl called");
    try {
      const response = await fetch("/api/vendor/calendar-link");
      console.log("📡 Calendar link API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Calendar link API response data:", data);
        setCalendarUrl(data.url);
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to load calendar URL:",
          response.statusText,
          errorText
        );
      }
    } catch (error) {
      console.error("❌ Error loading calendar URL:", error);
    }
  };

  // Save calendar URL
  const saveCalendarUrl = async (url: string) => {
    try {
      const response = await fetch("/api/vendor/calendar-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save calendar URL");
      }

      const data = await response.json();
      setCalendarUrl(url);
      // Reload external events after saving new URL
      await loadExternalEvents();
      return data;
    } catch (error) {
      console.error("Error saving calendar URL:", error);
      throw error;
    }
  };

  // Remove calendar URL
  const removeCalendarUrl = async () => {
    setCalendarLoading(true);
    try {
      const response = await fetch("/api/vendor/calendar-link", {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove calendar URL");
      }

      setCalendarUrl(null);
      setExternalEvents([]);
      setLastExternalSync(null);
    } catch (error) {
      console.error("Error removing calendar URL:", error);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Load availability data
  const loadAvailability = async (isMonthChange = false) => {
    console.log("🔍 loadAvailability called");
    console.log("👤 User:", user?.id, user?.email);

    if (!user) {
      console.log("❌ No user found, returning early");
      return;
    }

    try {
      if (isMonthChange) {
        setMonthLoading(true);
      } else {
        setLoading(true);
      }
      console.log(
        "📅 Loading availability for month:",
        startOfMonth.toISOString().split("T")[0],
        "to",
        endOfMonth.toISOString().split("T")[0]
      );

      // Get vendor profile
      console.log("🔍 Fetching vendor profile for user_id:", user.id);
      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      console.log("📋 Vendor profile result:", { vendorProfile, profileError });

      if (profileError) {
        console.error("❌ Error fetching vendor profile:", profileError);
        return;
      }

      if (!vendorProfile) {
        console.error("❌ No vendor profile found for user:", user.id);
        return;
      }

      console.log("✅ Vendor profile found:", vendorProfile.id);

      // Get availability for current month
      console.log("🔍 Fetching availability for vendor_id:", vendorProfile.id);
      const { data, error } = await supabase
        .from("vendor_availability")
        .select("date, is_available")
        .eq("vendor_id", vendorProfile.id)
        .gte("date", startOfMonth.toISOString().split("T")[0])
        .lte("date", endOfMonth.toISOString().split("T")[0]);

      console.log("📊 Availability query result:", { data, error });

      if (error) {
        console.error("❌ Error loading availability:", error);
        console.error("❌ Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        return;
      }

      console.log(
        "✅ Availability loaded successfully:",
        data?.length,
        "records"
      );
      setAvailability(data || []);
    } catch (error) {
      console.error("❌ Unexpected error in loadAvailability:", error);
      console.error("❌ Error type:", typeof error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
    } finally {
      if (isMonthChange) {
        setMonthLoading(false);
      } else {
        setLoading(false);
      }
      console.log("🏁 loadAvailability completed");
    }
  };

  // Toggle availability for a specific date
  const toggleAvailability = async (date: Date) => {
    console.log(
      "🔄 toggleAvailability called for date:",
      date.toISOString().split("T")[0]
    );
    console.log("👤 User:", user?.id);
    console.log("⏳ Currently updating:", updating);

    if (!user) {
      console.log("❌ No user found, returning early");
      return;
    }

    if (updating) {
      console.log("❌ Already updating, returning early");
      return;
    }

    try {
      const dateString = date.toISOString().split("T")[0];
      setUpdating(dateString);
      console.log("⏳ Set updating state to:", dateString);

      // Get vendor profile
      console.log("🔍 Fetching vendor profile for user_id:", user.id);
      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      console.log("📋 Vendor profile result:", { vendorProfile, profileError });

      if (profileError) {
        console.error("❌ Error fetching vendor profile:", profileError);
        return;
      }

      if (!vendorProfile) {
        console.error("❌ No vendor profile found for user:", user.id);
        return;
      }

      console.log("✅ Vendor profile found:", vendorProfile.id);

      const existingAvailability = availability.find(
        (a) => a.date === dateString
      );
      const newAvailability = !existingAvailability?.is_available;

      console.log("📊 Current availability state:", {
        dateString,
        existingAvailability,
        newAvailability,
        currentAvailabilityCount: availability.length,
      });

      if (existingAvailability) {
        // Update existing record
        console.log("🔄 Updating existing availability record");
        const { data: updateData, error } = await supabase
          .from("vendor_availability")
          .update({ is_available: newAvailability })
          .eq("vendor_id", vendorProfile.id)
          .eq("date", dateString)
          .select();

        console.log("📊 Update result:", { updateData, error });

        if (error) {
          console.error("❌ Error updating availability:", error);
          console.error("❌ Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }
      } else {
        // Create new record
        console.log("🆕 Creating new availability record");
        const { data: insertData, error } = await supabase
          .from("vendor_availability")
          .insert({
            vendor_id: vendorProfile.id,
            date: dateString,
            is_available: newAvailability,
          })
          .select();

        console.log("📊 Insert result:", { insertData, error });

        if (error) {
          console.error("❌ Error creating availability:", error);
          console.error("❌ Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }
      }

      // Update local state
      console.log("🔄 Updating local state");
      setAvailability((prev) => {
        const filtered = prev.filter((a) => a.date !== dateString);
        const newState = [
          ...filtered,
          { date: dateString, is_available: newAvailability },
        ];
        console.log("📊 New availability state:", newState);
        return newState;
      });

      console.log("✅ Availability updated successfully");
    } catch (error) {
      console.error("❌ Unexpected error in toggleAvailability:", error);
      console.error("❌ Error type:", typeof error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
    } finally {
      setUpdating(null);
      console.log("🏁 toggleAvailability completed, cleared updating state");
    }
  };

  // Handle date selection for bulk operations
  const handleDateClick = (date: Date) => {
    if (!isSelectingDates) {
      // No action when not in selection mode
      return;
    }

    const dateString = date.toISOString().split("T")[0];
    const isAvailable = getAvailabilityStatus(date);
    const isSelected = selectedDates.has(dateString);

    if (!isAvailable) {
      // If date is booked (red), first make it available
      toggleAvailability(date);
    } else if (isSelected) {
      // If date is available and selected, deselect it
      setSelectedDates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(dateString);
        return newSet;
      });
    } else {
      // If date is available and not selected, select it
      setSelectedDates((prev) => {
        const newSet = new Set(prev);
        newSet.add(dateString);
        return newSet;
      });
    }
  }; // Save selected dates as unavailable
  const saveSelectedDates = async () => {
    if (!user || selectedDates.size === 0) return;

    try {
      const { data: vendorProfile } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!vendorProfile) return;

      // Process each selected date
      for (const dateString of selectedDates) {
        const existingAvailability = availability.find(
          (a) => a.date === dateString
        );

        if (!existingAvailability || existingAvailability.is_available) {
          if (existingAvailability) {
            await supabase
              .from("vendor_availability")
              .update({ is_available: false })
              .eq("vendor_id", vendorProfile.id)
              .eq("date", dateString);
          } else {
            await supabase.from("vendor_availability").insert({
              vendor_id: vendorProfile.id,
              date: dateString,
              is_available: false,
            });
          }
        }
      }

      await loadAvailability();
      setSelectedDates(new Set());
      setIsSelectingDates(false);
    } catch (error) {
      console.error("Error saving selected dates:", error);
    }
  };

  // Cancel date selection
  const cancelDateSelection = () => {
    setSelectedDates(new Set());
    setIsSelectingDates(false);
  };

  // Bulk operations
  const markAllAvailable = async () => {
    if (!user) return;

    try {
      setBulkLoading("available");
      console.log("🚀 markAllAvailable started");
      console.log("👤 User:", user?.id, user?.email);

      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id, user_id")
        .eq("user_id", user.id)
        .single();

      console.log("📋 Vendor profile result:", { vendorProfile, profileError });
      console.log("🔐 RLS Debug - Auth user ID:", user?.id);
      console.log(
        "🔐 RLS Debug - Vendor profile user_id:",
        vendorProfile?.user_id
      );
      console.log(
        "🔐 RLS Debug - IDs match:",
        user?.id === vendorProfile?.user_id
      );

      if (profileError) {
        console.error("❌ Error fetching vendor profile:", profileError);
        return;
      }

      if (!vendorProfile) {
        console.error("❌ No vendor profile found for user:", user.id);
        return;
      }

      console.log("✅ Vendor profile found:", vendorProfile.id);

      const days = getCalendarDays().filter((day) => day.isCurrentMonth);
      const dateStrings = days.map(
        (day) => day.date.toISOString().split("T")[0]
      );

      console.log("📅 Current month days:", dateStrings.length, "days");
      console.log("📅 Date strings:", dateStrings);
      console.log("📊 Current availability records:", availability.length);

      // Batch update existing records
      console.log("🔄 Starting batch update of existing records");
      const { data: updateData, error: updateError } = await supabase
        .from("vendor_availability")
        .update({ is_available: true })
        .eq("vendor_id", vendorProfile.id)
        .in("date", dateStrings);

      console.log("📊 Update result:", { updateData, updateError });

      if (updateError) {
        console.error("❌ Error updating existing availability:", updateError);
      }

      // Insert records for dates that don't exist
      const existingDates = availability.map((a) => a.date);
      console.log("📋 Existing dates in state:", existingDates);
      const newDates = dateStrings.filter(
        (date) => !existingDates.includes(date)
      );

      console.log("🆕 New dates to insert:", newDates.length, "dates");

      if (newDates.length > 0) {
        const newRecords = newDates.map((date) => ({
          vendor_id: vendorProfile.id,
          date: date,
          is_available: true,
        }));

        console.log("📝 New records to insert:", newRecords);
        console.log(
          "📝 Date format check - first date:",
          newRecords[0]?.date,
          "type:",
          typeof newRecords[0]?.date
        );
        console.log(
          "📝 Vendor ID format check:",
          newRecords[0]?.vendor_id,
          "type:",
          typeof newRecords[0]?.vendor_id
        );

        const { data: insertData, error: insertError } = await supabase
          .from("vendor_availability")
          .insert(newRecords);

        console.log("📊 Insert result:", { insertData, insertError });

        if (insertError) {
          console.error("❌ Error inserting new availability:", insertError);
          console.error("❌ Insert error details:", {
            message: insertError?.message,
            details: insertError?.details,
            hint: insertError?.hint,
            code: insertError?.code,
          });
        } else {
          console.log(
            "✅ Successfully inserted new availability records:",
            insertData
          );
        }
      } else {
        console.log("ℹ️ No new dates to insert");
      }

      // Update local state instead of reloading
      console.log("🔄 Updating local state");
      setAvailability((prev) => {
        const updated = [...prev];

        // Update existing records
        dateStrings.forEach((dateString) => {
          const existingIndex = updated.findIndex((a) => a.date === dateString);
          if (existingIndex !== -1) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              is_available: true,
            };
          } else {
            updated.push({ date: dateString, is_available: true });
          }
        });

        console.log("📊 Updated availability count:", updated.length);
        return updated;
      });

      console.log("✅ markAllAvailable completed successfully");
    } catch (error) {
      console.error("❌ Unexpected error in markAllAvailable:", error);
      console.error("❌ Error type:", typeof error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
    } finally {
      setBulkLoading(null);
      console.log("🏁 markAllAvailable finished, cleared bulk loading state");
    }
  };

  const markAllUnavailable = async () => {
    if (!user) return;

    try {
      setBulkLoading("unavailable");
      console.log("🚀 markAllUnavailable started");
      console.log("👤 User:", user?.id, user?.email);

      const { data: vendorProfile, error: profileError } = await supabase
        .from("vendor_profiles")
        .select("id, user_id")
        .eq("user_id", user.id)
        .single();

      console.log("📋 Vendor profile result:", { vendorProfile, profileError });
      console.log("🔐 RLS Debug - Auth user ID:", user?.id);
      console.log(
        "🔐 RLS Debug - Vendor profile user_id:",
        vendorProfile?.user_id
      );
      console.log(
        "🔐 RLS Debug - IDs match:",
        user?.id === vendorProfile?.user_id
      );

      if (profileError) {
        console.error("❌ Error fetching vendor profile:", profileError);
        console.error("❌ Profile error details:", {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
        });
        return;
      }

      if (!vendorProfile) {
        console.error("❌ No vendor profile found for user:", user.id);
        return;
      }

      console.log("✅ Vendor profile found:", vendorProfile.id);

      const days = getCalendarDays().filter((day) => day.isCurrentMonth);
      const dateStrings = days.map(
        (day) => day.date.toISOString().split("T")[0]
      );

      console.log("📅 Current month days:", dateStrings.length, "days");
      console.log("📅 Date strings:", dateStrings);
      console.log("📊 Current availability records:", availability.length);

      // Batch update existing records
      console.log("🔄 Starting batch update of existing records");
      const { data: updateData, error: updateError } = await supabase
        .from("vendor_availability")
        .update({ is_available: false })
        .eq("vendor_id", vendorProfile.id)
        .in("date", dateStrings);

      console.log("📊 Update result:", { updateData, updateError });

      if (updateError) {
        console.error("❌ Error updating existing availability:", updateError);
        console.error("❌ Update error details:", {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
      }

      // Insert records for dates that don't exist
      const existingDates = availability.map((a) => a.date);
      console.log("📋 Existing dates in state:", existingDates);
      const newDates = dateStrings.filter(
        (date) => !existingDates.includes(date)
      );

      console.log("🆕 New dates to insert:", newDates.length, "dates");
      console.log("🆕 New date strings:", newDates);

      if (newDates.length > 0) {
        const newRecords = newDates.map((date) => ({
          vendor_id: vendorProfile.id,
          date: date,
          is_available: false,
        }));

        console.log("📝 New records to insert:", newRecords);
        console.log("📝 Records count:", newRecords.length);
        console.log("📝 First record sample:", newRecords[0]);
        console.log(
          "📝 Last record sample:",
          newRecords[newRecords.length - 1]
        );
        console.log(
          "📝 Date format check - first date:",
          newRecords[0]?.date,
          "type:",
          typeof newRecords[0]?.date
        );
        console.log(
          "📝 Vendor ID format check:",
          newRecords[0]?.vendor_id,
          "type:",
          typeof newRecords[0]?.vendor_id
        );

        const { data: insertData, error: insertError } = await supabase
          .from("vendor_availability")
          .insert(newRecords);

        console.log("📊 Insert result:", { insertData, insertError });

        if (insertError) {
          console.error("❌ Error inserting new availability:", insertError);
          console.error("❌ Insert error type:", typeof insertError);
          console.error(
            "❌ Insert error keys:",
            Object.keys(insertError || {})
          );
          console.error("❌ Insert error details:", {
            message: insertError?.message,
            details: insertError?.details,
            hint: insertError?.hint,
            code: insertError?.code,
          });

          // Log additional debugging info
          console.error(
            "❌ Full insert error object:",
            JSON.stringify(insertError, null, 2)
          );
          console.error(
            "❌ New records being inserted:",
            JSON.stringify(newRecords, null, 2)
          );
        } else {
          console.log(
            "✅ Successfully inserted new availability records:",
            insertData
          );
        }
      } else {
        console.log("ℹ️ No new dates to insert");
      }

      // Update local state instead of reloading
      console.log("🔄 Updating local state");
      const previousAvailabilityCount = availability.length;
      setAvailability((prev) => {
        const updated = [...prev];
        console.log("📊 Previous availability count:", prev.length);

        // Update existing records
        dateStrings.forEach((dateString) => {
          const existingIndex = updated.findIndex((a) => a.date === dateString);
          if (existingIndex !== -1) {
            console.log(`🔄 Updating existing record for ${dateString}`);
            updated[existingIndex] = {
              ...updated[existingIndex],
              is_available: false,
            };
          } else {
            console.log(`🆕 Adding new record for ${dateString}`);
            updated.push({ date: dateString, is_available: false });
          }
        });

        console.log("📊 Updated availability count:", updated.length);
        console.log("📊 New availability records:", updated.slice(-5)); // Show last 5 records
        return updated;
      });

      console.log("✅ markAllUnavailable completed successfully");
    } catch (error) {
      console.error("❌ Unexpected error in markAllUnavailable:", error);
      console.error("❌ Error type:", typeof error);
      console.error(
        "❌ Error stack:",
        error instanceof Error ? error.stack : "No stack trace"
      );
    } finally {
      setBulkLoading(null);
      console.log("🏁 markAllUnavailable finished, cleared bulk loading state");
    }
  };

  // Navigation
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // Initial load
  useEffect(() => {
    if (user && loading) {
      loadAvailability(false); // false indicates this is the initial load
      loadCalendarUrl();
      loadBookings(); // Load bookings on initial load
    }
  }, [user]);

  // Load data when month changes
  useEffect(() => {
    if (user && !loading) {
      loadAvailability(true); // true indicates this is a month change
      loadBookings(); // Load bookings on month change
    }
  }, [currentDate]);

  // Load external events when calendar URL changes or month changes
  useEffect(() => {
    if (user && !loading) {
      loadExternalEvents();
      loadBookings();
    }
  }, [calendarUrl, currentDate]);

  // Get availability status for a date
  const getAvailabilityStatus = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const availabilityData = availability.find((a) => a.date === dateString);
    return availabilityData?.is_available ?? true; // Default to available
  };

  const calendarDays = getCalendarDays();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-pulse" />
            <p className="text-gray-500">Loading calendar...</p>
          </div>
        </div>

        {/* Calendar Link Form Modal */}
        <CalendarLinkForm
          isOpen={showCalendarForm}
          onClose={() => setShowCalendarForm(false)}
          onSave={saveCalendarUrl}
          currentUrl={calendarUrl || undefined}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-8xl mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-gray-900">Calendar</h1>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Calendar + Booking Analytics */}
          <div className="lg:col-span-3 space-y-6">
            {/* Main Calendar Card */}
            <Card className="p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousMonth}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {monthNames[currentDate.getMonth()]}{" "}
                    {currentDate.getFullYear()}
                  </h2>
                  {(monthLoading || bookingsLoading) && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextMonth}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-sm font-medium text-gray-500"
                    >
                      {day}
                    </div>
                  )
                )}

                {/* Calendar days */}
                {calendarDays.map(({ date, isCurrentMonth }, index) => {
                  const isAvailable = getAvailabilityStatus(date);
                  const isToday =
                    date.toDateString() === new Date().toDateString();
                  const isUpdating =
                    updating === date.toISOString().split("T")[0];
                  const dateString = date.toISOString().split("T")[0];
                  const isSelected = selectedDates.has(dateString);
                  const externalEventsForDate = getExternalEventsForDate(date);
                  const hasExternalEvents = externalEventsForDate.length > 0;
                  const hasConflicts = hasDateConflicts(date);
                  const eventTooltip = getEventTooltip(externalEventsForDate);
                  const bookingsForDate = getBookingsForDate(date);
                  const hasBookings = bookingsForDate.length > 0;

                  return (
                    <button
                      key={index}
                      onClick={() => isCurrentMonth && handleDateClick(date)}
                      disabled={!isCurrentMonth || isUpdating}
                      title={eventTooltip || undefined}
                      className={`
                    p-2 h-12 text-sm rounded-md transition-colors relative group
                    ${
                      !isCurrentMonth
                        ? "text-gray-300 cursor-default"
                        : isSelectingDates
                        ? "hover:bg-gray-50 cursor-pointer"
                        : "cursor-default"
                    }
                    ${
                      hasConflicts
                        ? "bg-orange-50 text-orange-700 border-2 border-orange-300"
                        : isCurrentMonth && !isAvailable
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : isCurrentMonth && isSelected
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : hasExternalEvents && isCurrentMonth
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : ""
                    }
                    ${isToday ? "ring-2 ring-blue-500" : ""}
                    ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}
                    ${hasExternalEvents ? "hover:bg-purple-100" : ""}
                  `}
                    >
                      {date.getDate()}
                      {isUpdating && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                      {hasExternalEvents && (
                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center">
                          <div
                            className={`
                        flex items-center gap-1 text-xs rounded px-1
                        ${
                          hasConflicts
                            ? "text-orange-600 bg-orange-100 bg-opacity-90"
                            : "text-purple-600 bg-purple-100 bg-opacity-80"
                        }
                      `}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{externalEventsForDate.length}</span>
                          </div>
                        </div>
                      )}
                      {hasConflicts && (
                        <div className="absolute top-0 right-0">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                      )}
                      {hasBookings && (
                        <div className="absolute top-0 left-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show the first booking in the modal
                              handleBookingClick(bookingsForDate[0]);
                            }}
                            className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded hover:bg-green-200 cursor-pointer"
                            title={`${bookingsForDate.length} booking${
                              bookingsForDate.length !== 1 ? "s" : ""
                            } - Click to view booking details`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>{bookingsForDate.length}</span>
                          </button>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                  Available
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-50 border border-red-200 rounded"></div>
                  Booked
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                  Selected
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-50 border border-purple-200 rounded"></div>
                  External Event
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded relative">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  Booking
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-50 border-2 border-orange-300 rounded relative">
                    <div className="absolute top-0 right-0 w-1 h-1 bg-orange-500 rounded-full"></div>
                  </div>
                  Conflict
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 ring-2 ring-blue-500 rounded"></div>
                  Today
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Calendar Actions
                </h3>

                {/* Date Selection Mode */}
                {!isSelectingDates ? (
                  <Button
                    onClick={() => setIsSelectingDates(true)}
                    className="w-full flex items-center gap-2"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                    Click to change availability dates
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={saveSelectedDates}
                      className="w-full flex items-center gap-2"
                      disabled={selectedDates.size === 0}
                    >
                      <Save className="w-4 h-4" />
                      Save dates ({selectedDates.size})
                    </Button>
                    <Button
                      onClick={cancelDateSelection}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Bulk Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={markAllAvailable}
                      disabled={bulkLoading !== null}
                      className="w-full text-sm"
                    >
                      {bulkLoading === "available" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        `Mark ${monthNames[currentDate.getMonth()]} Available`
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={markAllUnavailable}
                      disabled={bulkLoading !== null}
                      className="w-full text-sm"
                    >
                      {bulkLoading === "unavailable" ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          Updating...
                        </div>
                      ) : (
                        `Mark ${monthNames[currentDate.getMonth()]} Busy`
                      )}
                    </Button>
                  </div>
                </div>

                {/* External Calendar */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    External Calendar
                  </h4>

                  {calendarUrl ? (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">
                              Calendar Connected
                            </p>
                            <p className="text-xs text-green-700 mt-1 truncate">
                              {calendarUrl}
                            </p>
                            {lastExternalSync && (
                              <p className="text-xs text-green-600 mt-1">
                                Last sync:{" "}
                                {lastExternalSync.toLocaleTimeString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {externalEventsLoading && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          Syncing external events...
                        </div>
                      )}

                      {externalEvents.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-blue-800">
                              <Clock className="w-3 h-3" />
                              <span className="font-medium">
                                {externalEvents.length} external event
                                {externalEvents.length !== 1 ? "s" : ""} this
                                month
                              </span>
                            </div>
                            <div className="text-xs text-blue-600">
                              {new Date().toLocaleDateString()}
                            </div>
                          </div>
                          {externalEvents.length > 0 && (
                            <div className="mt-2 text-xs text-blue-700">
                              <div className="flex items-center gap-1">
                                <span>Next event:</span>
                                <span className="font-medium">
                                  {externalEvents
                                    .sort(
                                      (a, b) =>
                                        a.start.getTime() - b.start.getTime()
                                    )
                                    .find((event) => event.start >= new Date())
                                    ?.title || "None scheduled"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCalendarForm(true)}
                          className="flex-1 text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={refreshExternalEvents}
                          loading={externalEventsLoading}
                          className="text-xs"
                          title="Refresh external events"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={removeCalendarUrl}
                          loading={calendarLoading}
                          className="text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-gray-700">
                            <p className="font-medium mb-1">
                              Connect your external calendar
                            </p>
                            <p>
                              Display events from Google Calendar, Outlook, or
                              other calendar services on your availability
                              calendar.
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 text-sm"
                        onClick={() => setShowCalendarForm(true)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Add your own calendar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Booking Analytics - Full Width */}
        <div className="col-span-full">
          <Card className="p-6">
            <div>
              {bookingsLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                  Loading bookings...
                </div>
              ) : (
                <BookingAnalytics
                  bookings={bookings}
                  month={monthNames[currentDate.getMonth()]}
                />
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Calendar Link Form Modal */}
      <CalendarLinkForm
        isOpen={showCalendarForm}
        onClose={() => setShowCalendarForm(false)}
        onSave={saveCalendarUrl}
        currentUrl={calendarUrl || undefined}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onStatusUpdate={handleBookingStatusUpdate}
      />
    </DashboardLayout>
  );
}
