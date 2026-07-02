"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { register, login, HOME_FOR_ROLE } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    try {
      await register({
        email,
        password,
        full_name: String(form.get("full_name")),
        company_name: String(form.get("company_name")),
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
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create your account. Try again.",
      );
    } finally {
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

      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <Field label="Full name">
          <Input name="full_name" required placeholder="Karan Mehta" autoFocus />
        </Field>
        <Field label="Company name">
          <Input name="company_name" placeholder="Acme Vision Inc." />
        </Field>
        <Field label="Work email">
          <Input name="email" type="email" required placeholder="you@company.com" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input name="password" type="password" required minLength={8} placeholder="••••••••" />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
          {!loading && <ArrowRight size={16} />}
        </Button>
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
