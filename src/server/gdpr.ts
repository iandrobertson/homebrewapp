"use server";

import { revalidatePath } from "next/cache";
import { eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { authDb } from "@/db/client";
import { withTenant } from "@/db/tenant";
import { recipes, recipeShares, auditLog, user, chapters, styles } from "@/db/schema";
import { requireUser, tenantOf } from "@/lib/session";
import { effectiveAbv } from "@/lib/brewing/abv";
import { litersToGallons } from "@/lib/brewing/units";
import { logger } from "@/lib/observability/logger";

export async function exportMyData() {
  const me = await requireUser();

  const profileRows = await authDb
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      unitsPreference: user.unitsPreference,
      termsAcceptedAt: user.termsAcceptedAt,
      chapterName: chapters.name,
      chapterRegion: chapters.region,
    })
    .from(user)
    .innerJoin(chapters, eq(chapters.id, user.chapterId))
    .where(eq(user.id, me.id))
    .limit(1);

  const tenantData = await withTenant(tenantOf(me), async (tx) => {
    const myRecipes = await tx
      .select({
        id: recipes.id,
        name: recipes.name,
        style: styles.name,
        styleFreetext: recipes.styleFreetext,
        batchSizeLiters: recipes.batchSizeLiters,
        originalGravity: recipes.originalGravity,
        finalGravity: recipes.finalGravity,
        abvCalculated: recipes.abvCalculated,
        abvOverride: recipes.abvOverride,
        ibu: recipes.ibu,
        colorSrm: recipes.colorSrm,
        notes: recipes.notes,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .leftJoin(styles, eq(styles.id, recipes.styleId))
      .where(eq(recipes.ownerId, me.id));

    const shares = await tx
      .select({
        recipeId: recipeShares.recipeId,
        sharedByUserId: recipeShares.sharedByUserId,
        sharedWithUserId: recipeShares.sharedWithUserId,
        permission: recipeShares.permission,
        createdAt: recipeShares.createdAt,
      })
      .from(recipeShares)
      .where(
        or(eq(recipeShares.sharedByUserId, me.id), eq(recipeShares.sharedWithUserId, me.id)),
      );

    const trail = await tx
      .select({
        action: auditLog.action,
        occurredAt: auditLog.occurredAt,
        detail: auditLog.detail,
      })
      .from(auditLog)
      .where(eq(auditLog.userId, me.id));

    await tx.insert(auditLog).values({ userId: me.id, action: "export_requested" });

    return { myRecipes, shares, trail };
  });

  logger.info("export_requested", { userId: me.id });

  return {
    exportedAt: new Date().toISOString(),
    notice:
      "Everything Homebrew holds about you. Gravities are specific gravity, " +
      "batch size is stored in litres (US gallons shown alongside), and colour is SRM.",
    profile: profileRows[0] ?? null,
    recipes: tenantData.myRecipes.map((r) => ({
      ...r,
      batchSizeGallons: Number(litersToGallons(r.batchSizeLiters).toFixed(3)),
      abvEffective: effectiveAbv({
        abvOverride: r.abvOverride,
        abvCalculated: r.abvCalculated,
      }),
    })),
    shares: tenantData.shares,
    accountActivity: tenantData.trail,
  };
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "Give a display name.").max(100),
  unitsPreference: z.enum(["us", "metric"]),
});

export type ProfileResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function updateProfile(
  _prev: ProfileResult | null,
  form: FormData,
): Promise<ProfileResult> {
  const me = await requireUser();

  const parsed = profileSchema.safeParse({
    name: form.get("name"),
    unitsPreference: form.get("unitsPreference"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "That didn't look right." };
  }

  await authDb
    .update(user)
    .set({ ...parsed.data, updatedAt: sql`now()` })
    .where(eq(user.id, me.id));

  revalidatePath("/settings/profile");
  revalidatePath("/recipes");
  return { ok: true, message: "Saved." };
}

export type ErasureResult = { ok: false; message: string };

export async function deleteMyAccount(
  _prev: ErasureResult | null,
  form: FormData,
): Promise<ErasureResult> {
  const me = await requireUser();

  const typed = String(form.get("confirmEmail") ?? "").trim().toLowerCase();
  if (typed !== me.email.toLowerCase()) {
    return { ok: false, message: "That didn't match your email address." };
  }

  await authDb.transaction(async (tx) => {
    await tx.insert(auditLog).values({
      userId: me.id,
      action: "erasure_requested",
      detail: { method: "self-service" },
    });

    await tx.delete(recipeShares).where(
      or(eq(recipeShares.sharedByUserId, me.id), eq(recipeShares.sharedWithUserId, me.id)),
    );
    await tx.delete(recipes).where(eq(recipes.ownerId, me.id));
    await tx.delete(user).where(eq(user.id, me.id));
  });

  logger.info("erasure_requested", { userId: me.id });
  return { ok: false, message: "Account deleted." };
}
