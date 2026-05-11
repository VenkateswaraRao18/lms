import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteModule, updateModule } from "@/actions/module-actions";
import { createLesson, deleteLesson, updateLesson } from "@/actions/lesson-actions";
import { upsertAssignment } from "@/actions/assignment-actions";
import { uploadLessonResource } from "@/actions/lesson-resource-actions";
import { summarizeLessonWithOllama } from "@/actions/ai-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminQuizForm } from "@/components/admin-quiz-form";
import type { DraftQuestion } from "@/actions/quiz-actions";
export default async function AdminModuleEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;

  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    include: {
      course: true,
      lessons: {
        orderBy: { orderIndex: "asc" },
        include: { assignment: true, attachments: true },
      },
      quiz: { include: { questions: true } },
    },
  });

  if (!courseModule || courseModule.courseId !== courseId) notFound();

  const quizInitial = courseModule.quiz
    ? {
        title: courseModule.quiz.title,
        passingPercent: courseModule.quiz.passingPercent,
        maxAttempts: courseModule.quiz.maxAttempts,
        questions: courseModule.quiz.questions.map((q): DraftQuestion => {
          if (q.type === "MCQ") {
            const options = JSON.parse(q.optionsJson) as string[];
            const idx = q.correctIndex ?? 0;
            return { type: "MCQ", prompt: q.prompt, options, correctIndex: idx };
          }
          return {
            type: "TRUE_FALSE",
            prompt: q.prompt,
            correctBool: Boolean(q.correctBool),
          };
        }),
      }
    : null;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={`/admin/courses/${courseModule.course.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {courseModule.course.title}
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{courseModule.title}</h1>
            {courseModule.description ? (
              <p className="mt-2 text-muted-foreground">{courseModule.description}</p>
            ) : null}
          </div>
          <form action={deleteModule.bind(null, courseModule.id)}>
            <Button type="submit" variant="destructive">
              Delete module
            </Button>
          </form>
        </div>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Module settings</h2>
        <form action={updateModule.bind(null, courseModule.id)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={courseModule.title} required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={courseModule.description ?? ""}
              className="bg-background"
            />
          </div>
          <Button type="submit">Save module</Button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Lessons</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mix videos, notes, quizzes, and assignments — quizzes that gate progression live at the module level.
        </p>

        <div className="mt-6 space-y-8">
          {courseModule.lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-wide text-muted-foreground">{lesson.kind}</div>
                  <div className="mt-1 font-medium">{lesson.title}</div>
                </div>
                <form action={deleteLesson.bind(null, lesson.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Delete
                  </Button>
                </form>
              </div>

              <form action={updateLesson.bind(null, lesson.id)} className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Title</Label>
                  <Input name="title" defaultValue={lesson.title} required className="bg-card" />
                </div>
                <div className="space-y-2">
                  <Label>Kind</Label>
                  <select
                    name="kind"
                    defaultValue={lesson.kind}
                    className="border-input bg-card h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none"
                  >
                    <option value="VIDEO">VIDEO</option>
                    <option value="NOTES">NOTES</option>
                    <option value="QUIZ">QUIZ</option>
                    <option value="ASSIGNMENT">ASSIGNMENT</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Video URL</Label>
                  <Input name="videoUrl" defaultValue={lesson.videoUrl ?? ""} className="bg-card" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Content / notes</Label>
                  <Textarea name="content" rows={6} defaultValue={lesson.content ?? ""} className="bg-card" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" size="sm" variant="outline">
                    Save lesson
                  </Button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                <form
                  action={summarizeLessonWithOllama.bind(null, lesson.id)}
                  className="inline"
                >
                  <Button type="submit" size="sm" variant="secondary">
                    Append AI summary (Markdown)
                  </Button>
                </form>
              </div>

              <form action={uploadLessonResource.bind(null, lesson.id)} className="mt-4 flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Lesson resources</Label>
                  <Input type="file" name="file" className="bg-card" />
                </div>
                <Button type="submit" size="sm" variant="outline">
                  Upload
                </Button>
              </form>

              {lesson.attachments.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {lesson.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        className="text-primary underline-offset-4 hover:underline"
                        href={`/api/files/lesson-attachments/${a.id}`}
                      >
                        {a.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}

              {lesson.kind === "ASSIGNMENT" ? (
                <form action={upsertAssignment.bind(null, lesson.id)} className="mt-6 space-y-3 border-t border-border pt-4">
                  <div className="text-sm font-medium">Assignment</div>
                  <div className="space-y-2">
                    <Label>Brief title</Label>
                    <Input
                      name="title"
                      defaultValue={lesson.assignment?.title ?? lesson.title}
                      required
                      className="bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instructions</Label>
                    <Textarea
                      name="description"
                      rows={5}
                      defaultValue={lesson.assignment?.description ?? ""}
                      required
                      className="bg-card"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due date (optional)</Label>
                    <Input
                      type="datetime-local"
                      name="dueAt"
                      defaultValue={
                        lesson.assignment?.dueAt
                          ? new Date(lesson.assignment.dueAt).toISOString().slice(0, 16)
                          : ""
                      }
                      className="bg-card"
                    />
                  </div>
                  <Button type="submit" size="sm">
                    Save assignment
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </div>

        <form action={createLesson.bind(null, courseModule.id)} className="mt-8 space-y-4 border-t border-border pt-8">
          <div className="text-sm font-medium">Add lesson</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="l-title">Title</Label>
              <Input id="l-title" name="title" required className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>Kind</Label>
              <select
                name="kind"
                defaultValue="NOTES"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none"
              >
                <option value="VIDEO">VIDEO</option>
                <option value="NOTES">NOTES</option>
                <option value="QUIZ">QUIZ</option>
                <option value="ASSIGNMENT">ASSIGNMENT</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="l-content">Content</Label>
              <Textarea id="l-content" name="content" rows={4} className="bg-background" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="l-video">Video URL</Label>
              <Input id="l-video" name="videoUrl" className="bg-background" />
            </div>
          </div>
          <Button type="submit">Create lesson</Button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Module quiz (gates next module)</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Edit prompts, choices, or order; add or remove questions anytime. AI drafts often include five questions — adjust as
          needed. Learners only open this quiz after{" "}
          <strong className="font-medium text-foreground">every lesson in this module</strong> is marked complete; passing the
          quiz then unlocks the next module.
        </p>
        <div className="mt-6">
          <AdminQuizForm moduleId={courseModule.id} initial={quizInitial} />
        </div>
      </section>
    </div>
  );
}
