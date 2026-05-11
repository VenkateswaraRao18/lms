import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { PublicQuestion } from "@/types/quiz-public";
import { QuizPreviewReadonly } from "@/components/quiz-preview-readonly";

export default async function AdminQuizStudentPreviewPage({
  params,
}: {
  params: Promise<{ courseId: string; quizId: string }>;
}) {
  const { courseId, quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: true, module: true },
  });

  if (!quiz || quiz.module.courseId !== courseId) notFound();

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) notFound();

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
        <Link href={`/admin/courses/${courseId}/preview`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {course.title}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{quiz.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Learners see this after they complete every lesson in the module and pass prior checks. Grading and attempts are
          disabled in admin preview.
        </p>
      </div>

      <QuizPreviewReadonly
        passingPercent={quiz.passingPercent}
        maxAttempts={quiz.maxAttempts}
        questions={publicQuestions}
      />
    </div>
  );
}
