import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { auditLog } from "@/db/schema";
import type { TenantTx } from "@/db/tenant";

export type AuditAction =
  | "signup"
  | "consent_granted"
  | "login"
  | "recipe_shared"
  | "share_revoked"
  | "export_requested"
  | "erasure_requested";

async function hashedIp(): Promise<string | null> {
  const salt = process.env.AUDIT_IP_SALT;
  if (!salt) return null;

  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || h.get("x-real-ip");
  if (!ip) return null;

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function recordAudit(
  tx: TenantTx,
  userId: string,
  action: AuditAction,
  detail?: Record<string, unknown>,
): Promise<void> {
  await tx.insert(auditLog).values({
    userId,
    action,
    ipHash: await hashedIp(),
    detail: detail ?? null,
  });
}
