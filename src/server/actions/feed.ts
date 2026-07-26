"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/server/auth/session";
import type { ActivityType, Profile, Work } from "@/types/database";

export type FeedActivity = {
  id: string;
  type: ActivityType;
  entity_type: string;
  entity_id: string;
  work_id: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor: Pick<
    Profile,
    "id" | "username" | "display_name" | "avatar_url"
  > | null;
  work: Pick<
    Work,
    "id" | "slug" | "title" | "cover_url" | "avg_rating" | "logs_count"
  > | null;
};

export async function getHomeFeed({
  cursor,
  limit = 20,
}: {
  cursor?: string;
  limit?: number;
} = {}): Promise<{
  items: FeedActivity[];
  nextCursor: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const actorIds = [
    user.id,
    ...(follows ?? []).map((f) => f.following_id),
  ];

  let query = supabase
    .from("activities")
    .select(
      `
      id,
      type,
      entity_type,
      entity_id,
      work_id,
      meta,
      created_at,
      actor:profiles!activities_actor_id_fkey (
        id,
        username,
        display_name,
        avatar_url
      ),
      work:works!activities_work_id_fkey (
        id,
        slug,
        title,
        cover_url,
        avg_rating,
        logs_count
      )
    `,
    )
    .in("actor_id", actorIds)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("getHomeFeed", error.message);
    return { items: [], nextCursor: null };
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const items: FeedActivity[] = page.map((row) => ({
    id: row.id,
    type: row.type,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    work_id: row.work_id,
    meta: (row.meta as Record<string, unknown> | null) ?? null,
    created_at: row.created_at,
    actor: Array.isArray(row.actor) ? row.actor[0] ?? null : row.actor,
    work: Array.isArray(row.work) ? row.work[0] ?? null : row.work,
  }));

  return {
    items,
    nextCursor: hasMore ? page[page.length - 1]?.created_at ?? null : null,
  };
}
