"use server";

import { createActionClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function updateGuest(
  guestId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    groupCategory?: string;
    dietaryRestrictions?: string;
    plusOneName?: string;
    plusOneDietaryRestrictions?: string;
    notes?: string;
  }
) {
  const supabase = await createActionClient();

  const { data: guest, error } = await supabase
    .from("guests")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", guestId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/guests");
  return guest;
}
