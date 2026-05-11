"use server";

import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/actions/guard";

export async function markLessonComplete(lessonId: string) {
  const user = await requireStudent();
  const allowed = await canAccessLesson(user.id, lessonId);
  if (!allowed) throw new Error("Lesson locked.");

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId },
    update: { completedAt: new Date() },
  });

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (lesson) {
    const courseId = lesson.module.courseId;
    revalidatePath(`/student/courses/${courseId}`);
    revalidatePath(`/student/lesson/${lessonId}`);
    const modQuiz = await prisma.quiz.findUnique({
      where: { moduleId: lesson.moduleId },
      select: { id: true },
    });
    if (modQuiz) {
      revalidatePath(`/student/quiz/${modQuiz.id}`);
    }
  }
}
