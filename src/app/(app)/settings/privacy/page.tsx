import Link from "next/link";
import { DeleteAccountForm } from "./delete-account-form";

export default function PrivacyPage() {
  return (
    <div className="max-w-lg space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-copper-900">Privacy</h1>
        <p className="mt-2 text-sm text-copper-700">
          Download everything we hold about you, or delete your account. See the{" "}
          <Link href="/privacy" className="underline hover:no-underline">
            privacy notice
          </Link>
          .
        </p>
      </div>

      <section>
        <h2 className="font-medium text-copper-900">Export your data</h2>
        <p className="mt-1 text-sm text-copper-700">
          A JSON file with your profile, recipes, shares and account activity.
        </p>
        <a
          href="/api/me/export"
          className="mt-3 inline-block rounded-md border border-copper-300 px-4 py-2 text-sm font-medium text-copper-900 hover:bg-copper-100"
        >
          Download export
        </a>
      </section>

      <section>
        <h2 className="font-medium text-copper-900">Delete your account</h2>
        <p className="mt-1 text-sm text-copper-700">
          Immediate and irreversible. Your recipes are deleted, so anyone you shared them with loses access.
        </p>
        <div className="mt-3">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  );
}
