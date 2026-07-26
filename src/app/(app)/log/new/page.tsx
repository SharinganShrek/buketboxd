import { redirect } from "next/navigation";

import { LogComposer } from "@/components/log/log-composer";
import { getCurrentProfile } from "@/server/actions/profile";

export const metadata = {
  title: "New entry",
};

export default async function NewLogPage({
  searchParams,
}: {
  searchParams: Promise<{ work?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const { work } = await searchParams;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          New entry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find a work on Open Library, rate it, and write what you thought.
        </p>
      </div>
      <LogComposer initialOlWorkKey={work ?? ""} />
    </div>
  );
}
