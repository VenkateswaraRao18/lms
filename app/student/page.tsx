import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function StudentHomePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId,
      course: { published: true },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          published: true,
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
    take: 6,
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          Pick up where you left off — modules unlock as you pass each checkpoint quiz.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold">Continue learning</h2>
          <Link
            href="/student/courses"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            View all courses
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.map((e) => (
            <Card key={e.id} className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">{e.course.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">{e.course.description}</p>
                <Link
                  href={`/student/courses/${e.course.id}`}
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Open course
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {enrollments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            You are not enrolled in any courses yet. Ask your instructor for access.
          </div>
        ) : null}
      </section>
    </div>
  );
}
