"use server";

import { createActionClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function createGuestGroup(data: {
  eventId: string;
  name: string;
  color: string;
  sortOrder: number;
}) {
  const supabase = await createActionClient();

  const { data: group, error } = await supabase
    .from("guest_groups")
    .insert({
      event_id: data.eventId,
      name: data.name,
      color: data.color,
      sort_order: data.sortOrder,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/guests");
  return group;
}

export async function updateGuestGroup(
  groupId: string,
  data: {
    name?: string;
    color?: string;
    sortOrder?: number;
  }
) {
  const supabase = await createActionClient();

  const { data: group, error } = await supabase
    .from("guest_groups")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/guests");
  return group;
}

export async function deleteGuestGroup(groupId: string) {
  const supabase = await createActionClient();

  const { error } = await supabase
    .from("guest_groups")
    .delete()
    .eq("id", groupId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/guests");
  return { success: true };
}
