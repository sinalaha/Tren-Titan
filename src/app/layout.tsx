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
  const session = await auth();

  return (
    <html lang="ru">
      <body>
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
