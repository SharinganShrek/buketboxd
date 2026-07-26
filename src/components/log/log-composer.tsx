"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, X } from "lucide-react";

import { ScoreRating } from "@/components/common/score-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLog } from "@/server/actions/log";
import {
  searchWorksAction,
  type WorkSearchResult,
} from "@/server/actions/openlibrary";

export function LogComposer({
  initialOlWorkKey = "",
}: {
  initialOlWorkKey?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkSearchResult[]>([]);
  const [selected, setSelected] = useState<WorkSearchResult | null>(null);
  const [title, setTitle] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [searching, startSearch] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function runSearch(value: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    searchTimer.current = setTimeout(() => {
      startSearch(async () => {
        const result = await searchWorksAction(q);
        if (!result.ok) {
          toast.error(result.error ?? "Search failed");
          setResults([]);
          return;
        }
        setResults(result.results);
      });
    }, 350);
  }

  useEffect(() => {
    if (!initialOlWorkKey) return;
    startSearch(async () => {
      const result = await searchWorksAction(initialOlWorkKey);
      if (result.ok && result.results[0]) {
        setSelected(result.results[0]);
        setQuery(result.results[0].title);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate from key once
  }, [initialOlWorkKey]);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selected) {
      toast.error("Select a work from Open Library");
      return;
    }
    if (!rating) {
      toast.error("Pick a rating out of 10");
      return;
    }
    if (!body.trim()) {
      toast.error("Write what you thought about the work");
      return;
    }

    startSubmit(async () => {
      const result = await createLog({
        olWorkKey: selected.olWorkKey,
        title: title.trim(),
        rating,
        body: body.trim(),
      });

      if (!result.ok) {
        toast.error(result.error ?? "Failed to save log");
        return;
      }

      toast.success("Logged!");
      router.push(`/work/${result.workSlug}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="work-search">Work</Label>
        {selected ? (
          <div className="flex gap-3 rounded-xl border border-border bg-surface/40 p-3">
            <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-md bg-muted">
              {selected.coverUrl ? (
                <Image
                  src={selected.coverUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="56px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{selected.title}</p>
              {selected.authors.length ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.authors.join(", ")}
                </p>
              ) : null}
              {selected.firstPublishYear ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selected.firstPublishYear}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear selection"
              onClick={() => {
                setSelected(null);
                setResults([]);
              }}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="work-search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  runSearch(e.target.value);
                }}
                placeholder="Search Open Library by title or author…"
                className="pl-9"
                autoComplete="off"
              />
            </div>
            {searching ? (
              <p className="text-sm text-muted-foreground">Searching…</p>
            ) : null}
            {results.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto rounded-xl border border-border bg-surface/40">
                {results.map((work) => (
                  <li key={work.olWorkKey}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(work);
                        setQuery(work.title);
                        setResults([]);
                      }}
                      className="flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded bg-muted">
                        {work.coverUrl ? (
                          <Image
                            src={work.coverUrl}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {work.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {work.authors.join(", ") || "Unknown author"}
                          {work.firstPublishYear
                            ? ` · ${work.firstPublishYear}`
                            : ""}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>Rating /10</Label>
        <ScoreRating value={rating} onChange={setRating} showValue />
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry-title">
          Title <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="entry-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A short headline for your entry"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">What did you think?</Label>
        <Textarea
          id="body"
          rows={8}
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Your thoughts on this work… Markdown supported."
        />
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full sm:w-auto"
      >
        {submitting ? "Saving…" : "Save entry"}
      </Button>
    </form>
  );
}
