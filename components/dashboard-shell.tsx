"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ClipboardList,
  Cpu,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/exams", label: "Exams", icon: FileText },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/ai", label: "AI Studio", icon: Cpu },
  { href: "/admin/submissions", label: "Submissions", icon: ClipboardList },
];

const studentLinks = [
  { href: "/student", label: "Overview", icon: LayoutDashboard },
  { href: "/student/courses", label: "My courses", icon: BookOpen },
  { href: "/student/exams", label: "Exams", icon: FileText },
];

export function DashboardShell({
  variant,
  displayName,
  children,
}: {
  variant: "admin" | "student";
  displayName?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = variant === "admin" ? adminLinks : studentLinks;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-[260px] shrink-0 flex-col border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[4px_0_24px_-12px_oklch(0_0_0_/_35%)]">
        <div className="border-b border-sidebar-border/80 px-5 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary/60 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20">
              S
            </div>
            <div>
              <div className="font-display text-[15px] font-bold tracking-tight text-sidebar-foreground">
                Studio LMS
              </div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {variant === "admin" ? "Instructor" : "Learner"}
              </div>
            </div>
          </div>
          {displayName ? (
            <div className="mt-5 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-2 text-[13px] text-muted-foreground">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground/80">Signed in</span>
              <div className="mt-0.5 truncate font-medium text-sidebar-foreground">{displayName}</div>
            </div>
          ) : null}
        </div>
        <nav className="flex flex-col gap-0.5 px-3 py-5">
          {links.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/student" &&
                item.href !== "/admin" &&
                pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                {active ? (
                  <span
                    className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_oklch(0.65_0.14_252_/_50%)]"
                    aria-hidden
                  />
                ) : null}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-opacity",
                    active ? "text-primary" : "opacity-70 group-hover:opacity-100",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-sidebar-border/80 p-4">
          <Button
            variant="outline"
            className="w-full gap-2 border-sidebar-border/80 bg-sidebar-accent/30 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="product-canvas relative min-w-0 flex-1">
        <div className="relative mx-auto max-w-6xl px-6 py-10 sm:px-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
