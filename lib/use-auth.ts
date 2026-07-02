"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { me, type User, type Role } from "@/lib/auth";
import { getToken } from "@/lib/api";

// Guards a dashboard route: redirects to /login if unauthenticated, and to the
// user's own home if their role isn't allowed here.
export function useAuth(allowed?: Role[]) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    me()
      .then((u) => {
        if (!active) return;
        if (allowed && !allowed.includes(u.role)) {
          router.replace("/login");
          return;
        }
        setUser(u);
        setLoading(false);
      })
      .catch(() => router.replace("/login"));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, loading };
}
