"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { withTenant } from "@/db/tenant";
import { appDb } from "@/db/client";
import { recipes, recipeShares, styles, user } from "@/db/schema";
import { requireUser, tenantOf } from "@/lib/session";
import { parseRecipeForm } from "@/lib/validation/recipe";
import { batchSizeInputToLiters, colorInputToSrm } from "@/lib/brewing/units";
import { effectiveAbv } from "@/lib/brewing/abv";
import { logger } from "@/lib/observability/logger";

export type RecipeSummary = {
  id: string;
  name: string;
  styleName: string | null;
  batchSizeLiters: number;
  originalGravity: number | null;
  finalGravity: number | null;
  abv: number | null;
  abvIsOverridden: boolean;
  ibu: number | null;
  colorSrm: number | null;
  ownerName: string;
  isOwn: boolean;
  updatedAt: Date;
};

export type ActionResult = { ok: true } | { ok: false; errors: Record<string, string[]> };

export async function listOwnRecipes(): Promise<RecipeSummary[]> {
  const me = await requireUser();

  return withTenant(tenantOf(me), async (tx) => {
    const rows = await tx
      .select({
        id: recipes.id,
        name: recipes.name,
        styleName: styles.name,
        batchSizeLiters: recipes.batchSizeLiters,
        originalGravity: recipes.originalGravity,
        finalGravity: recipes.finalGravity,
        abvCalculated: recipes.abvCalculated,
        abvOverride: recipes.abvOverride,
        ibu: recipes.ibu,
        colorSrm: recipes.colorSrm,
        styleFreetext: recipes.styleFreetext,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .leftJoin(styles, eq(styles.id, recipes.styleId))
      .where(and(eq(recipes.ownerId, me.id), eq(recipes.chapterId, me.chapterId)))
      .orderBy(desc(recipes.updatedAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      styleName: r.styleName ?? r.styleFreetext,
      batchSizeLiters: r.batchSizeLiters,
      originalGravity: r.originalGravity,
      finalGravity: r.finalGravity,
      abv: effectiveAbv({ abvOverride: r.abvOverride, abvCalculated: r.abvCalculated }),
      abvIsOverridden: r.abvOverride !== null,
      ibu: r.ibu,
      colorSrm: r.colorSrm,
      ownerName: me.name,
      isOwn: true,
      updatedAt: r.updatedAt,
    }));
  });
}

export async function listSharedWithMe(): Promise<RecipeSummary[]> {
  const me = await requireUser();

  return withTenant(tenantOf(me), async (tx) => {
    const rows = await tx
      .select({
        id: recipes.id,
        name: recipes.name,
        styleName: styles.name,
        styleFreetext: recipes.styleFreetext,
        batchSizeLiters: recipes.batchSizeLiters,
        originalGravity: recipes.originalGravity,
        finalGravity: recipes.finalGravity,
        abvCalculated: recipes.abvCalculated,
        abvOverride: recipes.abvOverride,
        ibu: recipes.ibu,
        colorSrm: recipes.colorSrm,
        updatedAt: recipes.updatedAt,
        ownerName: user.name,
      })
      .from(recipeShares)
      .innerJoin(recipes, eq(recipes.id, recipeShares.recipeId))
      .leftJoin(styles, eq(styles.id, recipes.styleId))
      .innerJoin(user, eq(user.id, recipes.ownerId))
      .where(eq(recipeShares.sharedWithUserId, me.id))
      .orderBy(desc(recipes.updatedAt));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      styleName: r.styleName ?? r.styleFreetext,
      batchSizeLiters: r.batchSizeLiters,
      originalGravity: r.originalGravity,
      finalGravity: r.finalGravity,
      abv: effectiveAbv({ abvOverride: r.abvOverride, abvCalculated: r.abvCalculated }),
      abvIsOverridden: r.abvOverride !== null,
      ibu: r.ibu,
      colorSrm: r.colorSrm,
      ownerName: r.ownerName,
      isOwn: false,
      updatedAt: r.updatedAt,
    }));
  });
}

export type RecipeDetail = Awaited<ReturnType<typeof getRecipe>>;

export async function getRecipe(id: string) {
  const me = await requireUser();

  return withTenant(tenantOf(me), async (tx) => {
    const rows = await tx
      .select({
        id: recipes.id,
        name: recipes.name,
        ownerId: recipes.ownerId,
        ownerName: user.name,
        styleId: recipes.styleId,
        styleFreetext: recipes.styleFreetext,
        styleName: styles.name,
        styleCode: styles.bjcpCode,
        batchSizeLiters: recipes.batchSizeLiters,
        originalGravity: recipes.originalGravity,
        finalGravity: recipes.finalGravity,
        abvOverride: recipes.abvOverride,
        abvCalculated: recipes.abvCalculated,
        ibu: recipes.ibu,
        colorSrm: recipes.colorSrm,
        notes: recipes.notes,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
        style: {
          name: styles.name,
          bjcpCode: styles.bjcpCode,
          ogMin: styles.ogMin,
          ogMax: styles.ogMax,
          fgMin: styles.fgMin,
          fgMax: styles.fgMax,
          ibuMin: styles.ibuMin,
          ibuMax: styles.ibuMax,
          srmMin: styles.srmMin,
          srmMax: styles.srmMax,
          abvMin: styles.abvMin,
          abvMax: styles.abvMax,
        },
      })
      .from(recipes)
      .leftJoin(styles, eq(styles.id, recipes.styleId))
      .innerJoin(user, eq(user.id, recipes.ownerId))
      .where(eq(recipes.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      ...row,
      isOwn: row.ownerId === me.id,
      abv: effectiveAbv({ abvOverride: row.abvOverride, abvCalculated: row.abvCalculated }),
    };
  });
}

export async function listStyles() {
  return appDb
    .select({
      id: styles.id,
      bjcpCode: styles.bjcpCode,
      name: styles.name,
      category: styles.category,
    })
    .from(styles)
    .orderBy(styles.bjcpCode);
}

export async function listStyleRanges() {
  const rows = await appDb
    .select({
      id: styles.id,
      name: styles.name,
      bjcpCode: styles.bjcpCode,
      ogMin: styles.ogMin,
      ogMax: styles.ogMax,
      fgMin: styles.fgMin,
      fgMax: styles.fgMax,
      ibuMin: styles.ibuMin,
      ibuMax: styles.ibuMax,
      srmMin: styles.srmMin,
      srmMax: styles.srmMax,
      abvMin: styles.abvMin,
      abvMax: styles.abvMax,
    })
    .from(styles);

  return Object.fromEntries(rows.map(({ id, ...ranges }) => [id, ranges]));
}

function flatten(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export async function createRecipe(_prev: unknown, form: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = parseRecipeForm(form);
  if (!parsed.success) return { ok: false, errors: flatten(parsed.error) };

  const input = parsed.data;
  let newId: string | undefined;

  await withTenant(tenantOf(me), async (tx) => {
    const inserted = await tx
      .insert(recipes)
      .values({
        chapterId: me.chapterId,
        ownerId: me.id,
        name: input.name,
        styleId: input.styleId,
        styleFreetext: input.styleFreetext,
        batchSizeLiters: batchSizeInputToLiters(input.batchSize, me.unitsPreference),
        originalGravity: input.originalGravity,
        finalGravity: input.finalGravity,
        abvOverride: input.abvOverride,
        ibu: input.ibu,
        colorSrm: input.color === null ? null : colorInputToSrm(input.color, me.unitsPreference),
        notes: input.notes,
      })
      .returning({ id: recipes.id });
    newId = inserted[0]?.id;
  });

  logger.info("recipe_created", { userId: me.id, recipeId: newId });
  revalidatePath("/recipes");
  if (newId) redirect(`/recipes/${newId}`);
  return { ok: true };
}

export async function updateRecipe(
  id: string,
  _prev: unknown,
  form: FormData,
): Promise<ActionResult> {
  const me = await requireUser();
  const parsed = parseRecipeForm(form);
  if (!parsed.success) return { ok: false, errors: flatten(parsed.error) };

  const input = parsed.data;

  const updated = await withTenant(tenantOf(me), async (tx) =>
    tx
      .update(recipes)
      .set({
        name: input.name,
        styleId: input.styleId,
        styleFreetext: input.styleFreetext,
        batchSizeLiters: batchSizeInputToLiters(input.batchSize, me.unitsPreference),
        originalGravity: input.originalGravity,
        finalGravity: input.finalGravity,
        abvOverride: input.abvOverride,
        ibu: input.ibu,
        colorSrm: input.color === null ? null : colorInputToSrm(input.color, me.unitsPreference),
        notes: input.notes,
        updatedAt: sql`now()`,
      })
      .where(and(eq(recipes.id, id), eq(recipes.ownerId, me.id)))
      .returning({ id: recipes.id }),
  );

  if (updated.length === 0) {
    return { ok: false, errors: { _form: ["That recipe can no longer be edited."] } };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  redirect(`/recipes/${id}`);
}

export async function deleteRecipe(id: string): Promise<void> {
  const me = await requireUser();

  await withTenant(tenantOf(me), async (tx) => {
    await tx.delete(recipes).where(and(eq(recipes.id, id), eq(recipes.ownerId, me.id)));
  });

  logger.info("recipe_deleted", { userId: me.id, recipeId: id });
  revalidatePath("/recipes");
  redirect("/recipes");
}
