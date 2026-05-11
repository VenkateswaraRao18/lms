import { prisma } from "@/lib/prisma";
import { reviewSubmission } from "@/actions/assignment-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminSubmissionsPage() {
  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      user: true,
      assignment: {
        include: {
          lesson: {
            include: {
              module: { include: { course: true } },
            },
          },
        },
      },
    },
    take: 80,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Submissions</h1>
        <p className="mt-2 text-muted-foreground">
          Review uploads and written responses — learners see feedback instantly when marked reviewed.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[320px]">Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s.id} className="align-top">
                <TableCell>
                  <div className="font-medium">{s.user.name}</div>
                  <div className="text-xs text-muted-foreground">{s.user.email}</div>
                </TableCell>
                <TableCell>{s.assignment.lesson.module.course.title}</TableCell>
                <TableCell>{s.assignment.title}</TableCell>
                <TableCell>
                  {s.status === "REVIEWED" ? (
                    <Badge variant="secondary">Reviewed</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-3 text-sm">
                    {s.textAnswer ? (
                      <div className="rounded-md border border-border bg-background p-3 whitespace-pre-wrap">
                        {s.textAnswer}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No written answer.</div>
                    )}
                    {s.filePath ? (
                      <div>
                        <a
                          className="text-primary underline-offset-4 hover:underline"
                          href={`/api/files/submissions/${s.id}`}
                        >
                          Download upload ({s.fileName ?? "file"})
                        </a>
                      </div>
                    ) : null}
                    <form action={reviewSubmission.bind(null, s.id)} className="space-y-2">
                      <Textarea
                        name="feedback"
                        placeholder="Feedback for the learner"
                        defaultValue={s.feedback ?? ""}
                        rows={3}
                        className="bg-background"
                      />
                      <input type="hidden" name="status" value="REVIEWED" />
                      <Button type="submit" size="sm">
                        Mark reviewed
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {submissions.length === 0 ? (
          <div className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No submissions yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}
