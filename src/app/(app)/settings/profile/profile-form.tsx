"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileResult } from "@/server/gdpr";
import type { UnitsPreference } from "@/lib/brewing/units";

export function ProfileForm({
  name,
  unitsPreference,
}: {
  name: string;
  unitsPreference: UnitsPreference;
}) {
  const [state, action, pending] = useActionState(updateProfile, null);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-copper-900">
          Display name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={name}
          className="w-full rounded-md border border-copper-300 px-3 py-2 outline-none focus:border-copper-600 focus:ring-2 focus:ring-copper-600/30"
        />
      </div>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-copper-900">Units</legend>
        <label className="mr-4 text-sm">
          <input type="radio" name="unitsPreference" value="us" defaultChecked={unitsPreference === "us"} className="mr-1" />
          US (gallons, SRM)
        </label>
        <label className="text-sm">
          <input type="radio" name="unitsPreference" value="metric" defaultChecked={unitsPreference === "metric"} className="mr-1" />
          Metric (litres, EBC)
        </label>
      </fieldset>
      {state && (
        <p className={`text-sm ${state.ok ? "text-ale-600" : "text-red-800"}`}>
          {"message" in state ? state.message : null}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-copper-700 px-4 py-2 font-medium text-white hover:bg-copper-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
