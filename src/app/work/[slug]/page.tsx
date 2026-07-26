import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageSquareText } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EntryCard } from "@/components/work/entry-card";
import { WorkHero } from "@/components/work/work-hero";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/actions/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("works")
    .select("title")
    .eq("slug", slug)
    .maybeSingle();

  return { title: data?.title ?? "Work" };
}

export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort = "recent" } = await searchParams;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: work } = await supabase
    .from("works")
    .select(
      `
      *,
      authors:work_authors (
        position,
        author:authors ( name, slug )
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!work) notFound();

  let entriesQuery = supabase
    .from("reviews")
    .select(
      `
      id,
      title,
      body_md,
      likes_count,
      created_at,
      user:profiles!reviews_user_id_fkey ( username, display_name, avatar_url ),
      log:logs!logs_review_id_fkey ( rating )
    `,
    )
    .eq("work_id", work.id);

  if (sort === "popular") {
    entriesQuery = entriesQuery.order("likes_count", { ascending: false });
  } else {
    entriesQuery = entriesQuery.order("created_at", { ascending: false });
  }

  const [{ data: entries }, { data: readers }] = await Promise.all([
    entriesQuery.limit(40),
    supabase
      .from("logs")
      .select(
        `
        id,
        rating,
        user:profiles!logs_user_id_fkey ( username, display_name, avatar_url )
      `,
      )
      .eq("work_id", work.id)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const authors = (work.authors ?? [])
    .sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position,
    )
    .map(
      (row: {
        author:
          | { name: string; slug: string }
          | { name: string; slug: string }[]
          | null;
      }) => {
        const author = Array.isArray(row.author) ? row.author[0] : row.author;
        return author ? { name: author.name, slug: author.slug } : null;
      },
    )
    .filter(Boolean) as { name: string; slug: string }[];

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        profile={
          profile
            ? {
                username: profile.username,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
              }
            : null
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-8 sm:px-6">
        <WorkHero
          title={work.title}
          slug={work.slug}
          olWorkKey={work.ol_work_key}
          coverUrl={work.cover_url}
          description={work.description}
          avgRating={work.avg_rating}
          ratingsCount={work.ratings_count}
          logsCount={work.logs_count}
          firstPublishYear={work.first_publish_year}
          authors={authors}
        />

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Readers
          </h2>
          {(readers ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No one has logged this yet.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              {(readers ?? []).map((row) => {
                const user = Array.isArray(row.user) ? row.user[0] : row.user;
                if (!user) return null;
                const name = user.display_name || user.username;
                return (
                  <Link
                    key={row.id}
                    href={`/u/${user.username}`}
                    className="flex items-center gap-2 rounded-full border border-border bg-surface/40 py-1 pl-1 pr-3"
                    title={name}
                  >
                    <Avatar className="size-7 border border-border">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={name} />
                      ) : null}
                      <AvatarFallback className="text-[10px]">
                        {name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      @{user.username}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight">
              Entries
            </h2>
            <div className="flex gap-2 text-sm">
              <Link
                href={`/work/${slug}?sort=recent`}
                className={
                  sort !== "popular"
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                Recent
              </Link>
              <span className="text-border">|</span>
              <Link
                href={`/work/${slug}?sort=popular`}
                className={
                  sort === "popular"
                    ? "text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                Popular
              </Link>
            </div>
          </div>

          {(entries ?? []).length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="No entries yet"
              description="Be the first to write about this work."
              className="py-12"
            />
          ) : (
            <div className="mt-2">
              {(entries ?? []).map((entry) => {
                const user = Array.isArray(entry.user)
                  ? entry.user[0]
                  : entry.user;
                const log = Array.isArray(entry.log)
                  ? entry.log[0]
                  : entry.log;
                if (!user) return null;
                return (
                  <EntryCard
                    key={entry.id}
                    id={entry.id}
                    title={entry.title}
                    bodyMd={entry.body_md}
                    createdAt={entry.created_at}
                    likesCount={entry.likes_count}
                    rating={log?.rating}
                    author={user}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
