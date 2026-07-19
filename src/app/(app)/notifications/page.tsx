import { Bell } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";

export const metadata = {
  title: "Notifications",
};

export default function NotificationsPage() {
  return (
    <EmptyState
      icon={Bell}
      title="Coming in v2"
      description="Notifications for follows, likes, and comments will land here."
    />
  );
}
