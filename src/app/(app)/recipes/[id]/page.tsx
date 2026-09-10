import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getRecipe } from "@/server/recipes";
import { listSharesForRecipe } from "@/server/shares";
import { formatBatchSize, formatColor, srmToHex } from "@/lib/brewing/units";
import { ShareDialog } from "./share-dialog";
import { DeleteButton } from "./delete-button";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser();
  const recipe = await getRecipe(id);
  if (!recipe) notFound();

  const shares = recipe.isOwn ? await listSharesForRecipe(id) : [];

  return (
    <article className="max-w-2xl">
      <p className="text-sm text-copper-600">
        <Link href="/recipes" className="hover:underline">
          Recipes
        </Link>
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-copper-900">{recipe.name}</h1>
          <p className="mt-1 text-copper-700">
            {recipe.styleCode ? `${recipe.styleCode} ` : ""}
            {recipe.styleName ?? recipe.styleFreetext ?? "Uncategorised"}
            {!recipe.isOwn && ` · shared by ${recipe.ownerName}`}
          </p>
        </div>
        {recipe.isOwn && (
          <div className="flex flex-wrap gap-2">
            <ShareDialog recipeId={recipe.id} initialShares={shares} />
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="rounded-md border border-copper-300 px-4 py-2 text-sm font-medium text-copper-900 hover:bg-copper-100"
            >
              Edit
            </Link>
            <DeleteButton recipeId={recipe.id} />
          </div>
        )}
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Batch size" value={formatBatchSize(recipe.batchSizeLiters, me.unitsPreference)} />
        <Stat label="Original gravity" value={recipe.originalGravity?.toFixed(3) ?? "—"} />
        <Stat label="Final gravity" value={recipe.finalGravity?.toFixed(3) ?? "—"} />
        <Stat
          label="ABV"
          value={
            recipe.abv != null
              ? `${recipe.abv}%${recipe.abvOverride != null ? " (override)" : ""}`
              : "—"
          }
        />
        {recipe.abvOverride != null && (
          <Stat label="Calculated ABV" value={recipe.abvCalculated != null ? `${recipe.abvCalculated}%` : "—"} />
        )}
        <Stat label="IBU" value={recipe.ibu != null ? String(recipe.ibu) : "—"} />
        <div>
          <dt className="text-xs uppercase tracking-wide text-copper-600">Colour</dt>
          <dd className="mt-1 flex items-center gap-2 text-copper-900">
            <span
              className="size-5 rounded border border-copper-300"
              style={{ backgroundColor: srmToHex(recipe.colorSrm) }}
            />
            {formatColor(recipe.colorSrm, me.unitsPreference)}
          </dd>
        </div>
      </dl>

      {recipe.notes && (
        <section className="mt-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-copper-600">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-copper-800">{recipe.notes}</p>
        </section>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-copper-600">{label}</dt>
      <dd className="mt-1 text-copper-900">{value}</dd>
    </div>
  );
}
