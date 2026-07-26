"use client";

import type { User } from "@supabase/supabase-js";
import {
  BookOpen,
  Compass,
  Home,
  LogOut,
  Plus,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { signOut } from "@/server/actions/auth";

const navLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
] as const;

export type HeaderProfile = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

function getDisplayName(user: User | null, profile?: HeaderProfile | null) {
  if (profile?.display_name) return profile.display_name;
  if (profile?.username) return profile.username;
  return (
    (user?.user_metadata?.display_name as string | undefined) ||
    (user?.user_metadata?.username as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Reader"
  );
}

function getUsername(user: User | null, profile?: HeaderProfile | null) {
  return (
    profile?.username ||
    (user?.user_metadata?.username as string | undefined) ||
    null
  );
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function SiteHeader({
  profile: serverProfile = null,
}: {
  profile?: HeaderProfile | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(Boolean(serverProfile));
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (serverProfile) {
      setReady(true);
      return;
    }

    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [serverProfile]);

  const isAuthed = Boolean(serverProfile) || Boolean(user);
  const username = getUsername(user, serverProfile);
  const displayName = getDisplayName(user, serverProfile);
  const avatarUrl =
    serverProfile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined) ||
    null;

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
      setUser(null);
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href={isAuthed ? "/home" : "/"}
          className="font-display text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-accent"
        >
          Buketboxd
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/log/new">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Log</span>
            </Link>
          </Button>

          {!ready ? (
            <div className="size-9 animate-pulse rounded-full bg-muted" />
          ) : isAuthed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Open account menu"
                >
                  <Avatar className="size-9 border border-border">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{displayName}</span>
                    {username ? (
                      <span className="text-xs text-muted-foreground">
                        @{username}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {user?.email}
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={username ? `/u/${username}` : "/settings"}>
                    <UserRound />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/log/new">
                    <BookOpen />
                    New entry
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={pending}
                  onClick={handleSignOut}
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
