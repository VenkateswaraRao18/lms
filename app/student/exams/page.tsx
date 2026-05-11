import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function StudentExamsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  if (courseIds.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Written exams</h1>
        <p className="text-muted-foreground">Enroll in a course to see exams.</p>
      </div>
    );
  }

  const publishedCourseIds = (
    await prisma.course.findMany({
      where: { id: { in: courseIds }, published: true },
      select: { id: true },
    })
  ).map((c) => c.id);

  const exams =
    publishedCourseIds.length === 0
      ? []
      : await prisma.writtenExam.findMany({
          where: {
            courseId: { in: publishedCourseIds },
            published: true,
          },
          include: {
            course: { select: { title: true } },
            completions: { where: { userId } },
            submissions: { where: { userId } },
          },
          orderBy: { updatedAt: "desc" },
        });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Written exams</h1>
        <p className="mt-2 text-muted-foreground">
          Type your answers; your instructor scores each attempt out of 10. After you acknowledge your result, it is removed
          from the system to save space.
        </p>
      </div>

      <div className="space-y-3">
        {exams.map((exam) => {
          const done = exam.completions.length > 0;
          const sub = exam.submissions[0];
          let status: "done" | "result" | "wait" | "take" = "take";
          if (done) status = "done";
          else if (sub?.score != null) status = "result";
          else if (sub) status = "wait";

          return (
            <div
              key={exam.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4"
            >
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{exam.course.title}</div>
                <div className="mt-1 font-medium">{exam.title}</div>
                {status === "wait" ? (
                  <p className="mt-1 text-sm text-muted-foreground">Waiting for instructor grade…</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {status === "done" ? (
                  <Badge variant="outline">Completed</Badge>
                ) : status === "wait" ? (
                  <Badge variant="secondary">Submitted</Badge>
                ) : status === "result" ? (
                  <Badge variant="default">Graded — view result</Badge>
                ) : (
                  <Badge variant="outline">Open</Badge>
                )}
                <Link href={`/student/exams/${exam.id}`} className={cn(buttonVariants({ size: "sm" }))}>
                  {status === "done"
                    ? "View"
                    : status === "wait"
                      ? "Status"
                      : status === "result"
                        ? "View result"
                        : "Start"}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No published exams in your courses yet.
        </div>
      ) : null}
    </div>
  );
}
