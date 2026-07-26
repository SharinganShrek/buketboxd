import { notFound, redirect } from "next/navigation";

import { upsertWorkFromOpenLibrary } from "@/server/services/works";

export default async function OpenLibraryWorkRedirectPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const { work } = await upsertWorkFromOpenLibrary({ olWorkKey: key });
  if (!work) notFound();
  redirect(`/work/${work.slug}`);
}
