"use server";

import { LessonKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

function parseKind(raw: FormDataEntryValue | null): LessonKind {
  const s = String(raw ?? "").toUpperCase();
  if (s === "VIDEO" || s === "NOTES" || s === "QUIZ" || s === "ASSIGNMENT") return s as LessonKind;
  return "NOTES";
}

export async function createLesson(moduleId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const kind = parseKind(formData.get("kind"));
  const content = String(formData.get("content") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  const max = await prisma.lesson.aggregate({
    where: { moduleId },
    _max: { orderIndex: true },
  });
  const orderIndex = (max._max.orderIndex ?? -1) + 1;

  await prisma.lesson.create({
    data: {
      moduleId,
      title,
      kind,
      content: content || null,
      videoUrl: videoUrl || null,
      orderIndex,
    },
  });

  const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
  if (mod) {
    revalidatePath(`/admin/courses/${mod.courseId}`);
    revalidatePath(`/admin/courses/${mod.courseId}/modules/${moduleId}`);
  }
}

export async function updateLesson(lessonId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const kind = parseKind(formData.get("kind"));
  const content = String(formData.get("content") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title,
      kind,
      content: content || null,
      videoUrl: videoUrl || null,
    },
    include: { module: true },
  });
  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  revalidatePath(`/admin/courses/${lesson.module.courseId}/modules/${lesson.moduleId}`);
}

export async function deleteLesson(lessonId: string, _formData?: FormData) {
  await requireAdmin();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) throw new Error("Lesson not found.");
  await prisma.lesson.delete({ where: { id: lessonId } });
  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  revalidatePath(`/admin/courses/${lesson.module.courseId}/modules/${lesson.moduleId}`);
}
