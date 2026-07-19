import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { StarRating } from "@/components/common/star-rating";
import { Button } from "@/components/ui/button";
import { formatRating } from "@/lib/utils";

export function ArticleHero({
  title,
  slug,
  url,
  coverUrl,
  avgRating,
  ratingsCount,
  logsCount,
  sourceName,
  authors,
}: {
  title: string;
  slug: string;
  url: string;
  coverUrl: string | null;
  avgRating: number | string;
  ratingsCount: number;
  logsCount: number;
  sourceName?: string | null;
  authors?: string[];
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="absolute inset-0">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-surface via-muted to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      </div>

      <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[160px_1fr]">
        <div className="relative mx-auto aspect-[3/4] w-36 overflow-hidden rounded-lg border border-border bg-muted shadow-lg sm:w-40">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="160px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">
              No cover
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end">
          {sourceName ? (
            <p className="text-sm uppercase tracking-wide text-accent">
              {sourceName}
            </p>
          ) : null}
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          {authors?.length ? (
            <p className="mt-2 text-sm text-muted-foreground">
              by {authors.join(", ")}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <StarRating
                value={Number(avgRating) || null}
                readOnly
                size="sm"
              />
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatRating(avgRating)} · {ratingsCount} ratings · {logsCount}{" "}
                logs
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/log/new?url=${encodeURIComponent(url)}`}>
                Log this
              </Link>
            </Button>
            <Button asChild variant="outline">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Open original
              </a>
            </Button>
            <span className="sr-only">{slug}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
