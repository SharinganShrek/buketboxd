"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createLogSchema,
  type CreateLogInput,
} from "@/lib/validations/log";
import { requireUser } from "@/server/auth/session";
import { upsertWorkFromOpenLibrary } from "@/server/services/works";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export async function createLog(input: CreateLogInput) {
  const user = await requireUser();
  const parsed = createLogSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      workSlug: null,
      error: parsed.error.issues[0]?.message ?? "Invalid log data",
    };
  }

  const data = parsed.data;
  const { work, error: workError } = await upsertWorkFromOpenLibrary({
    olWorkKey: data.olWorkKey,
  });

  if (!work) {
    return {
      ok: false as const,
      workSlug: null,
      error: workError ?? "Could not save work",
    };
  }

  const supabase = await createClient();
  const entryTitle = data.title?.trim() || null;
  const body = data.body.trim();
  const readAt = data.readAt || todayISODate();
  let reviewId: string | null = null;

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("work_id", work.id)
    .maybeSingle();

  if (existingReview) {
    const { data: updated, error } = await supabase
      .from("reviews")
      .update({
        title: entryTitle,
        body_md: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingReview.id)
      .select("id")
      .single();

    if (error) {
      return {
        ok: false as const,
        workSlug: work.slug,
        error: error.message,
      };
    }
    reviewId = updated.id;
  } else {
    const { data: created, error } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        work_id: work.id,
        title: entryTitle,
        body_md: body,
      })
      .select("id")
      .single();

    if (error) {
      return {
        ok: false as const,
        workSlug: work.slug,
        error: error.message,
      };
    }
    reviewId = created.id;
  }

  const { data: existingLog } = await supabase
    .from("logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("work_id", work.id)
    .maybeSingle();

  const logPayload = {
    read_at: readAt,
    rating: data.rating,
    review_id: reviewId,
    title: entryTitle,
    updated_at: new Date().toISOString(),
  };

  let logId: string;

  if (existingLog) {
    const { data: updated, error } = await supabase
      .from("logs")
      .update(logPayload)
      .eq("id", existingLog.id)
      .select("id")
      .single();

    if (error) {
      return {
        ok: false as const,
        workSlug: work.slug,
        error: error.message,
      };
    }
    logId = updated.id;
  } else {
    const { data: created, error } = await supabase
      .from("logs")
      .insert({
        user_id: user.id,
        work_id: work.id,
        ...logPayload,
      })
      .select("id")
      .single();

    if (error) {
      return {
        ok: false as const,
        workSlug: work.slug,
        error: error.message,
      };
    }
    logId = created.id;
  }

  const activities = [
    {
      actor_id: user.id,
      type: "logged" as const,
      entity_type: "log",
      entity_id: logId,
      work_id: work.id,
      meta: { read_at: readAt },
    },
    {
      actor_id: user.id,
      type: "rated" as const,
      entity_type: "log",
      entity_id: logId,
      work_id: work.id,
      meta: { rating: data.rating },
    },
    {
      actor_id: user.id,
      type: "reviewed" as const,
      entity_type: "review",
      entity_id: reviewId,
      work_id: work.id,
      meta: entryTitle ? { title: entryTitle } : null,
    },
  ];

  await supabase.from("activities").insert(activities);

  revalidatePath("/home");
  revalidatePath(`/work/${work.slug}`);
  revalidatePath("/discover");
  revalidatePath("/search");

  return {
    ok: true as const,
    workSlug: work.slug,
  };
}
