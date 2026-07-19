import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleHero } from "@/components/article/article-hero";
import { ReviewCard } from "@/components/article/review-card";
import { EmptyState } from "@/components/common/empty-state";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/actions/profile";
import { MessageSquareText } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("title")
    .eq("slug", slug)
    .maybeSingle();

  return { title: data?.title ?? "Article" };
}

export default async function ArticlePage({
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

  const { data: article } = await supabase
    .from("articles")
    .select(
      `
      *,
      source:sources!articles_source_id_fkey ( name ),
      authors:article_authors (
        position,
        author:authors ( name )
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (!article) notFound();

  let reviewsQuery = supabase
    .from("reviews")
    .select(
      `
      id,
      body_md,
      has_spoilers,
      likes_count,
      created_at,
      user:profiles!reviews_user_id_fkey ( username, display_name, avatar_url ),
      log:logs!logs_review_id_fkey ( rating )
    `,
    )
    .eq("article_id", article.id);

  if (sort === "popular") {
    reviewsQuery = reviewsQuery.order("likes_count", { ascending: false });
  } else {
    reviewsQuery = reviewsQuery.order("created_at", { ascending: false });
  }

  const [{ data: reviews }, { data: readers }] = await Promise.all([
    reviewsQuery.limit(40),
    supabase
      .from("logs")
      .select(
        `
        id,
        rating,
        user:profiles!logs_user_id_fkey ( username, display_name, avatar_url )
      `,
      )
      .eq("article_id", article.id)
      .order("created_at", { ascending: false })
      .limit(24),
  ]);

  const source = Array.isArray(article.source)
    ? article.source[0]
    : article.source;
  const authorNames = (article.authors ?? [])
    .sort(
      (a: { position: number }, b: { position: number }) =>
        a.position - b.position,
    )
    .map((row: { author: { name: string } | { name: string }[] | null }) => {
      const author = Array.isArray(row.author) ? row.author[0] : row.author;
      return author?.name;
    })
    .filter(Boolean) as string[];

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
        <ArticleHero
          title={article.title}
          slug={article.slug}
          url={article.url}
          coverUrl={article.cover_url}
          avgRating={article.avg_rating}
          ratingsCount={article.ratings_count}
          logsCount={article.logs_count}
          sourceName={source?.name}
          authors={authorNames}
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
              Reviews
            </h2>
            <div className="flex gap-2 text-sm">
              <Link
                href={`/article/${slug}?sort=recent`}
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
                href={`/article/${slug}?sort=popular`}
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

          {(reviews ?? []).length === 0 ? (
            <EmptyState
              icon={MessageSquareText}
              title="No reviews yet"
              description="Be the first to write about this piece."
              className="py-12"
            />
          ) : (
            <div className="mt-2">
              {(reviews ?? []).map((review) => {
                const user = Array.isArray(review.user)
                  ? review.user[0]
                  : review.user;
                const log = Array.isArray(review.log)
                  ? review.log[0]
                  : review.log;
                if (!user) return null;
                return (
                  <ReviewCard
                    key={review.id}
                    id={review.id}
                    bodyMd={review.body_md}
                    hasSpoilers={review.has_spoilers}
                    createdAt={review.created_at}
                    likesCount={review.likes_count}
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
