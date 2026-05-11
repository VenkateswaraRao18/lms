import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminHomePage() {
  const [courses, students, attempts] = await Promise.all([
    prisma.course.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.quizAttempt.count(),
  ]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="Snapshot of your workspace — courses, roster size, and quiz activity."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="surface-card border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-base">Courses</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{courses}</CardContent>
        </Card>
        <Card className="surface-card border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-base">Students</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{students}</CardContent>
        </Card>
        <Card className="surface-card border-border/70 bg-card/90">
          <CardHeader>
            <CardTitle className="text-base">Quiz attempts</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{attempts}</CardContent>
        </Card>
      </div>

      <Card className="surface-card border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle className="text-base">Next steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Create a course, add sequenced modules, attach lessons, and gate forward progress with a module
            quiz.
          </p>
          <p>
            Head to{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/admin/courses">
              Courses
            </Link>{" "}
            or open{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/admin/ai">
              AI Studio
            </Link>{" "}
            when Ollama is running locally.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
