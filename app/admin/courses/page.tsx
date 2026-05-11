import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { publishCourse, unpublishCourse } from "@/actions/course-actions";
import { DeleteCourseButton } from "@/components/admin/delete-course-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { modules: true, enrollments: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-2 text-muted-foreground">
            Author sequenced modules, quizzes, and assignments for your cohort.
          </p>
        </div>
        <Link href="/admin/courses/new" className={cn(buttonVariants())}>
          New course
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Modules</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell>{c._count.modules}</TableCell>
                <TableCell>{c._count.enrollments}</TableCell>
                <TableCell>
                  {c.published ? (
                    <Badge variant="secondary">Published</Badge>
                  ) : (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                    {c.published ? (
                      <form action={unpublishCourse.bind(null, c.id)} className="inline">
                        <button
                          type="submit"
                          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                        >
                          Unpublish
                        </button>
                      </form>
                    ) : (
                      <form action={publishCourse.bind(null, c.id)} className="inline">
                        <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
                          Publish
                        </button>
                      </form>
                    )}
                    <DeleteCourseButton courseId={c.id} label="Delete" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {courses.length === 0 ? (
          <div className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No courses yet — create one to get started.
          </div>
        ) : null}
      </div>
    </div>
  );
}
