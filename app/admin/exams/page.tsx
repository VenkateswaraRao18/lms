import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminExamsPage() {
  const exams = await prisma.writtenExam.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      course: { select: { title: true } },
      _count: { select: { submissions: true, questions: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Written exams</h1>
          <p className="mt-2 text-muted-foreground">
            Learners type answers; you score <strong className="text-foreground">0–10</strong>. After they acknowledge the
            result, their submission is removed to save database space.
          </p>
        </div>
        <Link href="/admin/exams/new" className={cn(buttonVariants())}>
          New exam
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exams.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell>{e.course.title}</TableCell>
                <TableCell>{e._count.questions}</TableCell>
                <TableCell>{e._count.submissions}</TableCell>
                <TableCell>
                  {e.published ? (
                    <Badge variant="secondary">Published</Badge>
                  ) : (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/exams/${e.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {exams.length === 0 ? (
          <div className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No exams yet — create one and publish when ready.
          </div>
        ) : null}
      </div>
    </div>
  );
}
