/** US liquid gallon, exactly, per NIST. */
export const LITERS_PER_US_GALLON = 3.785411784;

/** EBC = SRM × 1.97 (the conventional homebrew approximation). */
export const EBC_PER_SRM = 1.97;

export type UnitsPreference = "us" | "metric";

export function litersToGallons(liters: number): number {
  return liters / LITERS_PER_US_GALLON;
}

export function gallonsToLiters(gallons: number): number {
  return gallons * LITERS_PER_US_GALLON;
}

export function srmToEbc(srm: number): number {
  return srm * EBC_PER_SRM;
}

export function ebcToSrm(ebc: number): number {
  return ebc / EBC_PER_SRM;
}

export function formatBatchSize(liters: number, units: UnitsPreference): string {
  return units === "metric"
    ? `${round(liters, 1)} L`
    : `${round(litersToGallons(liters), 2)} gal`;
}

export function formatColor(srm: number | null, units: UnitsPreference): string {
  if (srm == null) return "—";
  return units === "metric" ? `${round(srmToEbc(srm), 1)} EBC` : `${round(srm, 1)} SRM`;
}

export function batchSizeInputToLiters(value: number, units: UnitsPreference): number {
  return units === "metric" ? value : gallonsToLiters(value);
}

export function colorInputToSrm(value: number, units: UnitsPreference): number {
  return units === "metric" ? ebcToSrm(value) : value;
}

export function srmToHex(srm: number | null): string {
  if (srm == null) return "#d9d9d9";
  const s = Math.max(0, Math.min(40, srm));
  const r = Math.round(Math.max(0, Math.min(255, 255 * Math.exp(-0.023 * s * 2.2))));
  const g = Math.round(Math.max(0, Math.min(255, 200 * Math.exp(-0.06 * s * 2.2))));
  const b = Math.round(Math.max(0, Math.min(255, 90 * Math.exp(-0.35 * s * 2.2))));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
