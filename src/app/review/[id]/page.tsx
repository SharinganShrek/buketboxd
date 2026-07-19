import Link from "next/link";
import { notFound } from "next/navigation";

import { ReviewCard } from "@/components/article/review-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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
      article:articles!reviews_article_id_fkey ( title ),
      user:profiles!reviews_user_id_fkey ( username )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  const article = Array.isArray(data?.article)
    ? data?.article[0]
    : data?.article;
  const user = Array.isArray(data?.user) ? data?.user[0] : data?.user;

  return {
    title: article?.title
      ? `Review of ${article.title}${user ? ` by @${user.username}` : ""}`
      : "Review",
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
      body_md,
      has_spoilers,
      likes_count,
      created_at,
      user:profiles!reviews_user_id_fkey ( username, display_name, avatar_url ),
      article:articles!reviews_article_id_fkey ( slug, title ),
      log:logs!logs_review_id_fkey ( rating )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!review) notFound();

  const user = Array.isArray(review.user) ? review.user[0] : review.user;
  const article = Array.isArray(review.article)
    ? review.article[0]
    : review.article;
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
        {article ? (
          <p className="mb-6 text-sm text-muted-foreground">
            Review of{" "}
            <Link
              href={`/article/${article.slug}`}
              className="font-medium text-foreground hover:text-accent"
            >
              {article.title}
            </Link>
          </p>
        ) : null}

        <ReviewCard
          id={review.id}
          bodyMd={review.body_md}
          hasSpoilers={review.has_spoilers}
          createdAt={review.created_at}
          likesCount={review.likes_count}
          rating={log?.rating}
          author={user}
          articleTitle={article?.title}
          articleSlug={article?.slug}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
