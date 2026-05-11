"use server";

import { QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

export type DraftQuestion =
  | {
      type: "MCQ";
      prompt: string;
      options: string[];
      correctIndex: number;
    }
  | {
      type: "TRUE_FALSE";
      prompt: string;
      correctBool: boolean;
    };

export async function upsertModuleQuiz(moduleId: string, payload: {
  title: string;
  passingPercent: number;
  maxAttempts: number;
  questions: DraftQuestion[];
}) {
  await requireAdmin();
  const title = payload.title.trim();
  if (!title) throw new Error("Quiz title is required.");
  if (payload.passingPercent < 0 || payload.passingPercent > 100) throw new Error("Invalid passing percent.");
  if (payload.maxAttempts < 1 || payload.maxAttempts > 50) throw new Error("Invalid attempt limit.");
  if (!payload.questions.length) throw new Error("Add at least one question.");

  for (const q of payload.questions) {
    if (!q.prompt?.trim()) throw new Error("Each question must have a prompt.");
  }

  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) throw new Error("Module not found.");

  await prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.upsert({
      where: { moduleId },
      create: {
        moduleId,
        title,
        passingPercent: payload.passingPercent,
        maxAttempts: payload.maxAttempts,
      },
      update: {
        title,
        passingPercent: payload.passingPercent,
        maxAttempts: payload.maxAttempts,
      },
    });

    await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });

    for (const q of payload.questions) {
      if (q.type === "MCQ") {
        const options = q.options.map((o) => o.trim()).filter(Boolean);
        if (options.length < 2) throw new Error("MCQ requires at least two options.");
        if (q.correctIndex < 0 || q.correctIndex >= options.length) throw new Error("Invalid correct answer.");
        await tx.quizQuestion.create({
          data: {
            quizId: quiz.id,
            type: QuestionType.MCQ,
            prompt: q.prompt.trim(),
            optionsJson: JSON.stringify(options),
            correctIndex: q.correctIndex,
            correctBool: null,
          },
        });
      } else {
        await tx.quizQuestion.create({
          data: {
            quizId: quiz.id,
            type: QuestionType.TRUE_FALSE,
            prompt: q.prompt.trim(),
            optionsJson: JSON.stringify(["False", "True"]),
            correctIndex: null,
            correctBool: q.correctBool,
          },
        });
      }
    }
  });

  revalidatePath(`/admin/courses/${mod.courseId}/modules/${moduleId}`);
}

export async function deleteQuiz(moduleId: string) {
  await requireAdmin();
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  await prisma.quiz.deleteMany({ where: { moduleId } });
  if (mod) revalidatePath(`/admin/courses/${mod.courseId}/modules/${moduleId}`);
}
