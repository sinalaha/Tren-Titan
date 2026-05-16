import "./globals.css";

import type { Metadata } from "next";

import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Tren Titan",
  description: "AI-powered fitness mission control platform"
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  /** Static GitHub Pages build (no middleware / OAuth server). See `NEXT_PUBLIC_GITHUB_PAGES`. */
  const session =
    process.env.NEXT_PUBLIC_GITHUB_PAGES === "1" || process.env.NEXT_STATIC_EXPORT === "1"
      ? null
      : await auth();

  return (
    <html lang="ru">
      <body>
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
