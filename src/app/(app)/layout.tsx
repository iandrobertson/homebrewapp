import Link from "next/link";
import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-copper-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/recipes" className="font-semibold text-copper-900">
            Homebrew
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/recipes" className="text-copper-800 hover:underline">
              Recipes
            </Link>
            <Link href="/settings/profile" className="text-copper-800 hover:underline">
              Settings
            </Link>
            <span className="hidden text-copper-600 sm:inline">{user.name}</span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
    </div>
  );
}
