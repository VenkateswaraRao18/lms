import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule, hasCompletedAllLessonsInModule } from "@/lib/access";
import { QuizTakeForm, type PublicQuestion } from "@/components/quiz-take-form";

export default async function StudentQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      module: { include: { course: true } },
    },
  });

  if (!quiz) notFound();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: quiz.module.course.id } },
  });
  if (!enrollment || !quiz.module.course.published) notFound();

  const moduleAccess = await canAccessModule(userId, quiz.module.id);
  const lessonsDone = await hasCompletedAllLessonsInModule(userId, quiz.module.id);
  const allowed = moduleAccess && lessonsDone;

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizId, userId },
    orderBy: { completedAt: "desc" },
  });

  const passedBefore = attempts.find((a) => a.passed);

  const publicQuestions: PublicQuestion[] = quiz.questions.map((q) => {
    if (q.type === "MCQ") {
      const options = JSON.parse(q.optionsJson) as string[];
      return { id: q.id, type: "MCQ", prompt: q.prompt, options };
    }
    return { id: q.id, type: "TRUE_FALSE", prompt: q.prompt };
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/student/courses/${quiz.module.course.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {quiz.module.course.title}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{quiz.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Passing unlocks the next module when it exists — attempts are enforced server-side.
        </p>
      </div>

      {!allowed ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {!moduleAccess ? (
            <>
              This quiz unlocks after you <strong className="text-foreground">pass the previous module&apos;s quiz</strong>{" "}
              (when there is one).
            </>
          ) : (
            <>
              Finish <strong className="text-foreground">every lesson</strong> in this module (use{" "}
              <strong className="text-foreground">Mark lesson complete</strong> on each lesson page). Then you can take this
              quiz.
            </>
          )}
          <div className="mt-4">
            <Link
              href={`/student/courses/${quiz.module.course.id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Back to course outline
            </Link>
          </div>
        </div>
      ) : (
        <QuizTakeForm
          quizId={quiz.id}
          passingPercent={quiz.passingPercent}
          maxAttempts={quiz.maxAttempts}
          attemptsUsed={attempts.length}
          alreadyPassed={Boolean(passedBefore)}
          questions={publicQuestions}
        />
      )}
    </div>
  );
}
