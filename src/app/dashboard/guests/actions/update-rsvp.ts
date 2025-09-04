"use server";

import { createActionClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { RSVPStatus } from "@/types/guests";

export type { RSVPStatus };

export async function updateRSVPStatus(
  guestId: string,
  status: RSVPStatus,
  responseDate?: Date
) {
  const supabase = await createActionClient();

  const { data, error } = await supabase
    .from("guests")
    .update({
      rsvp_status: status,
      rsvp_response_date: responseDate || new Date().toISOString(),
    })
    .eq("id", guestId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/guests");
  return data;
}
