"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  createLogSchema,
  type CreateLogInput,
} from "@/lib/validations/log";
import { requireUser } from "@/server/auth/session";
import { upsertArticleFromInput } from "@/server/services/articles";

async function ensureTags(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tags: string[],
) {
  const tagIds: string[] = [];

  for (const raw of tags) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    const slug = slugify(name);
    if (!slug) continue;

    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      tagIds.push(existing.id);
      continue;
    }

    const { data: created } = await supabase
      .from("tags")
      .insert({ name, slug })
      .select("id")
      .single();

    if (created) tagIds.push(created.id);
  }

  return tagIds;
}

export async function createLog(input: CreateLogInput) {
  const user = await requireUser();
  const parsed = createLogSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false as const,
      articleSlug: null,
      error: parsed.error.issues[0]?.message ?? "Invalid log data",
    };
  }

  const data = parsed.data;
  const { article, error: articleError } = await upsertArticleFromInput({
    url: data.url,
    title: data.title,
    authorName: data.authorName || null,
    sourceName: data.sourceName || null,
    coverUrl: data.coverUrl || null,
  });

  if (!article) {
    return {
      ok: false as const,
      articleSlug: null,
      error: articleError ?? "Could not save article",
    };
  }

  const supabase = await createClient();
  const reviewBody = data.review?.trim() || "";
  let reviewId: string | null = null;

  if (reviewBody) {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("article_id", article.id)
      .maybeSingle();

    if (existingReview) {
      const { data: updated, error } = await supabase
        .from("reviews")
        .update({
          body_md: reviewBody,
          has_spoilers: data.hasSpoilers ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingReview.id)
        .select("id")
        .single();

      if (error) {
        return {
          ok: false as const,
          articleSlug: article.slug,
          error: error.message,
        };
      }
      reviewId = updated.id;
    } else {
      const { data: created, error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          article_id: article.id,
          body_md: reviewBody,
          has_spoilers: data.hasSpoilers ?? false,
        })
        .select("id")
        .single();

      if (error) {
        return {
          ok: false as const,
          articleSlug: article.slug,
          error: error.message,
        };
      }
      reviewId = created.id;
    }
  }

  const { data: existingLog } = await supabase
    .from("logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("article_id", article.id)
    .maybeSingle();

  const logPayload = {
    read_at: data.readAt,
    rating: data.rating ?? null,
    review_id: reviewId,
    reading_minutes: data.readingMinutes ?? null,
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
        articleSlug: article.slug,
        error: error.message,
      };
    }
    logId = updated.id;
  } else {
    const { data: created, error } = await supabase
      .from("logs")
      .insert({
        user_id: user.id,
        article_id: article.id,
        ...logPayload,
      })
      .select("id")
      .single();

    if (error) {
      return {
        ok: false as const,
        articleSlug: article.slug,
        error: error.message,
      };
    }
    logId = created.id;
  }

  if (data.tags?.length) {
    const tagIds = await ensureTags(supabase, data.tags);
    if (tagIds.length) {
      await supabase.from("log_tags").delete().eq("log_id", logId);
      await supabase.from("log_tags").insert(
        tagIds.map((tagId) => ({
          log_id: logId,
          tag_id: tagId,
          user_id: user.id,
        })),
      );
    }
  }

  const activities: {
    actor_id: string;
    type: "logged" | "rated" | "reviewed";
    entity_type: string;
    entity_id: string;
    article_id: string;
    meta: { [key: string]: string | number | boolean | null } | null;
  }[] = [
    {
      actor_id: user.id,
      type: "logged",
      entity_type: "log",
      entity_id: logId,
      article_id: article.id,
      meta: { read_at: data.readAt },
    },
  ];

  if (data.rating) {
    activities.push({
      actor_id: user.id,
      type: "rated",
      entity_type: "log",
      entity_id: logId,
      article_id: article.id,
      meta: { rating: data.rating },
    });
  }

  if (reviewId && reviewBody) {
    activities.push({
      actor_id: user.id,
      type: "reviewed",
      entity_type: "review",
      entity_id: reviewId,
      article_id: article.id,
      meta: null,
    });
  }

  await supabase.from("activities").insert(activities);

  revalidatePath("/home");
  revalidatePath(`/article/${article.slug}`);
  revalidatePath("/discover");

  return {
    ok: true as const,
    articleSlug: article.slug,
  };
}
