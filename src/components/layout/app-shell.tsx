import Link from "next/link";
import { Compass, Home, Plus, Search } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import {
  SiteHeader,
  type HeaderProfile,
} from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

const mobileNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/log/new", label: "Log", icon: Plus, primary: true },
  { href: "/search", label: "Search", icon: Search },
] as const;

export function AppShell({
  children,
  className,
  showFooter = true,
  profile = null,
}: {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
  profile?: HeaderProfile | null;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <SiteHeader profile={profile} />
      <main
        className={cn(
          "mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6 md:pb-10",
          className,
        )}
      >
        {children}
      </main>
      {showFooter ? <SiteFooter /> : null}

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const primary = "primary" in item && item.primary;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] transition-colors",
                    primary
                      ? "text-accent"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center",
                      primary &&
                        "mb-0.5 size-9 rounded-full bg-primary text-primary-foreground shadow-sm",
                    )}
                  >
                    <Icon className={cn("size-4", primary && "size-5")} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
