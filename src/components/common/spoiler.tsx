"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Spoiler({
  children,
  className,
  label = "Contains spoilers",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "transition-[filter,opacity] duration-200",
          !revealed && "select-none blur-sm opacity-60",
        )}
        aria-hidden={!revealed}
      >
        {children}
      </div>

      {!revealed ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/40 backdrop-blur-[1px]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2 shadow-sm"
            onClick={() => setRevealed(true)}
          >
            <EyeOff className="size-4" />
            {label}
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => setRevealed(false)}
          >
            <Eye className="size-4" />
            Hide spoilers
          </Button>
        </div>
      )}
    </div>
  );
}
