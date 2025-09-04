"use server";

import { createActionClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function deleteGuest(guestId: string) {
  const supabase = await createActionClient();

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", guestId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/guests");
  return { success: true };
}
