import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 text-center">
        <Link
          href="/"
          className="font-display text-3xl font-semibold tracking-tight text-foreground hover:text-accent"
        >
          Buketboxd
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back. Pick up where you left off.
        </p>
      </div>
      <AuthForm mode="login" />
      <p className="mt-8 text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
