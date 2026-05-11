import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.role === "ADMIN") redirect("/admin");
  if (session?.user?.role === "STUDENT") redirect("/student");

  return (
    <div className="product-canvas relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="surface-card max-w-lg space-y-6 border-border/60 px-10 py-12 text-center shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Studio LMS</p>
        <h1 className="font-display text-balance text-[2.125rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:text-[2.375rem]">
          Teach clearly.
          <br />
          Track progress quietly.
        </h1>
        <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Courses, checkpoints, and assignments — with optional local AI to draft outlines. Built for a focused teaching
          workflow.
        </p>
        <div className="pt-2">
          <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "min-w-[160px] shadow-lg shadow-primary/15")}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
