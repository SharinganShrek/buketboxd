import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivityFeed } from "@/components/feed/activity-feed";
import { Button } from "@/components/ui/button";
import { getHomeFeed } from "@/server/actions/feed";
import { getCurrentProfile } from "@/server/actions/profile";

export const metadata = {
  title: "Home",
};

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const { items } = await getHomeFeed({ limit: 30 });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Home
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activity from people you follow — and you.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/log/new">Log a read</Link>
        </Button>
      </div>
      <ActivityFeed items={items} />
    </div>
  );
}
