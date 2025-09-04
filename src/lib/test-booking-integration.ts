import { createClientComponentClient } from "./supabase";
import { Database } from "@/types/database";

type Booking = Database["public"]["Tables"]["vendor_bookings"]["Row"];
type Inquiry = Database["public"]["Tables"]["vendor_inquiries"]["Row"];

export async function testBookingIntegration() {
  const supabase = createClientComponentClient();
  
  console.log("🔍 Testing booking integration...");
  
  try {
    // 1. Check if vendor_bookings table exists and has data
    const { data: bookings, error: bookingsError } = await supabase
      .from("vendor_bookings")
      .select("*")
      .limit(5);
    
    if (bookingsError) {
      console.error("❌ Error fetching bookings:", bookingsError);
    } else {
      console.log("✅ Bookings table accessible, found", bookings?.length || 0, "bookings");
      if (bookings && bookings.length > 0) {
        console.log("📅 Sample booking:", bookings[0]);
      }
    }
    
    // 2. Check vendor_inquiries table for booked inquiries
    const { data: inquiries, error: inquiriesError } = await supabase
      .from("vendor_inquiries")
      .select("*")
      .eq("status", "booked")
      .limit(5);
    
    if (inquiriesError) {
      console.error("❌ Error fetching booked inquiries:", inquiriesError);
    } else {
      console.log("✅ Found", inquiries?.length || 0, "booked inquiries");
      if (inquiries && inquiries.length > 0) {
        console.log("📋 Sample booked inquiry:", inquiries[0]);
      }
    }
    
    // 3. Check if there are any inquiries that should have bookings but don't
    if (inquiries && inquiries.length > 0) {
      for (const inquiry of inquiries) {
        const { data: existingBooking, error: bookingCheckError } = await supabase
          .from("vendor_bookings")
          .select("*")
          .eq("inquiry_id", inquiry.id)
          .single();
        
        if (bookingCheckError && bookingCheckError.code !== 'PGRST116') {
          console.error("❌ Error checking booking for inquiry", inquiry.id, ":", bookingCheckError);
        } else if (!existingBooking) {
          console.log("⚠️  Inquiry", inquiry.id, "is marked as booked but has no corresponding booking record");
        } else {
          console.log("✅ Inquiry", inquiry.id, "has corresponding booking:", existingBooking.id);
        }
      }
    }
    
    // 4. Check vendor_availability table
    const { data: availability, error: availabilityError } = await supabase
      .from("vendor_availability")
      .select("*")
      .eq("is_available", false)
      .limit(5);
    
    if (availabilityError) {
      console.error("❌ Error fetching availability:", availabilityError);
    } else {
      console.log("✅ Found", availability?.length || 0, "unavailable dates");
      if (availability && availability.length > 0) {
        console.log("📅 Sample unavailable date:", availability[0]);
      }
    }
    
  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}

export async function testCreateBookingFromInquiry(inquiryId: string) {
  const supabase = createClientComponentClient();
  
  console.log("🔍 Testing booking creation for inquiry:", inquiryId);
  
  try {
    // Get the inquiry
    const { data: inquiry, error: inquiryError } = await supabase
      .from("vendor_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .single();
    
    if (inquiryError || !inquiry) {
      console.error("❌ Error fetching inquiry:", inquiryError);
      return;
    }
    
    console.log("📋 Found inquiry:", inquiry);
    
    // Check if booking already exists
    const { data: existingBooking, error: existingError } = await supabase
      .from("vendor_bookings")
      .select("*")
      .eq("inquiry_id", inquiryId)
      .single();
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error("❌ Error checking existing booking:", existingError);
      return;
    }
    
    if (existingBooking) {
      console.log("⚠️  Booking already exists for this inquiry:", existingBooking);
      return;
    }
    
    // Create booking
    const { data: booking, error: bookingError } = await supabase
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
        budget_amount: inquiry.budget_range ? parseFloat(inquiry.budget_range.replace(/[^\d]/g, '')) : null,
        notes: inquiry.message,
      })
      .select()
      .single();
    
    if (bookingError) {
      console.error("❌ Error creating booking:", bookingError);
      return;
    }
    
    console.log("✅ Successfully created booking:", booking);
    
    // Update availability
    if (inquiry.event_date) {
      const { error: availabilityError } = await supabase
        .from("vendor_availability")
        .upsert({
          vendor_id: inquiry.vendor_id,
          date: inquiry.event_date,
          is_available: false,
        });
      
      if (availabilityError) {
        console.error("❌ Error updating availability:", availabilityError);
      } else {
        console.log("✅ Successfully updated availability for date:", inquiry.event_date);
      }
    }
    
  } catch (error) {
    console.error("❌ Error in test:", error);
  }
}
