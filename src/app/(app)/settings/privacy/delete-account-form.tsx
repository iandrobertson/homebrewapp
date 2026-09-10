"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccount, type ErasureResult } from "@/server/gdpr";
import { signOut } from "@/lib/auth-client";

export function DeleteAccountForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (prev: ErasureResult | null, form: FormData) => {
      const result = await deleteMyAccount(prev, form);
      if (result.message === "Account deleted.") {
        await signOut();
        router.push("/");
        router.refresh();
      }
      return result;
    },
    null,
  );

  return (
    <form action={action} className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4">
      <label htmlFor="confirmEmail" className="block text-sm font-medium text-red-950">
        Type your email to confirm
      </label>
      <input
        id="confirmEmail"
        name="confirmEmail"
        type="email"
        required
        autoComplete="off"
        className="w-full rounded-md border border-red-300 bg-white px-3 py-2 outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
      />
      {state && (
        <p className="text-sm text-red-800">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
