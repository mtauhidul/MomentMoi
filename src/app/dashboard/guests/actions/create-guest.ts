"use server";

import { createActionClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createGuest(data: {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  groupCategory?: string;
  dietaryRestrictions?: string;
  plusOneName?: string;
  plusOneDietaryRestrictions?: string;
  notes?: string;
}) {
  const supabase = await createActionClient();

  const { data: guest, error } = await supabase
    .from("guests")
    .insert({
      event_id: data.eventId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      group_category: data.groupCategory,
      dietary_restrictions: data.dietaryRestrictions,
      plus_one_name: data.plusOneName,
      plus_one_dietary_restrictions: data.plusOneDietaryRestrictions,
      notes: data.notes,
      invitation_sent: false,
      rsvp_status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/guests");
  return guest;
}
