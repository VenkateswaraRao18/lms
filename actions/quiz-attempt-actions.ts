"use server";

import { prisma } from "@/lib/prisma";
import { canAccessModule, canTakeQuiz } from "@/lib/access";
import { gradeQuiz } from "@/lib/quiz-grading";
import type { AnswerPayload } from "@/lib/quiz-grading";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/actions/guard";

export async function submitQuizAttempt(quizId: string, answers: AnswerPayload) {
  const user = await requireStudent();

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      module: { select: { courseId: true } },
    },
  });
  if (!quiz) throw new Error("Quiz not found.");

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: quiz.module.courseId } },
  });
  if (!enrolled) throw new Error("Not enrolled in this course.");

  const allowed = await canTakeQuiz(user.id, quizId);
  if (!allowed) {
    if (!(await canAccessModule(user.id, quiz.moduleId))) {
      throw new Error("Complete earlier modules before taking this quiz.");
    }
    throw new Error("Mark every lesson in this module complete before taking the quiz.");
  }

  const attemptCount = await prisma.quizAttempt.count({
    where: { quizId, userId: user.id },
  });

  const passedBefore = await prisma.quizAttempt.findFirst({
    where: { quizId, userId: user.id, passed: true },
  });

  if (passedBefore) {
    return { ok: true as const, alreadyPassed: true, score: passedBefore.score };
  }

  if (attemptCount >= quiz.maxAttempts) {
    throw new Error("Maximum quiz attempts reached.");
  }

  const { score, detail } = gradeQuiz(
    quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      correctIndex: q.correctIndex,
      correctBool: q.correctBool,
    })),
    answers,
  );

  const passed = score >= quiz.passingPercent;

  await prisma.quizAttempt.create({
    data: {
      quizId,
      userId: user.id,
      score,
      passed,
      answersJson: JSON.stringify(answers),
      attemptNum: attemptCount + 1,
    },
  });

  revalidatePath("/student");
  revalidatePath(`/student/courses/${quiz.module.courseId}`);

  return {
    ok: true as const,
    score,
    passed,
    passingPercent: quiz.passingPercent,
    detail,
  };
}
