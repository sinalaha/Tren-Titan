import { ProtectedShell } from "@/components/layout/ProtectedShell";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
