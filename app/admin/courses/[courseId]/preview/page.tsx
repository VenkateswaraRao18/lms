import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";

export default async function AdminCourseStudentPreviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { orderIndex: "asc" },
        include: {
          lessons: {
            orderBy: { orderIndex: "asc" },
            include: { assignment: true },
          },
          quiz: true,
        },
      },
    },
  });

  if (!course) notFound();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {course.published ? (
            <Badge variant="secondary">Published</Badge>
          ) : (
            <Badge variant="outline">Draft (learners only see published courses)</Badge>
          )}
        </div>
        <p className="mt-3 max-w-3xl text-muted-foreground">{course.description}</p>
      </div>

      <div className="space-y-6">
        {course.modules.map((module, idx) => (
          <section key={module.id} className="rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  Module {idx + 1}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                    Preview: unlocked
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold">{module.title}</h2>
                {module.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
                ) : null}
              </div>
              {module.quiz ? (
                <Link
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  href={`/admin/courses/${courseId}/preview/quiz/${module.quiz.id}`}
                >
                  View module quiz
                </Link>
              ) : null}
            </div>

            <div className="space-y-2 px-5 py-4">
              {module.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm"
                >
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{lesson.kind}</div>
                    <div className="font-medium">{lesson.title}</div>
                  </div>
                  {lesson.kind === "ASSIGNMENT" ? (
                    lesson.assignment ? (
                      <Link
                        className="text-primary underline-offset-4 hover:underline"
                        href={`/admin/courses/${courseId}/preview/assignment/${lesson.assignment.id}`}
                      >
                        View assignment
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Awaiting assignment setup</span>
                    )
                  ) : (
                    <Link
                      className="text-primary underline-offset-4 hover:underline"
                      href={`/admin/courses/${courseId}/preview/lesson/${lesson.id}`}
                    >
                      Open lesson
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
