"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { enrollStudent, unenrollStudent } from "@/actions/enrollment-actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function CourseEnrollmentControls({
  courseId,
  students,
  enrolledIds,
}: {
  courseId: string;
  students: { id: string; name: string; email: string }[];
  enrolledIds: string[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [pending, setPending] = useState(false);

  const available = students.filter((s) => !enrolledIds.includes(s.id));

  async function onEnroll() {
    if (!userId) return;
    setPending(true);
    try {
      await enrollStudent(courseId, userId);
      toast.success("Student enrolled.");
      setUserId("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not enroll.");
    } finally {
      setPending(false);
    }
  }

  async function onUnenroll(targetId: string) {
    setPending(true);
    try {
      await unenrollStudent(courseId, targetId);
      toast.success("Removed enrollment.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] space-y-2">
          <div className="text-sm font-medium">Enroll a student</div>
          <Select value={userId} onValueChange={(v) => setUserId(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Choose student" />
            </SelectTrigger>
            <SelectContent>
              {available.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" disabled={!userId || pending} onClick={onEnroll}>
          Enroll
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Enrolled learners</div>
        {enrolledIds.length === 0 ? (
          <div className="text-sm text-muted-foreground">No enrollments yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {students
              .filter((s) => enrolledIds.includes(s.id))
              .map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                >
                  <span>
                    {s.name} · {s.email}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    onClick={() => onUnenroll(s.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
