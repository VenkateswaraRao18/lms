import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { publishCourse, unpublishCourse, updateCourse } from "@/actions/course-actions";
import { createModule } from "@/actions/module-actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CourseEnrollmentControls } from "@/components/course-enrollment-controls";
import { ModuleOrderButtons } from "@/components/module-order-buttons";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CourseEditTabs } from "@/components/admin/course-edit-tabs";
import { DeleteCourseButton } from "@/components/admin/delete-course-button";

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { orderBy: { orderIndex: "asc" } },
      enrollments: { select: { userId: true } },
    },
  });

  if (!course) notFound();

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const enrolledIds = course.enrollments.map((e) => e.userId);
  const moduleIds = course.modules.map((m) => m.id);

  const basicsTab = (
    <>
      {!course.published ? (
        <Alert className="border-primary/25 bg-card">
          <AlertTitle>Draft — students cannot see this yet</AlertTitle>
          <AlertDescription className="text-muted-foreground">
            Review lessons and each module&apos;s five-question quiz, then use{" "}
            <strong className="text-foreground">Publish now</strong> or check{" "}
            <strong className="text-foreground">Published</strong> below.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <h2 className="text-lg font-semibold">Course details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Name, summary, and visibility. Saving updates the course immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!course.published ? (
              <form action={publishCourse.bind(null, course.id)}>
                <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                  Publish now
                </button>
              </form>
            ) : (
              <form action={unpublishCourse.bind(null, course.id)}>
                <button
                  type="submit"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Unpublish
                </button>
              </form>
            )}
          </div>
        </div>

        <form action={updateCourse.bind(null, course.id)} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={course.title} required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={6}
              defaultValue={course.description}
              className="bg-background"
            />
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="published"
              value="on"
              defaultChecked={course.published}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="font-medium text-foreground">Published</span>
              <span className="mt-0.5 block text-muted-foreground">
                When checked, enrolled students see this course on their dashboard. Module quizzes still control progression.
              </span>
            </span>
          </label>
          <button type="submit" className={cn(buttonVariants())}>
            Save changes
          </button>
        </form>

        <div className="mt-10 border-t border-border pt-8">
          <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Deletes this course and all modules, lessons, quizzes, and enrollments.
          </p>
          <div className="mt-4">
            <DeleteCourseButton
              courseId={course.id}
              label="Delete entire course"
              size="default"
              redirectTo="/admin/courses"
            />
          </div>
        </div>
      </section>
    </>
  );

  const modulesTab = (
    <section className="rounded-xl border border-border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Modules</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Order matters: learners must pass each module quiz before the next unlocks. Open a module to edit lessons and its quiz.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {course.modules.map((m, index) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
          >
            <div>
              <div className="font-medium">
                {index + 1}. {m.title}
              </div>
              {m.description ? (
                <div className="mt-1 text-sm text-muted-foreground">{m.description}</div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ModuleOrderButtons courseId={course.id} moduleIds={moduleIds} index={index} />
              <Link
                href={`/admin/courses/${course.id}/modules/${m.id}`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Edit module
              </Link>
            </div>
          </div>
        ))}
      </div>

      <form action={createModule.bind(null, course.id)} className="mt-8 space-y-4 border-t border-border pt-8">
        <div className="text-sm font-medium">Add another module</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="m-title">Title</Label>
            <Input id="m-title" name="title" required className="bg-background" placeholder="e.g. Week 3 — APIs" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="m-desc">Short description (optional)</Label>
            <Textarea id="m-desc" name="description" rows={3} className="bg-background" />
          </div>
        </div>
        <button type="submit" className={cn(buttonVariants({ variant: "secondary" }))}>
          Create module
        </button>
      </form>
    </section>
  );

  const studentsTab = (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">Enrollment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Only enrolled students can open lessons and quizzes. Publishing alone does not enroll anyone.
      </p>
      <div className="mt-6">
        <CourseEnrollmentControls courseId={course.id} students={students} enrolledIds={enrolledIds} />
      </div>
    </section>
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Courses
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
              {course.published ? (
                <Badge variant="secondary">Published</Badge>
              ) : (
                <Badge variant="outline">Draft</Badge>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>
          </div>
          <Link
            href={`/admin/courses/${course.id}/preview`}
            className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
          >
            Student preview
          </Link>
        </div>
      </div>

      <CourseEditTabs basics={basicsTab} modules={modulesTab} students={studentsTab} />
    </div>
  );
}
