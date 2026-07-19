"use server";

import { z } from "zod";

import { fetchOpenGraph } from "@/server/services/opengraph";

const urlSchema = z.string().url();

export async function fetchMetadataFromUrl(url: string) {
  const parsed = urlSchema.safeParse(url.trim());
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Enter a valid URL",
      data: null,
    };
  }

  const og = await fetchOpenGraph(parsed.data);

  let siteName = og.siteName;
  if (!siteName) {
    try {
      siteName = new URL(parsed.data).hostname.replace(/^www\./, "");
    } catch {
      siteName = null;
    }
  }

  return {
    ok: true as const,
    error: null,
    data: {
      title: og.title ?? "",
      description: og.description ?? "",
      coverUrl: og.image ?? "",
      sourceName: siteName ?? "",
      authorName: "",
    },
  };
}
