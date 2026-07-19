import { Activity } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { ActivityItem } from "@/components/feed/activity-item";
import type { FeedActivity } from "@/server/actions/feed";

export function ActivityFeed({
  items,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Follow readers or log something to fill your feed.",
}: {
  items: FeedActivity[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (!items.length) {
    return (
      <EmptyState
        icon={Activity}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="divide-y-0">
      {items.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}
