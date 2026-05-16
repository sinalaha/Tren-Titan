import { ProtectedShell } from "@/components/layout/ProtectedShell";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
