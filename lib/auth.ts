import { api, setToken, clearToken } from "@/lib/api";

export type Role =
  | "super_admin"
  | "ops_manager"
  | "reviewer"
  | "annotator"
  | "client";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_verified: boolean;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export const HOME_FOR_ROLE: Record<Role, string> = {
  super_admin: "/admin/dashboard",
  ops_manager: "/admin/dashboard",
  reviewer: "/reviewer/queue",
  annotator: "/annotator/dashboard",
  client: "/dashboard",
};

export async function login(email: string, password: string): Promise<User> {
  const res = await api<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(res.access_token);
  return me();
}

export async function register(payload: {
  email: string;
  password: string;
  full_name: string;
  company_name?: string;
}): Promise<void> {
  await api("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me(): Promise<User> {
  return api<User>("/auth/me");
}

export function logout() {
  clearToken();
  if (typeof window !== "undefined") window.location.href = "/login";
}
