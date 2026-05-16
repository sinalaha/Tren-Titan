interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
