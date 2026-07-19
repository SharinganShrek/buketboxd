"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/profile";
import { requireUser } from "@/server/auth/session";
import type { Profile } from "@/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("getCurrentProfile", error.message);
    return null;
  }

  return data;
}

export async function updateProfile(input: UpdateProfileInput) {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid profile data",
    };
  }

  const { username, displayName, bio, avatarUrl } = parsed.data;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return { ok: false as const, error: "Username is already taken" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath(`/u/${username}`);
  revalidatePath("/home");

  return { ok: true as const };
}

export async function completeOnboarding(input: {
  username: string;
  displayName?: string;
}) {
  const user = await requireUser();
  const parsed = updateProfileSchema
    .pick({ username: true, displayName: true })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid onboarding data",
    };
  }

  const { username, displayName } = parsed.data;
  const supabase = await createClient();

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (taken) {
    return { ok: false as const, error: "Username is already taken" };
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  const payload = {
    username,
    display_name:
      displayName ||
      (user.user_metadata?.full_name as string | undefined) ||
      username,
    avatar_url:
      (user.user_metadata?.avatar_url as string | undefined) ||
      (user.user_metadata?.picture as string | undefined) ||
      null,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("profiles").update(payload).eq("id", user.id)
    : await supabase.from("profiles").insert({
        id: user.id,
        ...payload,
      });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/home");
  revalidatePath(`/u/${username}`);

  return { ok: true as const };
}
