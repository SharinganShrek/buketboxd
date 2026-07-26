import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { EntryCard } from "@/components/work/entry-card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/server/actions/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `
      title,
      work:works!reviews_work_id_fkey ( title ),
      user:profiles!reviews_user_id_fkey ( username )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  const work = Array.isArray(data?.work) ? data?.work[0] : data?.work;
  const user = Array.isArray(data?.user) ? data?.user[0] : data?.user;
  const headline = data?.title || work?.title;

  return {
    title: headline
      ? `${headline}${user ? ` by @${user.username}` : ""}`
      : "Entry",
  };
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: review } = await supabase
    .from("reviews")
    .select(
      `
      id,
      title,
      body_md,
      likes_count,
      created_at,
      user:profiles!reviews_user_id_fkey ( username, display_name, avatar_url ),
      work:works!reviews_work_id_fkey ( slug, title ),
      log:logs!logs_review_id_fkey ( rating )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!review) notFound();

  const user = Array.isArray(review.user) ? review.user[0] : review.user;
  const work = Array.isArray(review.work) ? review.work[0] : review.work;
  const log = Array.isArray(review.log) ? review.log[0] : review.log;

  if (!user) notFound();

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

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        {work ? (
          <p className="mb-6 text-sm text-muted-foreground">
            Entry on{" "}
            <Link
              href={`/work/${work.slug}`}
              className="font-medium text-foreground hover:text-accent"
            >
              {work.title}
            </Link>
          </p>
        ) : null}

        <EntryCard
          id={review.id}
          title={review.title}
          bodyMd={review.body_md}
          createdAt={review.created_at}
          likesCount={review.likes_count}
          rating={log?.rating}
          author={user}
          workTitle={work?.title}
          workSlug={work?.slug}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
