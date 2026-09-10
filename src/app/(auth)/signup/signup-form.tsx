"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import type { ChapterOption } from "@/server/chapters";

export function SignupForm({ chapters }: { chapters: ChapterOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");

    if (password !== String(form.get("confirmPassword") ?? "")) {
      setError("The two passwords don't match.");
      setPending(false);
      return;
    }

    const { error: authError } = await signUp.email({
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password,
      chapterId: String(form.get("chapterId") ?? ""),
    });

    setPending(false);

    if (authError) {
      setError(authError.message ?? "Could not create the account.");
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="mt-8 rounded-md border border-ale-500/40 bg-ale-500/10 p-4 text-sm text-copper-900">
        <p className="font-medium">Check your email.</p>
        <p className="mt-1">
          We&rsquo;ve sent a link to confirm your address. In development the link is
          printed in the server log.
        </p>
      </div>
    );
  }

  const grouped = Object.groupBy(chapters, (c) => c.region);

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <Field label="Your name" htmlFor="name">
        <input id="name" name="name" type="text" required autoComplete="name" maxLength={100} className={inputClass} />
      </Field>
      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" required autoComplete="email" maxLength={254} className={inputClass} />
      </Field>
      <Field label="Homebrew chapter" htmlFor="chapterId" hint="Your chapter decides who you can share recipes with.">
        <select id="chapterId" name="chapterId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose your chapter…
          </option>
          {Object.entries(grouped).map(([region, options]) => (
            <optgroup key={region} label={region}>
              {(options ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 12 characters.">
        <input id="password" name="password" type="password" required minLength={12} autoComplete="new-password" className={inputClass} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword">
        <input id="confirmPassword" name="confirmPassword" type="password" required minLength={12} autoComplete="new-password" className={inputClass} />
      </Field>
      <label className="flex items-start gap-3 text-sm text-copper-800">
        <input type="checkbox" name="consent" required className="mt-1 size-4" />
        <span>
          I&rsquo;ve read the{" "}
          <Link href="/privacy" target="_blank" className="underline hover:no-underline">
            privacy notice
          </Link>{" "}
          and agree to Homebrew storing my name, email address and recipes.
        </span>
      </label>
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-copper-700 px-4 py-2.5 font-medium text-white hover:bg-copper-800 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-copper-700">
        Already have an account?{" "}
        <Link href="/login" className="underline hover:no-underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-copper-300 bg-white px-3 py-2 text-copper-900 outline-none focus:border-copper-600 focus:ring-2 focus:ring-copper-600/30";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-copper-900">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-copper-700">{hint}</p>}
    </div>
  );
}
