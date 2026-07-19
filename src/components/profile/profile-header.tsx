import Link from "next/link";

import { FollowButton } from "@/components/social/follow-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ProfileHeader({
  profile,
  stats,
  isOwn,
  isFollowing,
  showFollow,
}: {
  profile: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  stats: {
    logs: number;
    reviews: number;
    followers: number;
    following: number;
  };
  isOwn?: boolean;
  isFollowing?: boolean;
  showFollow?: boolean;
}) {
  const name = profile.display_name || profile.username;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        <Avatar className="size-20 border border-border sm:size-24">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={name} />
          ) : null}
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {name}
          </h1>
          <p className="mt-1 text-muted-foreground">@{profile.username}</p>
          {profile.bio ? (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/90">
              {profile.bio}
            </p>
          ) : null}

          <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <div>
              <dt className="inline">Logs </dt>
              <dd className="inline font-medium text-foreground">
                {stats.logs}
              </dd>
            </div>
            <div>
              <dt className="inline">Reviews </dt>
              <dd className="inline font-medium text-foreground">
                {stats.reviews}
              </dd>
            </div>
            <div>
              <dt className="inline">Followers </dt>
              <dd className="inline font-medium text-foreground">
                {stats.followers}
              </dd>
            </div>
            <div>
              <dt className="inline">Following </dt>
              <dd className="inline font-medium text-foreground">
                {stats.following}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex gap-2">
        {isOwn ? (
          <Link
            href="/settings"
            className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs font-medium transition-colors hover:bg-muted"
          >
            Edit profile
          </Link>
        ) : null}
        {showFollow && !isOwn ? (
          <FollowButton
            userId={profile.id}
            initialFollowing={Boolean(isFollowing)}
          />
        ) : null}
      </div>
    </header>
  );
}
