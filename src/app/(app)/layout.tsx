import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/server/actions/profile";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <AppShell
      profile={
        profile
          ? {
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
