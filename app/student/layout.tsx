import { DashboardShell } from "@/components/dashboard-shell";
import { auth } from "@/auth";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <DashboardShell variant="student" displayName={session?.user?.name}>
      {children}
    </DashboardShell>
  );
}
