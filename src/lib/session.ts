import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import type { TenantContext } from "@/db/tenant";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  chapterId: string;
  unitsPreference: "us" | "metric";
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const result = await getAuth().api.getSession({ headers: await headers() });
  if (!result?.user) return null;

  const u = result.user as Record<string, unknown>;
  if (typeof u.chapterId !== "string") return null;

  return {
    id: String(u.id),
    name: String(u.name ?? ""),
    email: String(u.email ?? ""),
    chapterId: u.chapterId,
    unitsPreference: u.unitsPreference === "metric" ? "metric" : "us",
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function tenantOf(user: CurrentUser): TenantContext {
  return { userId: user.id, chapterId: user.chapterId };
}
