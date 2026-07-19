import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { Markdown } from "@/components/common/markdown";
import { Spoiler } from "@/components/common/spoiler";
import { StarRating } from "@/components/common/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ReviewCard({
  id,
  bodyMd,
  hasSpoilers,
  createdAt,
  likesCount,
  rating,
  author,
  articleTitle,
  articleSlug,
  showArticleLink = false,
}: {
  id: string;
  bodyMd: string;
  hasSpoilers: boolean;
  createdAt: string;
  likesCount?: number;
  rating?: number | string | null;
  author: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  articleTitle?: string;
  articleSlug?: string;
  showArticleLink?: boolean;
}) {
  const name = author.display_name || author.username;
  const initials = name.slice(0, 2).toUpperCase();
  const ratingNum =
    rating === null || rating === undefined ? null : Number(rating);

  const body = (
    <Markdown content={bodyMd} className="mt-3" />
  );

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

          {showArticleLink && articleSlug && articleTitle ? (
            <p className="mt-1 text-sm text-muted-foreground">
              on{" "}
              <Link
                href={`/article/${articleSlug}`}
                className="text-foreground hover:text-accent"
              >
                {articleTitle}
              </Link>
            </p>
          ) : null}

          {ratingNum ? (
            <div className="mt-2">
              <StarRating value={ratingNum} readOnly size="sm" showValue />
            </div>
          ) : null}

          {hasSpoilers ? <Spoiler className="mt-3">{body}</Spoiler> : body}

          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
            <Link href={`/review/${id}`} className="hover:text-accent">
              View review
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
