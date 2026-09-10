import { z } from "zod";

const blankToNull = (value: unknown) =>
  value === "" || value === undefined ? null : value;

const optionalNumber = (min: number, max: number, label: string) =>
  z.preprocess(
    blankToNull,
    z
      .number({ message: `${label} must be a number.` })
      .min(min, `${label} must be at least ${min}.`)
      .max(max, `${label} must be at most ${max}.`)
      .nullable(),
  );

const optionalText = (max: number) =>
  z.preprocess(
    blankToNull,
    z.string().trim().max(max, `Must be ${max} characters or fewer.`).nullable(),
  );

export const recipeInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Give the beer a name.")
      .max(120, "Name must be 120 characters or fewer."),
    styleId: z.preprocess(blankToNull, z.uuid("Pick a style from the list.").nullable()),
    styleFreetext: optionalText(120),
    batchSize: z
      .number({ message: "Batch size must be a number." })
      .positive("Batch size must be greater than zero.")
      .max(100_000, "That batch size looks implausible."),
    originalGravity: optionalNumber(0.99, 1.2, "Original gravity"),
    finalGravity: optionalNumber(0.98, 1.2, "Final gravity"),
    abvOverride: optionalNumber(0, 100, "ABV"),
    ibu: z.preprocess(
      blankToNull,
      z
        .number({ message: "IBU must be a number." })
        .int("IBU must be a whole number.")
        .min(0, "IBU must be at least 0.")
        .max(200, "IBU must be at most 200.")
        .nullable(),
    ),
    color: optionalNumber(0, 200, "Colour"),
    notes: optionalText(5000),
  })
  .refine((r) => !(r.styleId && r.styleFreetext), {
    message: "Use either a listed style or your own description, not both.",
    path: ["styleFreetext"],
  });

export type RecipeInput = z.infer<typeof recipeInputSchema>;

export function parseRecipeForm(form: FormData) {
  const num = (key: string) => {
    const raw = form.get(key);
    if (raw === null || raw === "") return "";
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? raw : parsed;
  };

  return recipeInputSchema.safeParse({
    name: String(form.get("name") ?? ""),
    styleId: form.get("styleId") ?? "",
    styleFreetext: form.get("styleFreetext") ?? "",
    batchSize: num("batchSize"),
    originalGravity: num("originalGravity"),
    finalGravity: num("finalGravity"),
    abvOverride: form.get("abvOverrideEnabled") === "on" ? num("abvOverride") : "",
    ibu: num("ibu"),
    color: num("color"),
    notes: form.get("notes") ?? "",
  });
}

export const shareTargetSchema = z.object({
  recipeId: z.uuid(),
  userId: z.string().min(1).max(64),
});
