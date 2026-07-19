"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/server/actions/profile";

export default function OnboardingPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await completeOnboarding({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Welcome to Buketboxd");
      router.push("/home");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Choose your handle
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is how other readers will find you. You can change it later in
        settings.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            required
            pattern="[a-z0-9_]{3,24}"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="reader_name"
          />
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and underscores. 3–24 characters.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving…" : "Continue"}
        </Button>
      </form>
    </div>
  );
}
