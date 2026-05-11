import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function StudentCoursesPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      course: { published: true },
    },
    include: {
      course: true,
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My courses</h1>
        <p className="mt-2 text-muted-foreground">
          Every course follows the same rhythm: lessons first, module quiz last, then the next module unlocks.
        </p>
      </div>

      <div className="grid gap-4">
        {enrollments.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
          >
            <div>
              <div className="font-medium">{e.course.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{e.course.description}</div>
            </div>
            <Link
              href={`/student/courses/${e.course.id}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Enter
            </Link>
          </div>
        ))}
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No enrollments yet.
        </div>
      ) : null}
    </div>
  );
}
