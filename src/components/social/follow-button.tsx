"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/server/actions/follow";

export function FollowButton({
  userId,
  initialFollowing = false,
}: {
  userId: string;
  initialFollowing?: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const next = !following;
      setFollowing(next);

      const result = next
        ? await followUser(userId)
        : await unfollowUser(userId);

      if (!result.ok) {
        setFollowing(!next);
        toast.error(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      size="sm"
      disabled={pending}
      onClick={toggle}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
