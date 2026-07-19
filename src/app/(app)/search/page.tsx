import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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

  let articles: {
    id: string;
    slug: string;
    title: string;
    cover_url: string | null;
    avg_rating: number | string;
    logs_count: number;
  }[] = [];
  let users: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  }[] = [];

  if (query) {
    const pattern = `%${query.replace(/[%_]/g, "")}%`;
    const [{ data: articleRows }, { data: userRows }] = await Promise.all([
      supabase
        .from("articles")
        .select("id, slug, title, cover_url, avg_rating, logs_count")
        .ilike("title", pattern)
        .limit(20),
      supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, bio")
        .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
        .limit(20),
    ]);
    articles = articleRows ?? [];
    users = userRows ?? [];
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find articles and readers.
        </p>
        <form className="mt-6 max-w-xl">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search titles, URLs, usernames…"
            className="h-11"
          />
        </form>
      </div>

      {!query ? (
        <EmptyState
          icon={Search}
          title="Search Buketboxd"
          description="Type a query above to find articles and people."
        />
      ) : articles.length === 0 && users.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results"
          description={`Nothing matched “${query}”.`}
        />
      ) : (
        <>
          <section>
            <h2 className="font-display text-xl font-semibold">Articles</h2>
            {articles.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No articles found.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {articles.map((article) => (
                  <li key={article.id}>
                    <Link
                      href={`/article/${article.slug}`}
                      className="flex gap-3 rounded-lg border border-border/60 bg-surface/30 p-3 transition-colors hover:border-accent/40"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {article.cover_url ? (
                          <Image
                            src={article.cover_url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRating(article.avg_rating)} ·{" "}
                          {article.logs_count} logs
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">People</h2>
            {users.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No people found.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
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
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
