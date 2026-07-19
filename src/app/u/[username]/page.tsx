import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewCard } from "@/components/article/review-card";
import { StarRating } from "@/components/common/star-rating";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileHeader } from "@/components/profile/profile-header";
import { createClient } from "@/lib/supabase/server";
import { formatRating } from "@/lib/utils";
import { getCurrentProfile } from "@/server/actions/profile";
import { getSessionUser } from "@/server/auth/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const currentUser = await getSessionUser();
  const currentProfile = await getCurrentProfile();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const [
    { count: logsCount },
    { count: reviewsCount },
    { count: followersCount },
    { count: followingCount },
    { data: recentLogs },
    { data: recentReviews },
    { data: followRow },
  ] = await Promise.all([
    supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),
    supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    supabase
      .from("logs")
      .select(
        `
        id,
        rating,
        read_at,
        article:articles!logs_article_id_fkey (
          slug,
          title,
          cover_url,
          avg_rating
        )
      `,
      )
      .eq("user_id", profile.id)
      .order("read_at", { ascending: false })
      .limit(12),
    supabase
      .from("reviews")
      .select(
        `
        id,
        body_md,
        has_spoilers,
        likes_count,
        created_at,
        article:articles!reviews_article_id_fkey ( slug, title ),
        log:logs!logs_review_id_fkey ( rating )
      `,
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(8),
    currentUser
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isOwn = currentUser?.id === profile.id;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader
        profile={
          currentProfile
            ? {
                username: currentProfile.username,
                display_name: currentProfile.display_name,
                avatar_url: currentProfile.avatar_url,
              }
            : null
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-12 px-4 py-8 sm:px-6">
        <ProfileHeader
          profile={profile}
          stats={{
            logs: logsCount ?? 0,
            reviews: reviewsCount ?? 0,
            followers: followersCount ?? 0,
            following: followingCount ?? 0,
          }}
          isOwn={isOwn}
          isFollowing={Boolean(followRow)}
          showFollow={Boolean(currentUser) && !isOwn}
        />

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Recent logs
          </h2>
          {(recentLogs ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No logs yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(recentLogs ?? []).map((log) => {
                const article = Array.isArray(log.article)
                  ? log.article[0]
                  : log.article;
                if (!article) return null;
                return (
                  <Link
                    key={log.id}
                    href={`/article/${article.slug}`}
                    className="overflow-hidden rounded-xl border border-border bg-surface/40 transition-colors hover:border-accent/40"
                  >
                    <div className="relative aspect-[16/10] bg-muted">
                      {article.cover_url ? (
                        <Image
                          src={article.cover_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width:768px) 100vw, 33vw"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium">
                        {article.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {log.rating ? (
                          <StarRating
                            value={Number(log.rating)}
                            readOnly
                            size="sm"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Unrated
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRating(article.avg_rating)} avg
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Recent reviews
          </h2>
          {(recentReviews ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No reviews yet.
            </p>
          ) : (
            <div className="mt-2">
              {(recentReviews ?? []).map((review) => {
                const article = Array.isArray(review.article)
                  ? review.article[0]
                  : review.article;
                const log = Array.isArray(review.log)
                  ? review.log[0]
                  : review.log;
                return (
                  <ReviewCard
                    key={review.id}
                    id={review.id}
                    bodyMd={review.body_md}
                    hasSpoilers={review.has_spoilers}
                    createdAt={review.created_at}
                    likesCount={review.likes_count}
                    rating={log?.rating}
                    author={{
                      username: profile.username,
                      display_name: profile.display_name,
                      avatar_url: profile.avatar_url,
                    }}
                    articleTitle={article?.title}
                    articleSlug={article?.slug}
                    showArticleLink
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
