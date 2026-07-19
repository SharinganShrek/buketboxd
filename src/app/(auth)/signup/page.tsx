import Link from "next/link";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign up",
};

export default function SignupPage() {
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
          Start your reading diary in a minute.
        </p>
      </div>
      <AuthForm mode="signup" />
      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
