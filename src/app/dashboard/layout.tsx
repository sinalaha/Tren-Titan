import { ProtectedShell } from "@/components/layout/ProtectedShell";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
