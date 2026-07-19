export type OpenGraphResult = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

const EMPTY: OpenGraphResult = {
  title: null,
  description: null,
  image: null,
  siteName: null,
};

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractTitle(html: string): string | null {
  const og = extractMeta(html, "og:title");
  if (og) return og;
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function resolveUrl(base: string, maybeRelative: string | null): string | null {
  if (!maybeRelative) return null;
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

export async function fetchOpenGraph(url: string): Promise<OpenGraphResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BuketboxdBot/1.0; +https://buketboxd.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeout);

    if (!response.ok) return EMPTY;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xml")) {
      return EMPTY;
    }

    const html = (await response.text()).slice(0, 250_000);

    return {
      title: extractTitle(html),
      description:
        extractMeta(html, "og:description") ??
        extractMeta(html, "description"),
      image: resolveUrl(
        url,
        extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image"),
      ),
      siteName: extractMeta(html, "og:site_name"),
    };
  } catch {
    return EMPTY;
  }
}
