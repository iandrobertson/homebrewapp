export type StyleRanges = {
  name: string;
  ogMin: number | null;
  ogMax: number | null;
  fgMin: number | null;
  fgMax: number | null;
  ibuMin: number | null;
  ibuMax: number | null;
  srmMin: number | null;
  srmMax: number | null;
  abvMin: number | null;
  abvMax: number | null;
};

export type StyleDeviation = {
  field: string;
  value: number;
  min: number | null;
  max: number | null;
};

function outOfRange(
  field: string,
  value: number | null | undefined,
  min: number | null,
  max: number | null,
): StyleDeviation | null {
  if (value == null || (min == null && max == null)) return null;
  if (min != null && value < min) return { field, value, min, max };
  if (max != null && value > max) return { field, value, min, max };
  return null;
}

export function checkAgainstStyle(
  recipe: {
    originalGravity?: number | null;
    finalGravity?: number | null;
    ibu?: number | null;
    colorSrm?: number | null;
    abv?: number | null;
  },
  style: StyleRanges,
): StyleDeviation[] {
  return [
    outOfRange("OG", recipe.originalGravity, style.ogMin, style.ogMax),
    outOfRange("FG", recipe.finalGravity, style.fgMin, style.fgMax),
    outOfRange("IBU", recipe.ibu, style.ibuMin, style.ibuMax),
    outOfRange("Colour", recipe.colorSrm, style.srmMin, style.srmMax),
    outOfRange("ABV", recipe.abv, style.abvMin, style.abvMax),
  ].filter((d): d is StyleDeviation => d !== null);
}

export function describeDeviation(d: StyleDeviation): string {
  if (d.min != null && d.max != null) {
    return `${d.field} ${d.value} is outside ${d.min}–${d.max}.`;
  }
  if (d.min != null) return `${d.field} ${d.value} is below ${d.min}.`;
  return `${d.field} ${d.value} is above ${d.max}.`;
}
