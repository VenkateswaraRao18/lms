import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";
import { markLessonComplete } from "@/actions/progress-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export default async function StudentLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { include: { course: true } },
      progress: { where: { userId } },
    },
  });

  if (!lesson) notFound();

  const allowed = await canAccessLesson(userId, lessonId);
  if (!allowed) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold">Lesson locked</h1>
        <p className="mt-2 text-muted-foreground">
          Complete the prior module quiz to unlock this content.
        </p>
        <Link
          href={`/student/courses/${lesson.module.course.id}`}
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex")}
        >
          Back to course
        </Link>
      </div>
    );
  }

  const embed = lesson.videoUrl ? youtubeEmbed(lesson.videoUrl) : null;
  const completed = lesson.progress.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/student/courses/${lesson.module.course.id}`}
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

      <div className="flex flex-wrap items-center gap-3">
        <form action={markLessonComplete.bind(null, lesson.id)}>
          <Button type="submit" variant={completed ? "outline" : "default"} disabled={completed}>
            {completed ? "Marked complete" : "Mark lesson complete"}
          </Button>
        </form>
      </div>
    </div>
  );
}
