"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { withTenant } from "@/db/tenant";
import { recipeShares, user } from "@/db/schema";
import { requireUser, tenantOf } from "@/lib/session";
import { shareTargetSchema } from "@/lib/validation/recipe";
import { recordAudit } from "./audit";
import { logger } from "@/lib/observability/logger";

export type DirectoryEntry = { id: string; name: string };
export type ShareRow = { userId: string; name: string; sharedAt: Date };

export async function searchChapterMembers(
  recipeId: string,
  query: string,
): Promise<DirectoryEntry[]> {
  const me = await requireUser();
  const term = query.trim();
  if (term.length < 1) return [];

  return withTenant(tenantOf(me), async (tx) => {
    const result = await tx.execute<DirectoryEntry>(sql`
      select d.id, d.name
        from chapter_directory d
       where d.id <> ${me.id}
         and d.name ilike ${"%" + term + "%"}
         and not exists (
           select 1 from recipe_shares s
            where s.recipe_id = ${recipeId}
              and s.shared_with_user_id = d.id
         )
       order by d.name
       limit 10
    `);
    return result.rows;
  });
}

export async function listSharesForRecipe(recipeId: string): Promise<ShareRow[]> {
  const me = await requireUser();

  return withTenant(tenantOf(me), async (tx) =>
    tx
      .select({
        userId: recipeShares.sharedWithUserId,
        name: user.name,
        sharedAt: recipeShares.createdAt,
      })
      .from(recipeShares)
      .innerJoin(user, eq(user.id, recipeShares.sharedWithUserId))
      .where(eq(recipeShares.recipeId, recipeId))
      .orderBy(user.name),
  );
}

export type ShareResult = { ok: true } | { ok: false; message: string };

export async function shareRecipe(recipeId: string, userId: string): Promise<ShareResult> {
  const me = await requireUser();

  const parsed = shareTargetSchema.safeParse({ recipeId, userId });
  if (!parsed.success) return { ok: false, message: "That share request wasn't valid." };

  try {
    await withTenant(tenantOf(me), async (tx) => {
      await tx.insert(recipeShares).values({
        recipeId: parsed.data.recipeId,
        chapterId: me.chapterId,
        sharedByUserId: me.id,
        sharedWithUserId: parsed.data.userId,
      });

      await recordAudit(tx, me.id, "recipe_shared", {
        recipeId: parsed.data.recipeId,
        sharedWith: parsed.data.userId,
      });
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("recipe_shares_recipe_recipient_key")) {
      return { ok: false, message: "That recipe is already shared with them." };
    }
    if (message.includes("row-level security")) {
      return { ok: false, message: "You can only share your own recipes, within your chapter." };
    }
    throw err;
  }

  logger.info("recipe_shared", { userId: me.id, recipeId, sharedWith: userId });
  revalidatePath(`/recipes/${recipeId}`);
  return { ok: true };
}

export async function revokeShare(recipeId: string, userId: string): Promise<ShareResult> {
  const me = await requireUser();

  await withTenant(tenantOf(me), async (tx) => {
    await tx
      .delete(recipeShares)
      .where(and(eq(recipeShares.recipeId, recipeId), eq(recipeShares.sharedWithUserId, userId)));
    await recordAudit(tx, me.id, "share_revoked", { recipeId, sharedWith: userId });
  });

  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/recipes");
  return { ok: true };
}
