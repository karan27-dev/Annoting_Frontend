"use client";

// "Continue with Google" using Google Identity Services. When
// NEXT_PUBLIC_GOOGLE_CLIENT_ID is set it renders Google's official button and
// exchanges the returned ID token for an Annoting session. Without it, a clear
// fallback button explains what's missing (so the layout never looks broken).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { googleAuth, HOME_FOR_ROLE } from "@/lib/auth";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
  }
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export function GoogleSignIn({ label = "Continue with Google" }: { label?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    function init() {
      if (cancelled || !window.google || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          try {
            const user = await googleAuth(resp.credential);
            router.push(HOME_FOR_ROLE[user.role] ?? "/dashboard");
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Google sign-in failed");
          }
        },
      });
      window.google.accounts.id.renderButton(ref.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "center",
        width: ref.current.offsetWidth || 320,
      });
    }

    if (window.google) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = init;
      document.head.appendChild(s);
    }
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!CLIENT_ID) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setErr(err ? null : "info")}
          className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line bg-elevated py-3 text-sm font-medium text-ink transition-colors hover:bg-surface"
        >
          <GoogleG />
          {label}
        </button>
        {err && (
          <p className="mt-2 text-xs text-faint">
            Google sign-in activates once your Google OAuth client ID is added
            to the app (NEXT_PUBLIC_GOOGLE_CLIENT_ID). Use email below for now.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div ref={ref} className="flex justify-center [&>div]:!w-full" />
      {err && <p className="mt-2 text-sm text-danger">{err}</p>}
    </div>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs uppercase tracking-wide text-faint">or</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
