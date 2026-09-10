"use client";

import { deleteRecipe } from "@/server/recipes";

export function DeleteButton({ recipeId }: { recipeId: string }) {
  return (
    <form
      action={async () => {
        if (window.confirm("Delete this recipe? Anyone you shared it with will lose access.")) {
          await deleteRecipe(recipeId);
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
      >
        Delete
      </button>
    </form>
  );
}
