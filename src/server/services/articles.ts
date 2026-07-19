import { createClient } from "@/lib/supabase/server";
import { normalizeUrl, slugify } from "@/lib/utils";
import type { Article } from "@/types/database";

export type UpsertArticleInput = {
  url: string;
  title: string;
  authorName?: string | null;
  sourceName?: string | null;
  coverUrl?: string | null;
};

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
): Promise<string> {
  const root = slugify(base) || "article";
  let candidate = root;
  let attempt = 1;

  while (attempt < 50) {
    const { data } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }

  return `${root}-${Date.now()}`;
}

async function ensureSource(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceName: string | null | undefined,
  url: string,
) {
  let domain: string | null = null;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    domain = null;
  }

  if (domain) {
    const { data: byDomain } = await supabase
      .from("sources")
      .select("id")
      .eq("domain", domain)
      .maybeSingle();
    if (byDomain) return byDomain.id;
  }

  const name = sourceName?.trim() || domain || "Unknown source";
  const slug = slugify(name) || slugify(domain ?? "source") || "source";

  const { data: bySlug } = await supabase
    .from("sources")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (bySlug) return bySlug.id;

  const { data, error } = await supabase
    .from("sources")
    .insert({ name, slug, domain })
    .select("id")
    .single();

  if (error) {
    console.error("ensureSource", error.message);
    return null;
  }

  return data.id;
}

async function ensureAuthor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authorName: string,
) {
  const name = authorName.trim();
  if (!name) return null;

  const slug = slugify(name) || "author";

  const { data: existing } = await supabase
    .from("authors")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("authors")
    .insert({ name, slug })
    .select("id")
    .single();

  if (error) {
    console.error("ensureAuthor", error.message);
    return null;
  }

  return data.id;
}

export async function upsertArticleFromInput(
  input: UpsertArticleInput,
): Promise<{ article: Article | null; error?: string }> {
  const supabase = await createClient();

  let normalized: string;
  try {
    normalized = normalizeUrl(input.url);
  } catch {
    return { article: null, error: "Invalid URL" };
  }

  const { data: existing } = await supabase
    .from("articles")
    .select("*")
    .eq("url", normalized)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, string | null> = {};
    if (!existing.cover_url && input.coverUrl) {
      updates.cover_url = input.coverUrl;
    }
    if (input.title && input.title !== existing.title) {
      // Keep canonical title unless empty
    }
    if (Object.keys(updates).length > 0) {
      const { data: updated } = await supabase
        .from("articles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("*")
        .single();
      return { article: updated ?? existing };
    }
    return { article: existing };
  }

  const sourceId = await ensureSource(
    supabase,
    input.sourceName,
    normalized,
  );
  const slug = await uniqueSlug(supabase, input.title);

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      slug,
      title: input.title.trim(),
      url: normalized,
      cover_url: input.coverUrl || null,
      source_id: sourceId,
    })
    .select("*")
    .single();

  if (error || !article) {
    return { article: null, error: error?.message ?? "Failed to create article" };
  }

  if (input.authorName?.trim()) {
    const authorId = await ensureAuthor(supabase, input.authorName);
    if (authorId) {
      await supabase.from("article_authors").upsert(
        {
          article_id: article.id,
          author_id: authorId,
          position: 0,
        },
        { onConflict: "article_id,author_id" },
      );
    }
  }

  return { article };
}
