"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { GoogleSignIn, OrDivider } from "@/components/auth/google-signin";
import { login, HOME_FOR_ROLE } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const user = await login(
        String(form.get("email")),
        String(form.get("password")),
      );
      router.push(HOME_FOR_ROLE[user.role] ?? "/dashboard");
    } catch {
      setError("Incorrect email or password.");
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold tracking-tighter2">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">
        Log in to your Annoting workspace.
      </p>

      <div className="mt-7">
        <GoogleSignIn label="Continue with Google" />
        <OrDivider />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email">
          <Input name="email" type="email" required placeholder="you@email.com" autoFocus />
        </Field>
        <Field label="Password">
          <Input name="password" type="password" required placeholder="••••••••" />
        </Field>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
          {!loading && <ArrowRight size={16} />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-medium text-ink underline-offset-4 hover:underline">
          Create a client account
        </Link>
      </p>
    </div>
  );
}
