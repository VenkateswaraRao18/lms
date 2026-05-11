import { DashboardShell } from "@/components/dashboard-shell";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <DashboardShell variant="admin" displayName={session?.user?.name}>
      {children}
    </DashboardShell>
  );
}
