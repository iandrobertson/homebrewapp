import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getRecipe, listStyleRanges, listStyles, updateRecipe } from "@/server/recipes";
import { RecipeForm } from "../../recipe-form";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser();
  const [recipe, styles, styleRanges] = await Promise.all([
    getRecipe(id),
    listStyles(),
    listStyleRanges(),
  ]);

  if (!recipe || !recipe.isOwn) notFound();

  const bound = updateRecipe.bind(null, id);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-copper-900">Edit {recipe.name}</h1>
      <div className="mt-6">
        <RecipeForm
          action={bound}
          styles={styles}
          styleRanges={styleRanges}
          units={me.unitsPreference}
          initial={{
            name: recipe.name,
            styleId: recipe.styleId,
            styleFreetext: recipe.styleFreetext,
            batchSizeLiters: recipe.batchSizeLiters,
            originalGravity: recipe.originalGravity,
            finalGravity: recipe.finalGravity,
            abvOverride: recipe.abvOverride,
            ibu: recipe.ibu,
            colorSrm: recipe.colorSrm,
            notes: recipe.notes,
          }}
          submitLabel="Save changes"
          cancelHref={`/recipes/${id}`}
        />
      </div>
    </div>
  );
}
