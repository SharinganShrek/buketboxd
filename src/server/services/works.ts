import {
  fetchOpenLibraryWork,
  normalizeOlAuthorKey,
  normalizeOlWorkKey,
  type OpenLibraryWorkHit,
} from "@/lib/openlibrary";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Work } from "@/types/database";

async function uniqueWorkSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  olWorkKey: string,
): Promise<string> {
  const root = slugify(base) || slugify(olWorkKey) || "work";
  let candidate = root;
  let attempt = 1;

  while (attempt < 50) {
    const { data } = await supabase
      .from("works")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }

  return `${root}-${Date.now()}`;
}

async function uniqueAuthorSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  olAuthorKey: string,
): Promise<string> {
  const root = slugify(base) || slugify(olAuthorKey) || "author";
  let candidate = root;
  let attempt = 1;

  while (attempt < 50) {
    const { data } = await supabase
      .from("authors")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data) return candidate;
    attempt += 1;
    candidate = `${root}-${attempt}`;
  }

  return `${root}-${Date.now()}`;
}

async function upsertAuthorFromOl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  author: {
    olAuthorKey: string;
    name: string;
    bio: string | null;
    photoUrl: string | null;
  },
): Promise<string | null> {
  const olAuthorKey = normalizeOlAuthorKey(author.olAuthorKey);

  const { data: existing } = await supabase
    .from("authors")
    .select("id, bio, photo_url")
    .eq("ol_author_key", olAuthorKey)
    .maybeSingle();

  if (existing) {
    const updates: { bio?: string; photo_url?: string } = {};
    if (!existing.bio && author.bio) updates.bio = author.bio;
    if (!existing.photo_url && author.photoUrl) {
      updates.photo_url = author.photoUrl;
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from("authors").update(updates).eq("id", existing.id);
    }
    return existing.id;
  }

  const slug = await uniqueAuthorSlug(supabase, author.name, olAuthorKey);
  const { data, error } = await supabase
    .from("authors")
    .insert({
      name: author.name.trim(),
      slug,
      ol_author_key: olAuthorKey,
      bio: author.bio,
      photo_url: author.photoUrl,
    })
    .select("id")
    .single();

  if (error) {
    console.error("upsertAuthorFromOl", error.message);
    return null;
  }

  return data.id;
}

export async function upsertAuthorFromOpenLibrary(input: {
  olAuthorKey: string;
  name?: string;
}): Promise<{ author: { id: string; slug: string; name: string } | null; error?: string }> {
  const supabase = await createClient();
  const olAuthorKey = normalizeOlAuthorKey(input.olAuthorKey);
  if (!olAuthorKey) {
    return { author: null, error: "Invalid author key" };
  }

  const { data: existing } = await supabase
    .from("authors")
    .select("id, slug, name")
    .eq("ol_author_key", olAuthorKey)
    .maybeSingle();

  if (existing) return { author: existing };

  let name = input.name?.trim() || "";
  let bio: string | null = null;
  const photoUrl = `https://covers.openlibrary.org/a/olid/${olAuthorKey}-M.jpg`;

  try {
    const res = await fetch(
      `https://openlibrary.org/authors/${olAuthorKey}.json`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent":
            process.env.OPENLIBRARY_USER_AGENT ??
            "Buketboxd/1.0 (https://github.com/buketboxd; openlibrary@example.com)",
        },
        next: { revalidate: 86400 },
      },
    );
    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        personal_name?: string;
        bio?: unknown;
      };
      name = data.name || data.personal_name || name || olAuthorKey;
      if (typeof data.bio === "string") bio = data.bio;
      else if (
        data.bio &&
        typeof data.bio === "object" &&
        "value" in data.bio &&
        typeof (data.bio as { value: unknown }).value === "string"
      ) {
        bio = (data.bio as { value: string }).value;
      }
    }
  } catch {
    // keep fallbacks
  }

  if (!name) name = olAuthorKey;

  const authorId = await upsertAuthorFromOl(supabase, {
    olAuthorKey,
    name,
    bio,
    photoUrl,
  });

  if (!authorId) {
    return { author: null, error: "Could not save author" };
  }

  const { data: created } = await supabase
    .from("authors")
    .select("id, slug, name")
    .eq("id", authorId)
    .single();

  return { author: created };
}

export async function upsertWorkFromOpenLibrary(input: {
  olWorkKey: string;
  /** Optional search hit to fill gaps before full fetch */
  searchHit?: OpenLibraryWorkHit | null;
}): Promise<{ work: Work | null; error?: string }> {
  const supabase = await createClient();
  const olWorkKey = normalizeOlWorkKey(input.olWorkKey);

  if (!olWorkKey) {
    return { work: null, error: "Invalid Open Library work key" };
  }

  const { data: existing } = await supabase
    .from("works")
    .select("*")
    .eq("ol_work_key", olWorkKey)
    .maybeSingle();

  let details;
  try {
    details = await fetchOpenLibraryWork(olWorkKey);
  } catch (error) {
    console.error("fetchOpenLibraryWork", error);
    if (existing) return { work: existing };
    return { work: null, error: "Could not fetch work from Open Library" };
  }

  if (!details && !existing) {
    return { work: null, error: "Work not found on Open Library" };
  }

  const title =
    details?.title ||
    input.searchHit?.title ||
    existing?.title ||
    "Untitled";
  const coverUrl =
    details?.coverUrl ||
    (input.searchHit?.cover_i
      ? `https://covers.openlibrary.org/b/id/${input.searchHit.cover_i}-L.jpg`
      : null) ||
    existing?.cover_url ||
    null;
  const description = details?.description ?? existing?.description ?? null;
  const firstPublishYear =
    details?.firstPublishYear ??
    input.searchHit?.first_publish_year ??
    existing?.first_publish_year ??
    null;

  let work: Work;

  if (existing) {
    const { data: updated, error } = await supabase
      .from("works")
      .update({
        title,
        cover_url: coverUrl,
        description,
        first_publish_year: firstPublishYear,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !updated) {
      return { work: existing, error: error?.message };
    }
    work = updated;
  } else {
    const slug = await uniqueWorkSlug(supabase, title, olWorkKey);
    const { data: created, error } = await supabase
      .from("works")
      .insert({
        ol_work_key: olWorkKey,
        slug,
        title,
        cover_url: coverUrl,
        description,
        first_publish_year: firstPublishYear,
      })
      .select("*")
      .single();

    if (error || !created) {
      return {
        work: null,
        error: error?.message ?? "Failed to create work",
      };
    }
    work = created;
  }

  const authors =
    details?.authors ??
    (input.searchHit?.author_key ?? []).map((key, index) => ({
      olAuthorKey: key,
      name: input.searchHit?.author_name?.[index] ?? key,
      bio: null,
      photoUrl: `https://covers.openlibrary.org/a/olid/${normalizeOlAuthorKey(key)}-M.jpg`,
    }));

  if (authors.length) {
    await supabase.from("work_authors").delete().eq("work_id", work.id);

    for (let i = 0; i < authors.length; i += 1) {
      const authorId = await upsertAuthorFromOl(supabase, authors[i]);
      if (!authorId) continue;
      await supabase.from("work_authors").upsert(
        {
          work_id: work.id,
          author_id: authorId,
          position: i,
        },
        { onConflict: "work_id,author_id" },
      );
    }
  }

  return { work };
}
