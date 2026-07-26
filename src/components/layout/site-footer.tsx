import Link from "next/link";

const footerLinks = [
  { href: "/discover", label: "Discover" },
  { href: "/search", label: "Search" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm space-y-2">
          <p className="font-display text-lg font-semibold tracking-tight">
            Buketboxd
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Your diary for the works you read — rate them, write about them,
            and follow fellow readers.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} Buketboxd</span>
          <span>Read. Rate. Remember.</span>
        </div>
      </div>
    </footer>
  );
}
