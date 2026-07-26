import Image from "next/image";
import Link from "next/link";

import { FadeIn } from "@/components/common/fade-in";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatRating } from "@/lib/utils";
import { getCurrentProfile } from "@/server/actions/profile";

export default async function MarketingPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [
    { data: recentActivities },
    { data: trending },
    { data: popularReviews },
    { data: newMembers },
  ] = await Promise.all([
    supabase
      .from("activities")
      .select(
        `
        id,
        type,
        created_at,
        actor:profiles!activities_actor_id_fkey ( username, display_name, avatar_url ),
        work:works!activities_work_id_fkey ( slug, title )
      `,
      )
      .in("type", ["logged", "rated", "reviewed"])
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("works")
      .select("id, slug, title, cover_url, avg_rating, logs_count")
      .order("logs_count", { ascending: false })
      .limit(8),
    supabase
      .from("reviews")
      .select(
        `
        id,
        body_md,
        likes_count,
        created_at,
        user:profiles!reviews_user_id_fkey ( username, display_name, avatar_url ),
        work:works!reviews_work_id_fkey ( slug, title )
      `,
      )
      .order("likes_count", { ascending: false })
      .limit(6),
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return (
    <div className="flex min-h-full flex-col bg-background">
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

      <section className="relative isolate min-h-[85vh] overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(232,196,124,0.14),_transparent_55%),linear-gradient(180deg,_#14161a_0%,_#0b0c0f_70%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e8c47c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative mx-auto flex min-h-[85vh] w-full max-w-6xl flex-col justify-center px-4 py-24 sm:px-6">
          <FadeIn>
            <p className="font-display text-5xl font-semibold tracking-tight text-foreground sm:text-7xl md:text-8xl">
              Buketboxd
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="mt-6 max-w-2xl font-display text-2xl leading-snug text-foreground/90 sm:text-3xl">
              Your diary for the works you read.
            </h1>
          </FadeIn>
          <FadeIn delay={0.16}>
            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              Find books on Open Library, rate them out of 10, write what stayed
              with you, and follow fellow readers.
            </p>
          </FadeIn>
          <FadeIn delay={0.24}>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={profile ? "/log/new" : "/signup"}>
                  Start logging
                </Link>
              </Button>
              {!profile ? (
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Log in</Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link href="/home">Open feed</Link>
                </Button>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-20 px-4 py-16 sm:px-6">
        <FadeIn>
          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Recent activity
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fresh reads from across the community.
            </p>
            <ul className="mt-6 space-y-3">
              {(recentActivities ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No activity yet — be the first to log a read.
                </li>
              ) : (
                (recentActivities ?? []).map((item) => {
                  const actor = Array.isArray(item.actor)
                    ? item.actor[0]
                    : item.actor;
                  const work = Array.isArray(item.work)
                    ? item.work[0]
                    : item.work;
                  return (
                    <li
                      key={item.id}
                      className="text-sm text-muted-foreground"
                    >
                      <span className="text-foreground">
                        {actor?.display_name || actor?.username || "Someone"}
                      </span>{" "}
                      {item.type}
                      {work ? (
                        <>
                          {" "}
                          <Link
                            href={`/work/${work.slug}`}
                            className="text-accent hover:underline"
                          >
                            {work.title}
                          </Link>
                        </>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </FadeIn>

        <FadeIn>
          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Trending works
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Most logged works right now.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(trending ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-4">
                  Nothing trending yet.
                </p>
              ) : (
                (trending ?? []).map((work) => (
                  <Link
                    key={work.id}
                    href={`/work/${work.slug}`}
                    className="group overflow-hidden rounded-xl border border-border bg-surface/50 transition-colors hover:border-accent/40"
                  >
                    <div className="relative aspect-[2/3] bg-muted">
                      {work.cover_url ? (
                        <Image
                          src={work.cover_url}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          sizes="(max-width:768px) 100vw, 25vw"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-sm font-medium">
                        {work.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRating(work.avg_rating)} · {work.logs_count} logs
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </FadeIn>

        <FadeIn>
          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Popular entries
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Entries the community is loving.
            </p>
            <ul className="mt-6 space-y-4">
              {(popularReviews ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No entries yet.
                </li>
              ) : (
                (popularReviews ?? []).map((review) => {
                  const user = Array.isArray(review.user)
                    ? review.user[0]
                    : review.user;
                  const work = Array.isArray(review.work)
                    ? review.work[0]
                    : review.work;
                  return (
                    <li
                      key={review.id}
                      className="rounded-xl border border-border bg-surface/40 p-4"
                    >
                      <p className="text-sm text-muted-foreground">
                        <Link
                          href={
                            user ? `/u/${user.username}` : `/review/${review.id}`
                          }
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {user?.display_name || user?.username || "Reader"}
                        </Link>
                        {work ? (
                          <>
                            {" "}
                            on{" "}
                            <Link
                              href={`/work/${work.slug}`}
                              className="text-accent hover:underline"
                            >
                              {work.title}
                            </Link>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed">
                        {review.body_md}
                      </p>
                      <Link
                        href={`/review/${review.id}`}
                        className="mt-2 inline-block text-xs text-accent hover:underline"
                      >
                        Read full entry · {review.likes_count} likes
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </FadeIn>

        <FadeIn>
          <section>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              New members
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Readers who just joined.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              {(newMembers ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                (newMembers ?? []).map((member) => {
                  const name = member.display_name || member.username;
                  return (
                    <Link
                      key={member.id}
                      href={`/u/${member.username}`}
                      className="flex w-28 flex-col items-center gap-2 text-center"
                    >
                      <Avatar className="size-14 border border-border">
                        {member.avatar_url ? (
                          <AvatarImage src={member.avatar_url} alt={name} />
                        ) : null}
                        <AvatarFallback>
                          {name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs text-muted-foreground">
                        @{member.username}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </section>
        </FadeIn>
      </div>

      <SiteFooter />
    </div>
  );
}
