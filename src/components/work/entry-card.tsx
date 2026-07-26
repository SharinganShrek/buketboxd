import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { Markdown } from "@/components/common/markdown";
import { ScoreRating } from "@/components/common/score-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function EntryCard({
  id,
  title,
  bodyMd,
  createdAt,
  likesCount,
  rating,
  author,
  workTitle,
  workSlug,
  showWorkLink = false,
}: {
  id: string;
  title?: string | null;
  bodyMd: string;
  createdAt: string;
  likesCount?: number;
  rating?: number | string | null;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  workTitle?: string;
  workSlug?: string;
  showWorkLink?: boolean;
}) {
  const name = author.display_name || author.username;
  const initials = name.slice(0, 2).toUpperCase();
  const ratingNum =
    rating === null || rating === undefined ? null : Number(rating);

  return (
    <article className="border-b border-border/70 py-6 last:border-0">
      <div className="flex items-start gap-3">
        <Link href={`/u/${author.username}`}>
          <Avatar className="size-10 border border-border">
            {author.avatar_url ? (
              <AvatarImage src={author.avatar_url} alt={name} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/u/${author.username}`}
              className="font-medium text-foreground hover:text-accent"
            >
              {name}
            </Link>
            <span className="text-sm text-muted-foreground">
              @{author.username}
            </span>
            <span className="text-sm text-muted-foreground">
              ·{" "}
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>

          {showWorkLink && workSlug && workTitle ? (
            <p className="mt-1 text-sm text-muted-foreground">
              on{" "}
              <Link
                href={`/work/${workSlug}`}
                className="text-foreground hover:text-accent"
              >
                {workTitle}
              </Link>
            </p>
          ) : null}

          {ratingNum ? (
            <div className="mt-2">
              <ScoreRating value={ratingNum} readOnly size="sm" showValue />
            </div>
          ) : null}

          {title ? (
            <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">
              <Link href={`/review/${id}`} className="hover:text-accent">
                {title}
              </Link>
            </h3>
          ) : null}

          <Markdown content={bodyMd} className="mt-3" />

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <Link href={`/review/${id}`} className="hover:text-accent">
              View entry
            </Link>
            {typeof likesCount === "number" ? (
              <span>{likesCount} likes</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
