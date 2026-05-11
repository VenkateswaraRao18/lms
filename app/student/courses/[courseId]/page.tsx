import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule, hasCompletedAllLessonsInModule } from "@/lib/access";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

export default async function StudentCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { courseId } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: {
      course: {
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
      },
    },
  });

  if (!enrollment || !enrollment.course.published) notFound();

  const course = enrollment.course;

  const access = await Promise.all(
    course.modules.map(async (m) => ({
      id: m.id,
      unlocked: await canAccessModule(userId, m.id),
    })),
  );

  const unlockedMap = new Map(access.map((a) => [a.id, a.unlocked]));

  const lessonsDoneByModule = new Map(
    await Promise.all(
      course.modules.map(async (m) => [m.id, await hasCompletedAllLessonsInModule(userId, m.id)] as const),
    ),
  );

  return (
    <div className="space-y-10">
      <div>
        <Link href="/student/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← My courses
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{course.title}</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">{course.description}</p>
      </div>

      <div className="space-y-6">
        {course.modules.map((module, idx) => {
          const unlocked = unlockedMap.get(module.id) ?? false;
          const lessonsComplete = lessonsDoneByModule.get(module.id) ?? false;
          const quizReady = Boolean(module.quiz && unlocked && lessonsComplete);
          return (
            <section key={module.id} className="rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Module {idx + 1}
                    {!unlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    ) : (
                      <Badge variant="secondary">Unlocked</Badge>
                    )}
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{module.title}</h2>
                  {module.description ? (
                    <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
                  ) : null}
                </div>
                {module.quiz && unlocked ? (
                  quizReady ? (
                    <Link
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                      href={`/student/quiz/${module.quiz.id}`}
                    >
                      Open module quiz
                    </Link>
                  ) : (
                    <span className="max-w-[220px] text-right text-xs leading-snug text-muted-foreground">
                      Mark every lesson below complete to unlock this quiz
                    </span>
                  )
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
                    {unlocked ? (
                      lesson.kind === "ASSIGNMENT" ? (
                        lesson.assignment ? (
                          <Link
                            className="text-primary underline-offset-4 hover:underline"
                            href={`/student/assignment/${lesson.assignment.id}`}
                          >
                            View assignment
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Awaiting assignment setup</span>
                        )
                      ) : (
                        <Link
                          className="text-primary underline-offset-4 hover:underline"
                          href={`/student/lesson/${lesson.id}`}
                        >
                          Open lesson
                        </Link>
                      )
                    ) : (
                      <span className="text-muted-foreground">Locked</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
