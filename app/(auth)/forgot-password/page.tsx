"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: String(form.get("email")) }),
      });
    } catch {
      /* always show success to avoid email enumeration */
    } finally {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="animate-fade-up text-center">
        <MailCheck size={40} className="mx-auto text-success" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tighter2">
          Check your email
        </h1>
        <p className="mt-2 text-sm text-muted">
          If an account exists for that email, we&apos;ve sent a password reset
          link.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-ink underline-offset-4 hover:underline"
        >
          Back to login →
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-2xl font-semibold tracking-tighter2">
        Reset your password
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <Field label="Email">
          <Input name="email" type="email" required placeholder="you@company.com" autoFocus />
        </Field>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
          {!loading && <ArrowRight size={16} />}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
