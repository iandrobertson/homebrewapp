import Link from "next/link";
import type { RecipeSummary } from "@/server/recipes";
import { formatBatchSize, formatColor, type UnitsPreference } from "@/lib/brewing/units";

export function RecipeCard({
  recipe,
  units,
}: {
  recipe: RecipeSummary;
  units: UnitsPreference;
}) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="block rounded-lg border border-copper-200 bg-white p-4 hover:border-copper-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-copper-900">{recipe.name}</h3>
          <p className="mt-0.5 text-sm text-copper-700">{recipe.styleName ?? "Uncategorised"}</p>
        </div>
        {!recipe.isOwn && (
          <span className="rounded-full bg-copper-100 px-2 py-0.5 text-xs text-copper-800">
            Shared by {recipe.ownerName}
          </span>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-copper-800 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-copper-600">Batch</dt>
          <dd>{formatBatchSize(recipe.batchSizeLiters, units)}</dd>
        </div>
        <div>
          <dt className="text-xs text-copper-600">ABV</dt>
          <dd>
            {recipe.abv != null ? `${recipe.abv}%` : "—"}
            {recipe.abvIsOverridden && <span className="ml-1 text-xs text-copper-600">override</span>}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-copper-600">IBU</dt>
          <dd>{recipe.ibu ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-copper-600">Colour</dt>
          <dd>{formatColor(recipe.colorSrm, units)}</dd>
        </div>
      </dl>
    </Link>
  );
}
