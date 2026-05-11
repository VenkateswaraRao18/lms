import { prisma } from "@/lib/prisma";

/** Student must be enrolled and satisfy prior-module quiz rule. */
export async function canAccessModule(userId: string, moduleId: string): Promise<boolean> {
  const courseModule = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, courseId: true, orderIndex: true },
  });
  if (!courseModule) return false;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: courseModule.courseId } },
  });
  if (!enrollment) return false;

  if (courseModule.orderIndex <= 0) return true;

  const previous = await prisma.module.findFirst({
    where: { courseId: courseModule.courseId, orderIndex: courseModule.orderIndex - 1 },
    include: { quiz: true },
  });

  if (!previous?.quiz) return true;

  const passed = await prisma.quizAttempt.findFirst({
    where: { userId, quizId: previous.quiz.id, passed: true },
  });

  return !!passed;
}

export async function canAccessLesson(userId: string, lessonId: string): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true },
  });
  if (!lesson) return false;
  return canAccessModule(userId, lesson.moduleId);
}

/** Every lesson in the module must have progress before the module quiz unlocks. */
export async function hasCompletedAllLessonsInModule(userId: string, moduleId: string): Promise<boolean> {
  const lessons = await prisma.lesson.findMany({
    where: { moduleId },
    select: { id: true },
  });
  if (lessons.length === 0) return true;

  const completed = await prisma.lessonProgress.count({
    where: {
      userId,
      lessonId: { in: lessons.map((l) => l.id) },
    },
  });

  return completed >= lessons.length;
}

/** Prior-module quiz passed + all lessons in this module marked complete. */
export async function canTakeQuiz(userId: string, quizId: string): Promise<boolean> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { moduleId: true },
  });
  if (!quiz) return false;
  if (!(await canAccessModule(userId, quiz.moduleId))) return false;
  return hasCompletedAllLessonsInModule(userId, quiz.moduleId);
}

export async function assertStudentEnrollment(userId: string, courseId: string) {
  const row = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return !!row;
}
