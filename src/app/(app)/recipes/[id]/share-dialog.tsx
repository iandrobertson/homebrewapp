"use client";

import { useState, useTransition } from "react";
import {
  searchChapterMembers,
  shareRecipe,
  revokeShare,
  type DirectoryEntry,
  type ShareRow,
} from "@/server/shares";

export function ShareDialog({
  recipeId,
  initialShares,
}: {
  recipeId: string;
  initialShares: ShareRow[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryEntry[]>([]);
  const [shares, setShares] = useState<ShareRow[]>(initialShares);
  const [message, setMessage] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();

  function onQueryChange(value: string) {
    setQuery(value);
    setMessage(null);
    if (value.trim().length === 0) {
      setResults([]);
      return;
    }
    startSearch(async () => {
      setResults(await searchChapterMembers(recipeId, value));
    });
  }

  function onShare(target: DirectoryEntry) {
    startSave(async () => {
      const result = await shareRecipe(recipeId, target.id);
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setShares((current) => [...current, { userId: target.id, name: target.name, sharedAt: new Date() }]);
      setResults((current) => current.filter((r) => r.id !== target.id));
      setQuery("");
      setMessage(`Shared with ${target.name}.`);
    });
  }

  function onRevoke(userId: string) {
    startSave(async () => {
      await revokeShare(recipeId, userId);
      setShares((current) => current.filter((s) => s.userId !== userId));
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-copper-300 px-4 py-2 text-sm font-medium text-copper-900 hover:bg-copper-100"
      >
        Share{shares.length > 0 && ` (${shares.length})`}
      </button>
    );
  }

  return (
    <div className="w-full rounded-lg border border-copper-300 bg-white p-4 sm:w-96">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-medium text-copper-900">Share this recipe</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-copper-700 underline hover:no-underline">
          Close
        </button>
      </div>
      <label htmlFor="share-search" className="mb-1.5 block text-sm text-copper-800">
        Search members of your chapter
      </label>
      <input
        id="share-search"
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Start typing a name…"
        autoComplete="off"
        className="w-full rounded-md border border-copper-300 px-3 py-2 outline-none focus:border-copper-600 focus:ring-2 focus:ring-copper-600/30"
      />
      {searching && <p className="mt-2 text-xs text-copper-600">Searching…</p>}
      {query.trim() !== "" && !searching && results.length === 0 && (
        <p className="mt-2 text-sm text-copper-700">No one in your chapter matches that.</p>
      )}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-copper-200 rounded-md border border-copper-200">
          {results.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="text-sm text-copper-900">{r.name}</span>
              <button
                type="button"
                disabled={saving}
                onClick={() => onShare(r)}
                className="rounded-md bg-copper-700 px-3 py-1 text-xs font-medium text-white hover:bg-copper-800 disabled:opacity-60"
              >
                Share
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-2 text-sm text-copper-800">{message}</p>}
      <div className="mt-5">
        <h3 className="mb-2 text-sm font-medium text-copper-900">Currently shared with</h3>
        {shares.length === 0 ? (
          <p className="text-sm text-copper-700">Not shared with anyone yet.</p>
        ) : (
          <ul className="divide-y divide-copper-200 rounded-md border border-copper-200">
            {shares.map((s) => (
              <li key={s.userId} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm text-copper-900">{s.name}</span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onRevoke(s.userId)}
                  className="text-xs text-copper-700 underline hover:no-underline disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
