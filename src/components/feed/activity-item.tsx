import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

import { StarRating } from "@/components/common/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRating } from "@/lib/utils";
import type { FeedActivity } from "@/server/actions/feed";

function activityVerb(type: FeedActivity["type"]) {
  switch (type) {
    case "logged":
      return "logged";
    case "rated":
      return "rated";
    case "reviewed":
      return "reviewed";
    case "followed":
      return "followed someone";
    case "liked_review":
      return "liked a review";
    case "created_list":
      return "created a list";
    default:
      return "was active";
  }
}

export function ActivityItem({ activity }: { activity: FeedActivity }) {
  const actor = activity.actor;
  const article = activity.article;
  const name = actor?.display_name || actor?.username || "Someone";
  const initials = name.slice(0, 2).toUpperCase();
  const rating =
    activity.type === "rated" && activity.meta && "rating" in activity.meta
      ? Number(activity.meta.rating)
      : null;

  return (
    <article className="flex gap-3 border-b border-border/70 py-5 last:border-0">
      <Link
        href={actor ? `/u/${actor.username}` : "#"}
        className="shrink-0"
      >
        <Avatar className="size-10 border border-border">
          {actor?.avatar_url ? (
            <AvatarImage src={actor.avatar_url} alt={name} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">
          {actor ? (
            <Link
              href={`/u/${actor.username}`}
              className="font-medium text-foreground hover:text-accent"
            >
              {name}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{name}</span>
          )}{" "}
          {activityVerb(activity.type)}
          {article ? (
            <>
              {" "}
              <Link
                href={`/article/${article.slug}`}
                className="font-medium text-foreground hover:text-accent"
              >
                {article.title}
              </Link>
            </>
          ) : null}
          <span className="text-muted-foreground/80">
            {" · "}
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
            })}
          </span>
        </p>

        {rating ? (
          <div className="mt-2">
            <StarRating value={rating} readOnly size="sm" showValue />
          </div>
        ) : null}

        {article ? (
          <Link
            href={`/article/${article.slug}`}
            className="mt-3 flex gap-3 rounded-lg border border-border/60 bg-surface/40 p-3 transition-colors hover:border-accent/40"
          >
            {article.cover_url ? (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                <Image
                  src={article.cover_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized
                />
              </div>
            ) : (
              <div className="size-14 shrink-0 rounded-md bg-muted" />
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {article.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatRating(article.avg_rating)} avg · {article.logs_count}{" "}
                logs
              </p>
            </div>
          </Link>
        ) : null}

        {activity.type === "reviewed" ? (
          <Link
            href={`/review/${activity.entity_id}`}
            className="mt-2 inline-block text-sm text-accent hover:underline"
          >
            Read review
          </Link>
        ) : null}
      </div>
    </article>
  );
}
