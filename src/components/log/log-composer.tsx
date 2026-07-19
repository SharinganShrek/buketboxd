"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { StarRating } from "@/components/common/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLog } from "@/server/actions/log";
import { fetchMetadataFromUrl } from "@/server/actions/metadata";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export function LogComposer({ initialUrl = "" }: { initialUrl?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [readAt, setReadAt] = useState(todayISODate());
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [tags, setTags] = useState("");
  const [readingMinutes, setReadingMinutes] = useState("");
  const [fetchingMeta, startFetchMeta] = useTransition();
  const [submitting, startSubmit] = useTransition();

  function autofill(targetUrl = url) {
    if (!targetUrl.trim()) {
      toast.error("Paste an article URL first");
      return;
    }

    startFetchMeta(async () => {
      const result = await fetchMetadataFromUrl(targetUrl);
      if (!result.ok || !result.data) {
        toast.error(result.error ?? "Could not fetch metadata");
        return;
      }

      if (result.data.title) setTitle(result.data.title);
      if (result.data.sourceName) setSourceName(result.data.sourceName);
      if (result.data.coverUrl) setCoverUrl(result.data.coverUrl);
      if (result.data.authorName) setAuthorName(result.data.authorName);
      toast.success("Metadata loaded");
    });
  }

  useEffect(() => {
    if (initialUrl) {
      autofill(initialUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount with initial URL
  }, [initialUrl]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    startSubmit(async () => {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const result = await createLog({
        url,
        title,
        authorName: authorName || "",
        sourceName: sourceName || "",
        coverUrl: coverUrl || "",
        readAt,
        rating,
        review: review || "",
        hasSpoilers,
        readingMinutes: readingMinutes
          ? Number.parseInt(readingMinutes, 10)
          : null,
        tags: tagList,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Failed to save log");
        return;
      }

      toast.success("Logged!");
      router.push(`/article/${result.articleSlug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="url">Article URL</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="url"
            type="url"
            required
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => {
              if (url && !title) autofill(url);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            disabled={fetchingMeta}
            onClick={() => autofill(url)}
          >
            {fetchingMeta ? "Fetching…" : "Autofill"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Publication"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover">Cover image URL</Label>
        <Input
          id="cover"
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="readAt">Read on</Label>
          <Input
            id="readAt"
            type="date"
            required
            value={readAt}
            onChange={(e) => setReadAt(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minutes">Reading minutes</Label>
          <Input
            id="minutes"
            type="number"
            min={1}
            value={readingMinutes}
            onChange={(e) => setReadingMinutes(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rating</Label>
        <StarRating value={rating} onChange={setRating} showValue />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review">Review</Label>
        <Textarea
          id="review"
          rows={6}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="What stayed with you? Markdown supported."
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={hasSpoilers}
            onChange={(e) => setHasSpoilers(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Contains spoilers
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="essay, tech, politics (comma-separated)"
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? "Saving…" : "Log this read"}
      </Button>
    </form>
  );
}
