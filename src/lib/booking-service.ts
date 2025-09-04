import { createClientComponentClient } from "./supabase";

// Type definitions for the booking system
export interface Booking {
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

export interface Inquiry {
  id: string;
  vendor_id: string;
  service_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type: string;
  event_date?: string;
  guest_count?: number;
  location?: string;
  budget_range?: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
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
}

export class BookingService {
  private supabase;

  constructor() {
    this.supabase = createClientComponentClient();
  }

  /**
   * Create a booking from an inquiry and update availability
   */
  async createBookingFromInquiry(inquiry: Inquiry): Promise<Booking | null> {
    try {
      // Validate required fields
      if (!inquiry.event_date) {
        console.error("Inquiry must have an event date to create booking");
        return null;
      }

      // Create the booking
      const { data: booking, error: bookingError } = await this.supabase
        .from("vendor_bookings")
        .insert({
          vendor_id: inquiry.vendor_id,
          inquiry_id: inquiry.id,
          service_id: inquiry.service_id,
          client_name: inquiry.client_name,
          client_email: inquiry.client_email,
          client_phone: inquiry.client_phone,
          event_type: inquiry.event_type,
          event_date: inquiry.event_date,
          guest_count: inquiry.guest_count,
          location: inquiry.location,
          budget_amount: inquiry.budget_range
            ? this.parseBudgetRange(inquiry.budget_range)
            : null,
          notes: inquiry.message,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Error creating booking:", bookingError);
        return null;
      }

      // Update vendor availability for the event date
      await this.updateVendorAvailability(
        inquiry.vendor_id,
        inquiry.event_date,
        false
      );

      return booking;
    } catch (error) {
      console.error("Error in createBookingFromInquiry:", error);
      return null;
    }
  }

  /**
   * Update vendor availability for a specific date
   */
  async updateVendorAvailability(
    vendor_id: string,
    date: string,
    is_available: boolean
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("vendor_availability")
        .upsert({
          vendor_id,
          date,
          is_available,
        });

      if (error) {
        console.error("Error updating vendor availability:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateVendorAvailability:", error);
      return false;
    }
  }

  /**
   * Get bookings for a vendor within a date range
   */
  async getVendorBookings(
    vendor_id: string,
    start_date: string,
    end_date: string
  ): Promise<Booking[]> {
    try {
      const { data, error } = await this.supabase
        .from("vendor_bookings")
        .select(
          `
          *,
          service:vendor_services(name),
          inquiry:vendor_inquiries(status)
        `
        )
        .eq("vendor_id", vendor_id)
        .gte("event_date", start_date)
        .lte("event_date", end_date)
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Error fetching vendor bookings:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getVendorBookings:", error);
      return [];
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(
    booking_id: string,
    status: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("vendor_bookings")
        .update({ status })
        .eq("id", booking_id);

      if (error) {
        console.error("Error updating booking status:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in updateBookingStatus:", error);
      return false;
    }
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(booking_id: string): Promise<Booking | null> {
    try {
      const { data, error } = await this.supabase
        .from("vendor_bookings")
        .select(
          `
          *,
          service:vendor_services(name),
          inquiry:vendor_inquiries(status)
        `
        )
        .eq("id", booking_id)
        .single();

      if (error) {
        console.error("Error fetching booking:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getBookingById:", error);
      return null;
    }
  }

  /**
   * Delete a booking and restore availability
   */
  async deleteBooking(booking_id: string): Promise<boolean> {
    try {
      // First get the booking to know the vendor_id and event_date
      const booking = await this.getBookingById(booking_id);
      if (!booking) {
        return false;
      }

      // Delete the booking
      const { error: deleteError } = await this.supabase
        .from("vendor_bookings")
        .delete()
        .eq("id", booking_id);

      if (deleteError) {
        console.error("Error deleting booking:", deleteError);
        return false;
      }

      // Restore vendor availability for the event date
      await this.updateVendorAvailability(
        booking.vendor_id,
        booking.event_date,
        true
      );

      return true;
    } catch (error) {
      console.error("Error in deleteBooking:", error);
      return false;
    }
  }

  /**
   * Parse budget range string to numeric value
   */
  private parseBudgetRange(budgetRange: string): number | null {
    try {
      // Extract the first number from ranges like "€5000-€10000"
      const match = budgetRange.match(/[\d,]+/);
      if (match) {
        return parseFloat(match[0].replace(/,/g, ""));
      }
      return null;
    } catch {
      return null;
    }
  }
}
