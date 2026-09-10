import Link from "next/link";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-copper-600">Chapter recipes</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-copper-900">Homebrew</h1>
      <p className="mt-4 text-lg text-copper-800">
        Save your beers, let gravity work out the ABV, and share a batch with
        another member of your regional chapter.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {user ? (
          <Link
            href="/recipes"
            className="rounded-md bg-copper-700 px-5 py-2.5 font-medium text-white hover:bg-copper-800"
          >
            Your recipes
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-md bg-copper-700 px-5 py-2.5 font-medium text-white hover:bg-copper-800"
            >
              Create an account
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-copper-300 px-5 py-2.5 font-medium text-copper-900 hover:bg-copper-100"
            >
              Sign in
            </Link>
          </>
        )}
      </div>
      <p className="mt-10 text-sm text-copper-700">
        <Link href="/privacy" className="underline hover:no-underline">
          Privacy notice
        </Link>
      </p>
    </main>
  );
}
