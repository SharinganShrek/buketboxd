"use server";

import {
  authorPhotoUrl,
  coverUrlFromId,
  normalizeOlAuthorKey,
  normalizeOlWorkKey,
  searchOpenLibraryAuthors,
  searchOpenLibraryWorks,
} from "@/lib/openlibrary";

export type WorkSearchResult = {
  olWorkKey: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  firstPublishYear: number | null;
};

export type AuthorSearchResult = {
  olAuthorKey: string;
  name: string;
  photoUrl: string | null;
  topWork: string | null;
  workCount: number | null;
};

export async function searchWorksAction(query: string): Promise<{
  ok: boolean;
  results: WorkSearchResult[];
  error?: string;
}> {
  try {
    const docs = await searchOpenLibraryWorks(query, 12);
    return {
      ok: true,
      results: docs.map((doc) => ({
        olWorkKey: normalizeOlWorkKey(doc.key),
        title: doc.title,
        authors: doc.author_name ?? [],
        coverUrl: coverUrlFromId(doc.cover_i, "M"),
        firstPublishYear: doc.first_publish_year ?? null,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      results: [],
      error:
        error instanceof Error ? error.message : "Open Library search failed",
    };
  }
}

export async function searchAuthorsAction(query: string): Promise<{
  ok: boolean;
  results: AuthorSearchResult[];
  error?: string;
}> {
  try {
    const docs = await searchOpenLibraryAuthors(query, 12);
    return {
      ok: true,
      results: docs.map((doc) => {
        const olAuthorKey = normalizeOlAuthorKey(doc.key);
        return {
          olAuthorKey,
          name: doc.name,
          photoUrl: authorPhotoUrl(olAuthorKey, "M"),
          topWork: doc.top_work ?? null,
          workCount: doc.work_count ?? null,
        };
      }),
    };
  } catch (error) {
    return {
      ok: false,
      results: [],
      error:
        error instanceof Error ? error.message : "Open Library search failed",
    };
  }
}
