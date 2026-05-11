import Link from "next/link";

export default async function AdminCoursePreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-500/28 bg-amber-500/[0.08] px-4 py-3 text-sm shadow-sm dark:bg-amber-500/[0.06]">
        <p className="max-w-3xl text-foreground/90">
          <span className="font-semibold text-foreground">Student preview</span> — layout matches what learners see. Every
          module is unlocked here so drafts are reviewable. Quizzes show questions only (no graded attempts); assignments are
          read-only without submission.
        </p>
        <Link
          href={`/admin/courses/${courseId}`}
          className="shrink-0 font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to editing
        </Link>
      </div>
      {children}
    </div>
  );
}
