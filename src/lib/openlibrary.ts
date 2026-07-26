const OL_BASE = "https://openlibrary.org";
const COVERS_BASE = "https://covers.openlibrary.org";

const USER_AGENT =
  process.env.OPENLIBRARY_USER_AGENT ??
  "Buketboxd/1.0 (https://github.com/buketboxd; openlibrary@example.com)";

export type OpenLibraryWorkHit = {
  key: string;
  title: string;
  author_name?: string[];
  author_key?: string[];
  cover_i?: number;
  first_publish_year?: number;
};

export type OpenLibraryAuthorHit = {
  key: string;
  name: string;
  birth_date?: string;
  top_work?: string;
  work_count?: number;
};

function olHeaders(): HeadersInit {
  return {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  };
}

export function normalizeOlWorkKey(key: string): string {
  return key.replace(/^\/works\//, "").trim();
}

export function normalizeOlAuthorKey(key: string): string {
  return key.replace(/^\/authors\//, "").trim();
}

export function coverUrlFromId(
  coverId: number | null | undefined,
  size: "S" | "M" | "L" = "L",
): string | null {
  if (!coverId) return null;
  return `${COVERS_BASE}/b/id/${coverId}-${size}.jpg`;
}

export function authorPhotoUrl(
  olAuthorKey: string,
  size: "S" | "M" | "L" = "M",
): string {
  const key = normalizeOlAuthorKey(olAuthorKey);
  return `${COVERS_BASE}/a/olid/${key}-${size}.jpg`;
}

function extractDescription(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw.trim() || null;
  if (
    typeof raw === "object" &&
    raw !== null &&
    "value" in raw &&
    typeof (raw as { value: unknown }).value === "string"
  ) {
    return ((raw as { value: string }).value).trim() || null;
  }
  return null;
}

export async function searchOpenLibraryWorks(
  query: string,
  limit = 10,
): Promise<OpenLibraryWorkHit[]> {
  const q = query.trim();
  if (!q) return [];

  const url = new URL(`${OL_BASE}/search.json`);
  url.searchParams.set("q", q);
  url.searchParams.set(
    "fields",
    "key,title,author_name,author_key,cover_i,first_publish_year",
  );
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: olHeaders(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Open Library search failed (${res.status})`);
  }

  const data = (await res.json()) as { docs?: OpenLibraryWorkHit[] };
  return (data.docs ?? []).filter((d) => d.key && d.title);
}

export async function searchOpenLibraryAuthors(
  query: string,
  limit = 10,
): Promise<OpenLibraryAuthorHit[]> {
  const q = query.trim();
  if (!q) return [];

  const url = new URL(`${OL_BASE}/search/authors.json`);
  url.searchParams.set("q", q);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, {
    headers: olHeaders(),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Open Library author search failed (${res.status})`);
  }

  const data = (await res.json()) as { docs?: OpenLibraryAuthorHit[] };
  return (data.docs ?? []).filter((d) => d.key && d.name);
}

export type OpenLibraryWorkDetails = {
  olWorkKey: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  firstPublishYear: number | null;
  authors: {
    olAuthorKey: string;
    name: string;
    bio: string | null;
    photoUrl: string | null;
  }[];
};

export async function fetchOpenLibraryWork(
  workKey: string,
): Promise<OpenLibraryWorkDetails | null> {
  const olWorkKey = normalizeOlWorkKey(workKey);
  if (!olWorkKey) return null;

  const res = await fetch(`${OL_BASE}/works/${olWorkKey}.json`, {
    headers: olHeaders(),
    next: { revalidate: 86400 },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Open Library work fetch failed (${res.status})`);
  }

  const work = (await res.json()) as {
    title?: string;
    description?: unknown;
    covers?: number[];
    first_publish_date?: string;
    authors?: { author?: { key?: string } }[];
  };

  const coverUrl = coverUrlFromId(work.covers?.[0] ?? null);
  const yearMatch = work.first_publish_date?.match(/\d{4}/);
  const firstPublishYear = yearMatch ? Number(yearMatch[0]) : null;

  const authorRefs = (work.authors ?? [])
    .map((a) => a.author?.key)
    .filter(Boolean) as string[];

  const authors = await Promise.all(
    authorRefs.slice(0, 8).map(async (ref) => {
      const olAuthorKey = normalizeOlAuthorKey(ref);
      try {
        const authorRes = await fetch(
          `${OL_BASE}/authors/${olAuthorKey}.json`,
          {
            headers: olHeaders(),
            next: { revalidate: 86400 },
          },
        );
        if (!authorRes.ok) {
          return {
            olAuthorKey,
            name: olAuthorKey,
            bio: null,
            photoUrl: authorPhotoUrl(olAuthorKey),
          };
        }
        const author = (await authorRes.json()) as {
          name?: string;
          personal_name?: string;
          bio?: unknown;
        };
        return {
          olAuthorKey,
          name: author.name || author.personal_name || olAuthorKey,
          bio: extractDescription(author.bio),
          photoUrl: authorPhotoUrl(olAuthorKey),
        };
      } catch {
        return {
          olAuthorKey,
          name: olAuthorKey,
          bio: null,
          photoUrl: authorPhotoUrl(olAuthorKey),
        };
      }
    }),
  );

  return {
    olWorkKey,
    title: work.title?.trim() || "Untitled",
    description: extractDescription(work.description),
    coverUrl,
    firstPublishYear,
    authors,
  };
}
