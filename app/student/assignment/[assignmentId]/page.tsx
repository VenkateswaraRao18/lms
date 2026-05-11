import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";
import { submitAssignment } from "@/actions/assignment-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { LessonMarkdown } from "@/components/lesson-markdown";

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      lesson: { include: { module: { include: { course: true } } } },
      submissions: { where: { userId } },
    },
  });

  if (!assignment) notFound();

  const allowed = await canAccessLesson(userId, assignment.lessonId);
  if (!allowed) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold">Assignment locked</h1>
        <p className="mt-2 text-muted-foreground">
          Complete earlier checkpoints to access this project.
        </p>
        <Link
          href={`/student/courses/${assignment.lesson.module.course.id}`}
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 inline-flex")}
        >
          Back to course
        </Link>
      </div>
    );
  }

  const submission = assignment.submissions[0];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/student/courses/${assignment.lesson.module.course.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {assignment.lesson.module.course.title}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{assignment.title}</h1>
        <div className="mt-4 max-w-3xl">
          <LessonMarkdown markdown={assignment.description} />
        </div>
        {assignment.dueAt ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Due {assignment.dueAt.toLocaleString()}
          </p>
        ) : null}
      </div>

      <form action={submitAssignment.bind(null, assignment.id)} className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="textAnswer">Written response</Label>
          <Textarea
            id="textAnswer"
            name="textAnswer"
            rows={8}
            defaultValue={submission?.textAnswer ?? ""}
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">Attach file (optional)</Label>
          <Input id="file" name="file" type="file" className="bg-background" />
          <p className="text-xs text-muted-foreground">PDF, PNG, JPG, WEBP, or TXT — max 10MB.</p>
        </div>
        <Button type="submit">Submit work</Button>
      </form>

      {submission ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm">
          <div className="font-medium">Submission status</div>
          <div className="mt-2 text-muted-foreground">
            {submission.status === "REVIEWED" ? "Reviewed by instructor" : "Awaiting review"}
          </div>
          {submission.feedback ? (
            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/40 p-4">{submission.feedback}</div>
          ) : null}
          {submission.filePath ? (
            <div className="mt-4">
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={`/api/files/submissions/${submission.id}`}
              >
                Download your uploaded file
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
