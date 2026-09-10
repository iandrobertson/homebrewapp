import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md px-6 py-16">
      <Link href="/" className="text-sm font-medium text-copper-700 hover:underline">
        Homebrew
      </Link>
      {children}
    </div>
  );
}
