import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LessonMarkdown } from "@/components/lesson-markdown";

export default async function AdminAssignmentStudentPreviewPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { lesson: { include: { module: { include: { course: true } } } } },
  });

  if (!assignment || assignment.lesson.module.course.id !== courseId) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/admin/courses/${courseId}/preview`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {assignment.lesson.module.course.title}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{assignment.title}</h1>
        {assignment.dueAt ? (
          <p className="mt-3 text-sm text-muted-foreground">Due {assignment.dueAt.toLocaleString()}</p>
        ) : null}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <LessonMarkdown markdown={assignment.description} />
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Learners upload files and type answers on the real assignment page. Submission is{" "}
        <strong className="text-foreground">disabled</strong> in preview.
      </div>
    </div>
  );
}
