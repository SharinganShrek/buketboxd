import { redirect } from "next/navigation";

import { LogComposer } from "@/components/log/log-composer";
import { getCurrentProfile } from "@/server/actions/profile";

export const metadata = {
  title: "Log a read",
};

export default async function NewLogPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const { url } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Log a read
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a URL, add your rating and thoughts, and keep your diary going.
        </p>
      </div>
      <LogComposer initialUrl={url ?? ""} />
    </div>
  );
}
