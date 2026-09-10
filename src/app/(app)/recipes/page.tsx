import Link from "next/link";
import { requireUser } from "@/lib/session";
import { listOwnRecipes, listSharedWithMe } from "@/server/recipes";
import { RecipeCard } from "./recipe-card";

export default async function RecipesPage() {
  const me = await requireUser();
  const [own, shared] = await Promise.all([listOwnRecipes(), listSharedWithMe()]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-copper-900">Recipes</h1>
        <Link
          href="/recipes/new"
          className="rounded-md bg-copper-700 px-4 py-2 text-sm font-medium text-white hover:bg-copper-800"
        >
          New recipe
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-medium uppercase tracking-wide text-copper-600">Yours</h2>
        {own.length === 0 ? (
          <p className="mt-3 text-sm text-copper-700">No recipes yet. Start with a new one.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {own.map((r) => (
              <li key={r.id}>
                <RecipeCard recipe={r} units={me.unitsPreference} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium uppercase tracking-wide text-copper-600">Shared with you</h2>
        {shared.length === 0 ? (
          <p className="mt-3 text-sm text-copper-700">Nothing shared with you yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {shared.map((r) => (
              <li key={r.id}>
                <RecipeCard recipe={r} units={me.unitsPreference} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
