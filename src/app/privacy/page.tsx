import Link from "next/link";

export default function PrivacyNoticePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/" className="text-sm text-copper-700 hover:underline">
        Homebrew
      </Link>
      <h1 className="mt-4 text-3xl font-semibold text-copper-900">Privacy notice</h1>
      <p className="mt-4 text-copper-800">
        Homebrew stores the minimum needed to run a chapter recipe book: your name, email,
        password hash, chapter membership, recipes, and a short audit trail of account actions.
      </p>
      <h2 className="mt-8 text-lg font-medium text-copper-900">What we collect</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-copper-800">
        <li>Name, email, and the chapter you join</li>
        <li>Recipe details you enter (name, style, batch size, gravities, ABV, IBU, colour, notes)</li>
        <li>Who you share a recipe with, inside your chapter only</li>
        <li>A salted hash of your IP on audit events — never the raw address</li>
      </ul>
      <h2 className="mt-8 text-lg font-medium text-copper-900">Your rights</h2>
      <p className="mt-2 text-copper-800">
        After signing in you can export everything we hold, correct your profile, or delete your
        account. Deletion is immediate. Recipes you shared are removed with the account.
      </p>
      <h2 className="mt-8 text-lg font-medium text-copper-900">Legal basis</h2>
      <p className="mt-2 text-copper-800">
        Operating your account and recipes is Art. 6(1)(b) contract. Consent at signup (Art. 7)
        records that you agree to this processing. The audit trail is Art. 6(1)(f) legitimate
        interest and Art. 5(2) accountability, retained for 12 months.
      </p>
      <p className="mt-8 text-sm text-copper-700">
        <Link href="/signup" className="underline hover:no-underline">
          Back to signup
        </Link>
      </p>
    </main>
  );
}
