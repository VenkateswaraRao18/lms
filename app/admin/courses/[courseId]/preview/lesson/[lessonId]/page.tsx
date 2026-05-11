import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LessonMarkdown } from "@/components/lesson-markdown";

function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export default async function AdminLessonStudentPreviewPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { include: { course: true } } },
  });

  if (!lesson || lesson.module.courseId !== courseId) notFound();

  const embed = lesson.videoUrl ? youtubeEmbed(lesson.videoUrl) : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/courses/${courseId}/preview`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {lesson.module.course.title}
        </Link>
        <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{lesson.kind}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lesson.title}</h1>
      </div>

      {lesson.kind === "VIDEO" && lesson.videoUrl ? (
        embed ? (
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
            <iframe className="h-full w-full" src={embed} title={lesson.title} allowFullScreen />
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <a className="text-primary underline-offset-4 hover:underline" href={lesson.videoUrl}>
              Open video link
            </a>
          </div>
        )
      ) : null}

      {lesson.content ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <LessonMarkdown markdown={lesson.content} />
        </div>
      ) : null}

      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        In the learner app, learners use <strong className="text-foreground">Mark lesson complete</strong> here. Completion is
        hidden in preview-only mode.
      </div>
    </div>
  );
}
