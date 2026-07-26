import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ScoreRating } from "@/components/common/score-rating";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfileHeader } from "@/components/profile/profile-header";
import { EntryCard } from "@/components/work/entry-card";
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
        work:works!logs_work_id_fkey (
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
        title,
        body_md,
        likes_count,
        created_at,
        work:works!reviews_work_id_fkey ( slug, title ),
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
            <p className="mt-3 text-sm text-muted-foreground">No logs yet.</p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(recentLogs ?? []).map((log) => {
                const work = Array.isArray(log.work) ? log.work[0] : log.work;
                if (!work) return null;
                return (
                  <Link
                    key={log.id}
                    href={`/work/${work.slug}`}
                    className="overflow-hidden rounded-xl border border-border bg-surface/40 transition-colors hover:border-accent/40"
                  >
                    <div className="relative aspect-[2/3] bg-muted">
                      {work.cover_url ? (
                        <Image
                          src={work.cover_url}
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
                        {work.title}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {log.rating ? (
                          <ScoreRating
                            value={Number(log.rating)}
                            readOnly
                            size="sm"
                            showValue
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Unrated
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRating(work.avg_rating)} avg
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
            Recent entries
          </h2>
          {(recentReviews ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No entries yet.
            </p>
          ) : (
            <div className="mt-2">
              {(recentReviews ?? []).map((review) => {
                const work = Array.isArray(review.work)
                  ? review.work[0]
                  : review.work;
                const log = Array.isArray(review.log)
                  ? review.log[0]
                  : review.log;
                return (
                  <EntryCard
                    key={review.id}
                    id={review.id}
                    title={review.title}
                    bodyMd={review.body_md}
                    createdAt={review.created_at}
                    likesCount={review.likes_count}
                    rating={log?.rating}
                    author={{
                      username: profile.username,
                      display_name: profile.display_name,
                      avatar_url: profile.avatar_url,
                    }}
                    workTitle={work?.title}
                    workSlug={work?.slug}
                    showWorkLink
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
