import { requireUser } from "@/lib/session";
import { createRecipe, listStyleRanges, listStyles } from "@/server/recipes";
import { RecipeForm } from "../recipe-form";

export default async function NewRecipePage() {
  const me = await requireUser();
  const [styles, styleRanges] = await Promise.all([listStyles(), listStyleRanges()]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-copper-900">New recipe</h1>
      <p className="mt-2 text-sm text-copper-700">
        ABV is calculated from original and final gravity. You can override it if you have a measured value.
      </p>
      <div className="mt-6">
        <RecipeForm
          action={createRecipe}
          styles={styles}
          styleRanges={styleRanges}
          units={me.unitsPreference}
          submitLabel="Save recipe"
          cancelHref="/recipes"
        />
      </div>
    </div>
  );
}
