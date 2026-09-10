import Link from "next/link";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-8 md:grid-cols-[12rem_1fr]">
      <nav className="flex flex-col gap-2 text-sm">
        <Link href="/settings/profile" className="text-copper-800 hover:underline">
          Profile
        </Link>
        <Link href="/settings/privacy" className="text-copper-800 hover:underline">
          Privacy
        </Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}
