"use client";

import { cn, formatRating } from "@/lib/utils";

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

type ScoreRatingProps = {
  value?: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-10 text-base",
} as const;

export function ScoreRating({
  value = null,
  onChange,
  readOnly,
  size = "md",
  showValue = false,
  className,
  label = "Rating",
}: ScoreRatingProps) {
  const interactive = Boolean(onChange) && !readOnly;

  if (readOnly || !interactive) {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-md border border-border bg-surface/60 font-medium tabular-nums text-foreground",
            sizeMap[size],
          )}
          aria-label={value ? `${formatRating(value)} out of 10` : "No rating"}
        >
          {formatRating(value)}
        </span>
        {showValue ? (
          <span className="text-sm text-muted-foreground">/10</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-1.5"
      >
        {SCORES.map((score) => {
          const selected = value === score;
          return (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${score} out of 10`}
              onClick={() => onChange?.(score)}
              className={cn(
                "inline-flex items-center justify-center rounded-md border font-medium tabular-nums transition-colors",
                sizeMap[size],
                selected
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface/40 text-muted-foreground hover:border-accent/50 hover:text-foreground",
              )}
            >
              {score}
            </button>
          );
        })}
      </div>
      {showValue ? (
        <p className="text-sm text-muted-foreground">
          {value ? (
            <>
              Selected:{" "}
              <span className="font-medium text-foreground tabular-nums">
                {formatRating(value)}/10
              </span>
            </>
          ) : (
            "Pick a score from 1 to 10"
          )}
        </p>
      ) : null}
    </div>
  );
}
