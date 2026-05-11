import Link from "next/link";
import { createCourse } from "@/actions/course-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewCoursePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to courses
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Create course</h1>
        <p className="mt-2 text-muted-foreground">
          Start with a title and description — modules and quizzes come next.
        </p>
      </div>

      <form action={createCourse} className="space-y-6 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={6} className="bg-background" />
        </div>
        <Button type="submit">Create draft</Button>
      </form>
    </div>
  );
}
