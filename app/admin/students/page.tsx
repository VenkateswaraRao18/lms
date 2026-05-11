import { prisma } from "@/lib/prisma";
import { createStudentUser } from "@/actions/user-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminStudentsPage() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { enrollments: true } },
    },
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Students</h1>
        <p className="mt-2 text-muted-foreground">
          Accounts stay password-based — issue credentials directly to your cohort.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Create student</h2>
        <form action={createStudentUser} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="bg-background" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <Input id="password" name="password" type="password" required minLength={8} className="bg-background" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Create account</Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s._count.enrollments}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.createdAt.toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {students.length === 0 ? (
          <div className="border-t border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No student accounts yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
