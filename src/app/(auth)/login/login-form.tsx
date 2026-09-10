"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/recipes";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const { error: authError } = await signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    setPending(false);

    if (authError) {
      setError(authError.message ?? "Could not sign in.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-copper-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-copper-300 bg-white px-3 py-2 outline-none focus:border-copper-600 focus:ring-2 focus:ring-copper-600/30"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-copper-900">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-copper-300 bg-white px-3 py-2 outline-none focus:border-copper-600 focus:ring-2 focus:ring-copper-600/30"
        />
      </div>
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
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-copper-700">
        New here?{" "}
        <Link href="/signup" className="underline hover:no-underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
