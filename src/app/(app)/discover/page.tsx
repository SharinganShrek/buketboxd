import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatRating } from "@/lib/utils";
import { Compass } from "lucide-react";

export const metadata = {
  title: "Discover",
};

async function ArticleShelf({
  title,
  description,
  articles,
}: {
  title: string;
  description: string;
  articles: {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    avg_rating: number | string;
    logs_count: number;
  }[];
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {articles.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="group overflow-hidden rounded-xl border border-border bg-surface/40 transition-colors hover:border-accent/40"
            >
              <div className="relative aspect-[16/10] bg-muted">
                {article.cover_url ? (
                  <Image
                    src={article.cover_url}
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
                  {article.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRating(article.avg_rating)} · {article.logs_count} logs
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function DiscoverPage() {
  const supabase = await createClient();

  const [{ data: recent }, { data: highest }, { data: popular }] =
    await Promise.all([
      supabase
        .from("articles")
        .select("id, slug, title, cover_url, avg_rating, logs_count")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("articles")
        .select("id, slug, title, cover_url, avg_rating, logs_count")
        .gt("ratings_count", 0)
        .order("avg_rating", { ascending: false })
        .limit(8),
      supabase
        .from("articles")
        .select("id, slug, title, cover_url, avg_rating, logs_count")
        .order("logs_count", { ascending: false })
        .limit(8),
    ]);

  const empty =
    !(recent?.length || highest?.length || popular?.length);

  if (empty) {
    return (
      <EmptyState
        icon={Compass}
        title="Discover is quiet"
        description="Log a few articles and shelves will start filling up."
      />
    );
  }

  return (
    <div className="space-y-14">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Discover
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse recently added, highest rated, and popular reads.
        </p>
      </div>

      <ArticleShelf
        title="Recently added"
        description="Fresh pieces just logged into the catalog."
        articles={recent ?? []}
      />
      <ArticleShelf
        title="Highest rated"
        description="Community favorites by average rating."
        articles={highest ?? []}
      />
      <ArticleShelf
        title="Popular"
        description="Most logged articles."
        articles={popular ?? []}
      />
    </div>
  );
}
