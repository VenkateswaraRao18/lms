import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { acknowledgeWrittenExamResult, submitWrittenExamAnswers } from "@/actions/written-exam-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function StudentExamAttemptPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { examId } = await params;

  const exam = await prisma.writtenExam.findUnique({
    where: { id: examId },
    include: {
      course: { select: { id: true, title: true, published: true } },
      questions: { orderBy: { orderIndex: "asc" } },
    },
  });

  if (!exam || !exam.published || !exam.course.published) notFound();

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: exam.courseId } },
  });
  if (!enrolled) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold">Not enrolled</h1>
        <p className="mt-2 text-muted-foreground">You must be enrolled in this course to take the exam.</p>
        <Link href="/student/exams" className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex")}>
          Back
        </Link>
      </div>
    );
  }

  const completion = await prisma.writtenExamCompletion.findUnique({
    where: { examId_userId: { examId, userId } },
  });
  if (completion) {
    return (
      <div className="space-y-6">
        <Link href="/student/exams" className="text-sm text-muted-foreground hover:text-foreground">
          ← Written exams
        </Link>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-2xl font-semibold">{exam.title}</h1>
          <p className="mt-4 text-muted-foreground">
            You completed this exam and acknowledged your result. Detailed answers were cleared from storage as requested.
          </p>
          <Link href="/student/exams" className={cn(buttonVariants(), "mt-6 inline-flex")}>
            Back to exams
          </Link>
        </div>
      </div>
    );
  }

  const submission = await prisma.writtenExamSubmission.findUnique({
    where: { examId_userId: { examId, userId } },
  });

  if (submission && submission.score !== null) {
    return (
      <div className="space-y-8">
        <Link href="/student/exams" className="text-sm text-muted-foreground hover:text-foreground">
          ← Written exams
        </Link>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{exam.course.title}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{exam.title}</h1>
          <p className="mt-2 text-muted-foreground">Your grade</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          <div className="text-4xl font-semibold tabular-nums">
            {submission.score}
            <span className="text-lg font-normal text-muted-foreground"> / 10</span>
          </div>
          {submission.feedback ? (
            <div className="mt-6 border-t border-border pt-6">
              <div className="text-sm font-medium text-foreground">Instructor feedback</div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{submission.feedback}</p>
            </div>
          ) : null}

          <form action={acknowledgeWrittenExamResult.bind(null, submission.id)} className="mt-8">
            <p className="mb-3 text-sm text-muted-foreground">
              Tap okay when you&apos;re done reviewing — your submission record will be deleted to save space.
            </p>
            <Button type="submit" size="lg">
              Okay
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (submission && submission.score === null) {
    return (
      <div className="space-y-6">
        <Link href="/student/exams" className="text-sm text-muted-foreground hover:text-foreground">
          ← Written exams
        </Link>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="text-2xl font-semibold">{exam.title}</h1>
          <p className="mt-4 text-muted-foreground">
            Your answers were submitted. Your instructor will grade this out of 10 — check back here later.
          </p>
          <Link href="/student/exams" className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex")}>
            Back to exam list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/student/exams" className="text-sm text-muted-foreground hover:text-foreground">
        ← Written exams
      </Link>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{exam.course.title}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{exam.title}</h1>
        {exam.instructions ? (
          <div className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">{exam.instructions}</div>
        ) : null}
      </div>

      <form action={submitWrittenExamAnswers.bind(null, exam.id)} className="space-y-8">
        {exam.questions.map((q, i) => (
          <div key={q.id} className="space-y-2">
            <Label htmlFor={q.id} className="text-base font-medium">
              {i + 1}. {q.prompt}
            </Label>
            <Textarea
              id={q.id}
              name={`answer_${q.id}`}
              required
              rows={6}
              className="bg-card"
              placeholder="Type your answer…"
            />
          </div>
        ))}
        <Button type="submit" size="lg">
          Submit answers
        </Button>
      </form>
    </div>
  );
}
