"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn, formatRating } from "@/lib/utils";

const STEPS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;

type StarRatingProps = {
  value?: number | null;
  onChange?: (value: number) => void;
  /** When true (or when onChange is omitted), stars are display-only. */
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-6",
} as const;

function clampRating(value: number) {
  const stepped = Math.round(value * 2) / 2;
  return Math.min(5, Math.max(0.5, stepped));
}

export function StarRating({
  value = null,
  onChange,
  readOnly,
  size = "md",
  showValue = false,
  className,
  label = "Rating",
}: StarRatingProps) {
  const interactive = Boolean(onChange) && !readOnly;
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;
  const iconSize = sizeMap[size];

  function select(next: number) {
    if (!interactive || !onChange) return;
    onChange(clampRating(next));
  }

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      onMouseLeave={() => setHover(null)}
    >
      <div
        role={interactive ? "slider" : "img"}
        aria-label={label}
        aria-valuemin={interactive ? 0.5 : undefined}
        aria-valuemax={interactive ? 5 : undefined}
        aria-valuenow={interactive ? value ?? undefined : undefined}
        aria-valuetext={
          value ? `${formatRating(value)} out of 5` : "No rating"
        }
        tabIndex={interactive ? 0 : undefined}
        className={cn(
          "flex items-center",
          interactive && "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm",
        )}
        onKeyDown={(event) => {
          if (!interactive) return;
          const current = value ?? 0;
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            select(Math.min(5, (current || 0) + 0.5));
          }
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            select(Math.max(0.5, current - 0.5 || 0.5));
          }
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const fill =
            display >= star ? 1 : display >= star - 0.5 ? 0.5 : 0;

          return (
            <span key={star} className="relative inline-flex">
              <Star
                className={cn(iconSize, "text-muted-foreground/40")}
                strokeWidth={1.5}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className={cn(iconSize, "fill-rating text-rating")}
                  strokeWidth={1.5}
                />
              </span>
              {interactive ? (
                <>
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 w-1/2"
                    aria-label={`${star - 0.5} stars`}
                    onMouseEnter={() => setHover(star - 0.5)}
                    onFocus={() => setHover(star - 0.5)}
                    onClick={() => select(star - 0.5)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 w-1/2"
                    aria-label={`${star} stars`}
                    onMouseEnter={() => setHover(star)}
                    onFocus={() => setHover(star)}
                    onClick={() => select(star)}
                  />
                </>
              ) : null}
            </span>
          );
        })}
      </div>

      {showValue ? (
        <span className="min-w-6 text-sm tabular-nums text-muted-foreground">
          {formatRating(value)}
        </span>
      ) : null}

      {interactive ? (
        <span className="sr-only">
          Available steps: {STEPS.join(", ")}
        </span>
      ) : null}
    </div>
  );
}
