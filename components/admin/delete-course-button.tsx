"use client";

import { useTransition, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { deleteCourse } from "@/actions/course-actions";
import { Button } from "@/components/ui/button";

type Props = {
  courseId: string;
  label?: string;
  /** After delete, navigate here (e.g. `/admin/courses` from the course editor). */
  redirectTo?: string;
} & Pick<ComponentProps<typeof Button>, "size" | "variant">;

export function DeleteCourseButton({
  courseId,
  label = "Delete",
  size = "sm",
  variant = "destructive",
  redirectTo,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            "Delete this course and all modules, lessons, and quizzes? This cannot be undone.",
          )
        ) {
          return;
        }
        startTransition(async () => {
          await deleteCourse(courseId);
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        });
      }}
    >
      {pending ? "Deleting…" : label}
    </Button>
  );
}
