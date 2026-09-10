"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { calcAbv } from "@/lib/brewing/abv";
import { checkAgainstStyle, describeDeviation, type StyleRanges } from "@/lib/brewing/style-check";
import { litersToGallons, srmToEbc, srmToHex, type UnitsPreference } from "@/lib/brewing/units";
import type { ActionResult } from "@/server/recipes";

export type StyleOption = { id: string; bjcpCode: string; name: string; category: string };

export type RecipeFormValues = {
  name: string;
  styleId: string | null;
  styleFreetext: string | null;
  batchSizeLiters: number;
  originalGravity: number | null;
  finalGravity: number | null;
  abvOverride: number | null;
  ibu: number | null;
  colorSrm: number | null;
  notes: string | null;
};

export function RecipeForm({
  action,
  styles,
  styleRanges,
  units,
  initial,
  submitLabel,
  cancelHref,
}: {
  action: (prev: ActionResult | null, form: FormData) => Promise<ActionResult>;
  styles: StyleOption[];
  styleRanges: Record<string, StyleRanges>;
  units: UnitsPreference;
  initial?: RecipeFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [og, setOg] = useState(initial?.originalGravity?.toString() ?? "");
  const [fg, setFg] = useState(initial?.finalGravity?.toString() ?? "");
  const [overrideOn, setOverrideOn] = useState(initial?.abvOverride != null);
  const [overrideValue, setOverrideValue] = useState(initial?.abvOverride?.toString() ?? "");
  const [styleId, setStyleId] = useState(initial?.styleId ?? "");
  const [ibu, setIbu] = useState(initial?.ibu?.toString() ?? "");
  const [color, setColor] = useState(() => {
    if (initial?.colorSrm == null) return "";
    return String(units === "metric" ? Number(srmToEbc(initial.colorSrm).toFixed(1)) : initial.colorSrm);
  });

  const calculated = useMemo(() => {
    const o = og === "" ? null : Number(og);
    const f = fg === "" ? null : Number(fg);
    return calcAbv(o, f);
  }, [og, fg]);

  const shownAbv = overrideOn && overrideValue !== "" ? Number(overrideValue) : calculated;

  const deviations = useMemo(() => {
    const ranges = styleId ? styleRanges[styleId] : undefined;
    if (!ranges) return [];
    return checkAgainstStyle(
      {
        originalGravity: og === "" ? null : Number(og),
        finalGravity: fg === "" ? null : Number(fg),
        ibu: ibu === "" ? null : Number(ibu),
        colorSrm: initial?.colorSrm ?? (color === "" ? null : Number(color)),
        abv: shownAbv,
      },
      ranges,
    );
  }, [styleId, styleRanges, og, fg, ibu, color, shownAbv, initial?.colorSrm]);

  const batchDefault =
    initial != null
      ? units === "metric"
        ? initial.batchSizeLiters
        : Number(litersToGallons(initial.batchSizeLiters).toFixed(2))
      : units === "metric"
        ? 19
        : 5;

  const grouped = Object.groupBy(styles, (s) => s.category);
  const fieldError = (key: string) =>
    state && !state.ok ? state.errors[key]?.join(" ") : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <Field label="Beer name" htmlFor="name" error={fieldError("name")}>
        <input id="name" name="name" required maxLength={120} defaultValue={initial?.name ?? ""} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Style" htmlFor="styleId" error={fieldError("styleId")}>
          <select
            id="styleId"
            name="styleId"
            value={styleId}
            onChange={(e) => setStyleId(e.target.value)}
            className={inputClass}
          >
            <option value="">Choose a style…</option>
            {Object.entries(grouped).map(([category, options]) => (
              <optgroup key={category} label={category}>
                {(options ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.bjcpCode} {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field
          label="Or describe it"
          htmlFor="styleFreetext"
          error={fieldError("styleFreetext")}
          hint={styleId ? "Clear the style list to type your own." : undefined}
        >
          <input
            id="styleFreetext"
            name="styleFreetext"
            maxLength={120}
            disabled={Boolean(styleId)}
            defaultValue={initial?.styleFreetext ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field
        label={`Batch size (${units === "metric" ? "litres" : "US gallons"})`}
        htmlFor="batchSize"
        error={fieldError("batchSize")}
      >
        <input
          id="batchSize"
          name="batchSize"
          type="number"
          step="0.1"
          min="0.1"
          required
          defaultValue={batchDefault}
          className={inputClass}
        />
      </Field>

      <fieldset className="rounded-lg border border-copper-200 bg-white p-4">
        <legend className="px-1 text-sm font-medium text-copper-900">Gravity and ABV</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Original gravity" htmlFor="originalGravity" error={fieldError("originalGravity")}>
            <input
              id="originalGravity"
              name="originalGravity"
              type="number"
              step="0.001"
              min="0.990"
              max="1.200"
              value={og}
              onChange={(e) => setOg(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Final gravity" htmlFor="finalGravity" error={fieldError("finalGravity")}>
            <input
              id="finalGravity"
              name="finalGravity"
              type="number"
              step="0.001"
              min="0.980"
              max="1.200"
              value={fg}
              onChange={(e) => setFg(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <p className="mt-3 text-sm text-copper-800">
          Calculated ABV:{" "}
          <strong>{calculated != null ? `${calculated}%` : "enter both gravities"}</strong>
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-copper-800">
          <input
            type="checkbox"
            name="abvOverrideEnabled"
            checked={overrideOn}
            onChange={(e) => {
              setOverrideOn(e.target.checked);
              if (e.target.checked && overrideValue === "" && calculated != null) {
                setOverrideValue(String(calculated));
              }
            }}
          />
          Override ABV
        </label>
        {overrideOn && (
          <Field label="ABV %" htmlFor="abvOverride" error={fieldError("abvOverride")}>
            <input
              id="abvOverride"
              name="abvOverride"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              className={inputClass}
            />
          </Field>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="IBU" htmlFor="ibu" error={fieldError("ibu")}>
          <input
            id="ibu"
            name="ibu"
            type="number"
            min="0"
            max="200"
            value={ibu}
            onChange={(e) => setIbu(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field
          label={`Colour (${units === "metric" ? "EBC" : "SRM"})`}
          htmlFor="color"
          error={fieldError("color")}
        >
          <div className="flex items-center gap-2">
            <input
              id="color"
              name="color"
              type="number"
              step="0.1"
              min="0"
              max="200"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={inputClass}
            />
            <span
              className="size-8 shrink-0 rounded-md border border-copper-300"
              style={{ backgroundColor: srmToHex(initial?.colorSrm ?? (color === "" ? null : Number(color))) }}
              aria-hidden
            />
          </div>
        </Field>
      </div>

      {deviations.length > 0 && (
        <ul className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          {deviations.map((d) => (
            <li key={d.field}>{describeDeviation(d)} This is advisory — you can still save.</li>
          ))}
        </ul>
      )}

      <Field label="Notes" htmlFor="notes" error={fieldError("notes")}>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={5000}
          defaultValue={initial?.notes ?? ""}
          className={inputClass}
        />
      </Field>

      {state && !state.ok && state.errors._form && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {state.errors._form.join(" ")}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-copper-700 px-4 py-2 font-medium text-white hover:bg-copper-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href={cancelHref} className="rounded-md border border-copper-300 px-4 py-2 text-copper-900 hover:bg-copper-100">
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-copper-300 bg-white px-3 py-2 text-copper-900 outline-none focus:border-copper-600 focus:ring-2 focus:ring-copper-600/30 disabled:bg-copper-100";

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-copper-900">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-copper-700">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}
