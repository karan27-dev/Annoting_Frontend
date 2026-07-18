"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { GoogleSignIn, OrDivider } from "@/components/auth/google-signin";
import { register, login, HOME_FOR_ROLE } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState<{ email: string; password: string } | null>(
    null,
  );
  const [registered, setRegistered] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setExists(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      await register({
        email,
        password,
        full_name: String(form.get("full_name")),
      });
      // In dev (no email service) the account is usable immediately — try logging in.
      try {
        const user = await login(email, password);
        router.push(HOME_FOR_ROLE[user.role] ?? "/dashboard");
        return;
      } catch {
        setRegistered(true);
      }
    } catch (err) {
      // Already have an account? Offer a one-click log-in with what they typed.
      if (
        err instanceof ApiError &&
        err.message.toLowerCase().includes("already registered")
      ) {
        setExists({ email, password });
      } else if (err instanceof Error) {
        setError(err.message || "Could not create your account. Try again.");
      } else {
        setError("Could not create your account. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function logInExisting() {
    if (!exists) return;
    setLoading(true);
    setError(null);
    try {
      const user = await login(exists.email, exists.password);
      router.push(HOME_FOR_ROLE[user.role] ?? "/dashboard");
    } catch {
      setError("That password doesn't match this account.");
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="animate-fade-up text-center">
        <MailCheck size={40} className="mx-auto text-success" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tighter2">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm text-muted">
          We sent a verification link to your email. Click it to activate your
          account, then log in.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          Go to login →
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold tracking-tighter2">
        Start a project
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Create your client account. It&apos;s free to set up a project and get a
        quote.
      </p>

      <div className="mt-7">
        <GoogleSignIn label="Sign up with Google" />
        <OrDivider />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Name">
          <Input name="full_name" required placeholder="Karan Mehta" autoFocus />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required placeholder="you@email.com" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input name="password" type="password" required minLength={8} placeholder="••••••••" />
        </Field>

        {exists ? (
          <div className="rounded-xl border border-line bg-surface p-4 text-sm">
            <p className="font-medium">This email already has an account.</p>
            <p className="mt-0.5 text-muted">
              Log in with your password to continue.
            </p>
            <Button
              type="button"
              className="mt-3 w-full"
              disabled={loading}
              onClick={logInExisting}
            >
              {loading ? "Logging in…" : "Log in instead"}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </div>
        ) : (
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight size={16} />}
          </Button>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
