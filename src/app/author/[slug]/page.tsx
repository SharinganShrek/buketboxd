import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { createClient } from "@/lib/supabase/server";
import { formatRating } from "@/lib/utils";
import { getCurrentProfile } from "@/server/actions/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("authors")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();

  return { title: data?.name ?? "Author" };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: author } = await supabase
    .from("authors")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!author) notFound();

  const { data: workRows } = await supabase
    .from("work_authors")
    .select(
      `
      position,
      work:works (
        id,
        slug,
        title,
        cover_url,
        avg_rating,
        logs_count,
        first_publish_year
      )
    `,
    )
    .eq("author_id", author.id)
    .order("position", { ascending: true });

  const works = (workRows ?? [])
    .map((row) => (Array.isArray(row.work) ? row.work[0] : row.work))
    .filter(Boolean) as {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    avg_rating: number | string;
    logs_count: number;
    first_publish_year: number | null;
  }[];

  works.sort((a, b) => {
    const ay = a.first_publish_year ?? 0;
    const by = b.first_publish_year ?? 0;
    return by - ay;
  });

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

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 sm:px-6">
        <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative mx-auto size-36 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:mx-0">
            {author.photo_url ? (
              <Image
                src={author.photo_url}
                alt={author.name}
                fill
                className="object-cover"
                sizes="144px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-2xl font-display text-muted-foreground">
                {author.name.slice(0, 1)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {author.name}
            </h1>
            {author.ol_author_key ? (
              <a
                href={`https://openlibrary.org/authors/${author.ol_author_key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                Open Library profile
              </a>
            ) : null}
            {author.bio ? (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {author.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                No biography available yet.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Works
          </h2>
          {works.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No works logged yet"
              description="When someone logs a work by this author, it will show up here."
              className="py-12"
            />
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {works.map((work) => (
                <Link
                  key={work.id}
                  href={`/work/${work.slug}`}
                  className="group overflow-hidden rounded-xl border border-border bg-surface/40 transition-colors hover:border-accent/40"
                >
                  <div className="relative aspect-[2/3] bg-muted">
                    {work.cover_url ? (
                      <Image
                        src={work.cover_url}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width:768px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-medium">
                      {work.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {work.first_publish_year
                        ? `${work.first_publish_year} · `
                        : ""}
                      {formatRating(work.avg_rating)} · {work.logs_count} logs
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
