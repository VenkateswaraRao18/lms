import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  deleteWrittenExam,
  gradeWrittenExamSubmission,
  updateWrittenExam,
} from "@/actions/written-exam-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default async function AdminExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  const exam = await prisma.writtenExam.findUnique({
    where: { id: examId },
    include: {
      course: { select: { title: true } },
      questions: { orderBy: { orderIndex: "asc" } },
      submissions: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!exam) notFound();

  const submissionCount = exam.submissions.length;
  const questionsBlock = exam.questions.map((q) => q.prompt).join("\n");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/exams" className="text-sm text-muted-foreground hover:text-foreground">
            ← Written exams
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{exam.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{exam.course.title}</p>
        </div>
        <form action={deleteWrittenExam.bind(null, exam.id)}>
          <Button type="submit" variant="destructive">
            Delete exam
          </Button>
        </form>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Exam settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {submissionCount > 0
            ? "Questions are locked while submissions exist — you can still edit title, instructions, and visibility."
            : "You can edit all fields. Each non-empty line is one question."}
        </p>
        <form action={updateWrittenExam.bind(null, exam.id)} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={exam.title} required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              name="instructions"
              rows={4}
              defaultValue={exam.instructions}
              className="bg-background"
            />
          </div>
          {submissionCount === 0 ? (
            <div className="space-y-2">
              <Label htmlFor="questions">Questions (one per line)</Label>
              <Textarea
                id="questions"
                name="questions"
                rows={10}
                required
                defaultValue={questionsBlock}
                className="bg-background font-mono text-sm"
              />
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              value="on"
              defaultChecked={exam.published}
              className="size-4 accent-primary"
            />
            <span>Published</span>
          </label>
          <Button type="submit">Save</Button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Submissions & grading</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Score each attempt <strong className="text-foreground">0–10</strong>. After the student confirms they saw their
          score, this row is removed automatically.
        </p>

        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Answers</TableHead>
                <TableHead className="min-w-[200px]">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exam.submissions.map((sub) => {
                const answers = JSON.parse(sub.answersJson) as Record<string, string>;
                return (
                  <TableRow key={sub.id} className="align-top">
                    <TableCell>
                      <div className="font-medium">{sub.user.name}</div>
                      <div className="text-xs text-muted-foreground">{sub.user.email}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {sub.submittedAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-xl">
                      <ul className="space-y-3 text-sm">
                        {exam.questions.map((q) => (
                          <li key={q.id}>
                            <div className="text-xs font-medium text-muted-foreground">{q.prompt}</div>
                            <div className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-background p-2">
                              {answers[q.id] ?? "—"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell>
                      {sub.score !== null ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Score: {sub.score} / 10</Badge>
                            {sub.gradedAt ? (
                              <span className="text-xs text-muted-foreground">
                                {sub.gradedAt.toLocaleDateString()}
                              </span>
                            ) : null}
                          </div>
                          {sub.feedback ? (
                            <div className="rounded-md border border-border bg-muted/30 p-2 text-xs whitespace-pre-wrap">
                              {sub.feedback}
                            </div>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            Awaiting learner “Okay” — row deletes after they dismiss.
                          </p>
                        </div>
                      ) : (
                        <form action={gradeWrittenExamSubmission.bind(null, sub.id)} className="space-y-2">
                          <div className="space-y-1">
                            <Label htmlFor={`score-${sub.id}`}>Score (0–10)</Label>
                            <Input
                              id={`score-${sub.id}`}
                              name="score"
                              type="number"
                              min={0}
                              max={10}
                              step={1}
                              required
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`fb-${sub.id}`}>Feedback (optional)</Label>
                            <Textarea
                              id={`fb-${sub.id}`}
                              name="feedback"
                              rows={3}
                              placeholder="Short comments for the student"
                              className="bg-background"
                            />
                          </div>
                          <Button type="submit" size="sm">
                            Save grade
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {exam.submissions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No submissions yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
