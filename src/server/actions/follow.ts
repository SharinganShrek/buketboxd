"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/session";

export async function followUser(userId: string) {
  const user = await requireUser();

  if (user.id === userId) {
    return { ok: false as const, error: "You cannot follow yourself" };
  }

  const supabase = await createClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", userId)
    .maybeSingle();

  if (!target) {
    return { ok: false as const, error: "User not found" };
  }

  const { error } = await supabase.from("follows").upsert(
    {
      follower_id: user.id,
      following_id: userId,
    },
    { onConflict: "follower_id,following_id" },
  );

  if (error) {
    return { ok: false as const, error: error.message };
  }

  await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: user.id,
    type: "follow",
    entity_type: "profile",
    entity_id: user.id,
  });

  await supabase.from("activities").insert({
    actor_id: user.id,
    type: "followed",
    entity_type: "profile",
    entity_id: userId,
    work_id: null,
    meta: { following_id: userId },
  });

  revalidatePath(`/u/${target.username}`);
  revalidatePath("/home");

  return { ok: true as const };
}

export async function unfollowUser(userId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", userId);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (target?.username) {
    revalidatePath(`/u/${target.username}`);
  }
  revalidatePath("/home");

  return { ok: true as const };
}
