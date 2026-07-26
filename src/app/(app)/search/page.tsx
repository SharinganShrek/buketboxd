import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  coverUrlFromId,
  normalizeOlAuthorKey,
  normalizeOlWorkKey,
  searchOpenLibraryAuthors,
  searchOpenLibraryWorks,
} from "@/lib/openlibrary";
import { createClient } from "@/lib/supabase/server";
import { formatRating } from "@/lib/utils";

export const metadata = {
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const supabase = await createClient();

  let works: {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    avg_rating: number | string;
    logs_count: number;
  }[] = [];
  let authors: {
    id: string;
    slug: string;
    name: string;
    photo_url: string | null;
    bio: string | null;
  }[] = [];
  let users: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  }[] = [];
  let entries: {
    id: string;
    title: string | null;
    body_md: string;
    work: { slug: string; title: string } | { slug: string; title: string }[] | null;
    user: {
      username: string;
      display_name: string | null;
    } | {
      username: string;
      display_name: string | null;
    }[] | null;
  }[] = [];
  let olWorks: {
    olWorkKey: string;
    title: string;
    authors: string[];
    coverUrl: string | null;
    firstPublishYear: number | null;
  }[] = [];
  let olAuthors: {
    olAuthorKey: string;
    name: string;
    topWork: string | null;
  }[] = [];

  if (query) {
    const pattern = `%${query.replace(/[%_]/g, "")}%`;
    const [
      { data: workRows },
      { data: authorRows },
      { data: userRows },
    ] = await Promise.all([
      supabase
        .from("works")
        .select("id, slug, title, cover_url, avg_rating, logs_count")
        .ilike("title", pattern)
        .limit(20),
      supabase
        .from("authors")
        .select("id, slug, name, photo_url, bio")
        .ilike("name", pattern)
        .limit(20),
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio")
        .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
        .limit(20),
    ]);

    works = workRows ?? [];
    authors = authorRows ?? [];
    users = userRows ?? [];

    const localEmpty =
      works.length === 0 && authors.length === 0 && users.length === 0;

    if (localEmpty) {
      const { data: entryRows } = await supabase
        .from("reviews")
        .select(
          `
          id,
          title,
          body_md,
          work:works!reviews_work_id_fkey ( slug, title ),
          user:profiles!reviews_user_id_fkey ( username, display_name )
        `,
        )
        .or(`body_md.ilike.${pattern},title.ilike.${pattern}`)
        .limit(20);
      entries = entryRows ?? [];
    }

    try {
      const [olWorkDocs, olAuthorDocs] = await Promise.all([
        searchOpenLibraryWorks(query, 8),
        searchOpenLibraryAuthors(query, 8),
      ]);

      const localWorkTitles = new Set(works.map((w) => w.title.toLowerCase()));
      const localAuthorNames = new Set(
        authors.map((a) => a.name.toLowerCase()),
      );

      olWorks = olWorkDocs
        .filter((d) => !localWorkTitles.has(d.title.toLowerCase()))
        .map((doc) => ({
          olWorkKey: normalizeOlWorkKey(doc.key),
          title: doc.title,
          authors: doc.author_name ?? [],
          coverUrl: coverUrlFromId(doc.cover_i, "M"),
          firstPublishYear: doc.first_publish_year ?? null,
        }));

      olAuthors = olAuthorDocs
        .filter((d) => !localAuthorNames.has(d.name.toLowerCase()))
        .map((doc) => ({
          olAuthorKey: normalizeOlAuthorKey(doc.key),
          name: doc.name,
          topWork: doc.top_work ?? null,
        }));
    } catch {
      // Open Library optional enrichment
    }
  }

  const hasResults =
    works.length > 0 ||
    authors.length > 0 ||
    users.length > 0 ||
    entries.length > 0 ||
    olWorks.length > 0 ||
    olAuthors.length > 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find works, authors, and readers.
        </p>
        <form className="mt-6 max-w-xl">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search works, authors, usernames…"
            className="h-11"
          />
        </form>
      </div>

      {!query ? (
        <EmptyState
          icon={Search}
          title="Search Buketboxd"
          description="Type a query above to find works, authors, and people."
        />
      ) : !hasResults ? (
        <EmptyState
          icon={Search}
          title="No results"
          description={`Nothing matched “${query}”.`}
        />
      ) : (
        <>
          <ResultSection
            title="Works"
            empty="No works found."
            count={works.length + olWorks.length}
          >
            {works.map((work) => (
              <li key={work.id}>
                <Link
                  href={`/work/${work.slug}`}
                  className="flex gap-3 rounded-lg border border-border/60 bg-surface/30 p-3 transition-colors hover:border-accent/40"
                >
                  <Cover thumb={work.cover_url} />
                  <div>
                    <p className="font-medium">{work.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRating(work.avg_rating)} · {work.logs_count} logs
                    </p>
                  </div>
                </Link>
              </li>
            ))}
            {olWorks.map((work) => (
              <li key={work.olWorkKey}>
                <Link
                  href={`/work/ol/${work.olWorkKey}`}
                  className="flex gap-3 rounded-lg border border-border/60 bg-surface/30 p-3 transition-colors hover:border-accent/40"
                >
                  <Cover thumb={work.coverUrl} />
                  <div>
                    <p className="font-medium">{work.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {work.authors.join(", ") || "Open Library"}
                      {work.firstPublishYear
                        ? ` · ${work.firstPublishYear}`
                        : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ResultSection>

          <ResultSection
            title="Authors"
            empty="No authors found."
            count={authors.length + olAuthors.length}
          >
            {authors.map((author) => (
              <li key={author.id}>
                <Link
                  href={`/author/${author.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/30 p-3 transition-colors hover:border-accent/40"
                >
                  <AuthorAvatar name={author.name} src={author.photo_url} />
                  <div>
                    <p className="font-medium">{author.name}</p>
                    {author.bio ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {author.bio}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
            {olAuthors.map((author) => (
              <li key={author.olAuthorKey}>
                <Link
                  href={`/author/ol/${author.olAuthorKey}`}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/30 p-3 transition-colors hover:border-accent/40"
                >
                  <AuthorAvatar
                    name={author.name}
                    src={`https://covers.openlibrary.org/a/olid/${author.olAuthorKey}-M.jpg`}
                  />
                  <div>
                    <p className="font-medium">{author.name}</p>
                    {author.topWork ? (
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        Known for {author.topWork}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Open Library
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ResultSection>

          <ResultSection
            title="People"
            empty="No people found."
            count={users.length}
          >
            {users.map((user) => {
              const name = user.display_name || user.username;
              return (
                <li key={user.id}>
                  <Link
                    href={`/u/${user.username}`}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface/30 p-3 transition-colors hover:border-accent/40"
                  >
                    <Avatar className="size-10 border border-border">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={name} />
                      ) : null}
                      <AvatarFallback>
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ResultSection>

          {entries.length > 0 ? (
            <ResultSection title="Entries" empty="" count={entries.length}>
              {entries.map((entry) => {
                const work = Array.isArray(entry.work)
                  ? entry.work[0]
                  : entry.work;
                const user = Array.isArray(entry.user)
                  ? entry.user[0]
                  : entry.user;
                return (
                  <li key={entry.id}>
                    <Link
                      href={`/review/${entry.id}`}
                      className="block rounded-lg border border-border/60 bg-surface/30 p-3 transition-colors hover:border-accent/40"
                    >
                      <p className="font-medium">
                        {entry.title || work?.title || "Untitled entry"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {entry.body_md}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {user ? `@${user.username}` : "Someone"}
                        {work ? ` · ${work.title}` : ""}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ResultSection>
          ) : null}
        </>
      )}
    </div>
  );
}

function Cover({ thumb }: { thumb: string | null }) {
  return (
    <div className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-muted">
      {thumb ? (
        <Image
          src={thumb}
          alt=""
          fill
          className="object-cover"
          sizes="48px"
          unoptimized
        />
      ) : null}
    </div>
  );
}

function AuthorAvatar({ name, src }: { name: string; src: string | null }) {
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="40px"
          unoptimized
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs font-medium">
          {name.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function ResultSection({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {count === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">{children}</ul>
      )}
    </section>
  );
}
