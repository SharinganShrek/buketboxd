import { notFound, redirect } from "next/navigation";

import { upsertAuthorFromOpenLibrary } from "@/server/services/works";

export default async function OpenLibraryAuthorRedirectPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const { author } = await upsertAuthorFromOpenLibrary({ olAuthorKey: key });
  if (!author) notFound();
  redirect(`/author/${author.slug}`);
}
