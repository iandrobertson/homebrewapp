import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homebrew",
  description: "Save, organise and share homebrew recipes with your chapter.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <body data-nonce={nonce} className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
