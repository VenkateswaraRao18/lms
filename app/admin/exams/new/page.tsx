import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createWrittenExamAndRedirect } from "@/actions/written-exam-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function AdminNewExamPage() {
  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/admin/exams" className="text-sm text-muted-foreground hover:text-foreground">
          ← Written exams
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">New written exam</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One line per question. Students answer each in a text box. You grade out of 10 after submission.
        </p>
      </div>

      <form action={createWrittenExamAndRedirect} className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="courseId">Course</Label>
          <select
            id="courseId"
            name="courseId"
            required
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm shadow-xs outline-none"
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Exam title</Label>
          <Input id="title" name="title" required placeholder="e.g. Midterm — short answers" className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions for students</Label>
          <Textarea
            id="instructions"
            name="instructions"
            rows={4}
            placeholder="Time guidance, format expectations, etc."
            className="bg-background"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="questions">Questions (one per line)</Label>
          <Textarea
            id="questions"
            name="questions"
            rows={10}
            required
            placeholder={"Define X.\nExplain Y in your own words.\nCompare A and B."}
            className="bg-background font-mono text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="published" value="on" className="size-4 accent-primary" />
          <span>Published (visible to enrolled students)</span>
        </label>
        <div className="flex gap-3">
          <Button type="submit">Create exam</Button>
          <Link href="/admin/exams" className={cn(buttonVariants({ variant: "outline" }))}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
