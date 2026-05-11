"use server";

import { prisma } from "@/lib/prisma";
import { canAccessLesson } from "@/lib/access";
import { saveSubmissionFile } from "@/lib/upload";
import { SubmissionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireStudent } from "@/actions/guard";

export async function upsertAssignment(lessonId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error("Lesson not found.");

  const dueAt = dueRaw ? new Date(dueRaw) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) throw new Error("Invalid due date.");

  await prisma.assignment.upsert({
    where: { lessonId },
    create: {
      lessonId,
      title,
      description: description || "",
      dueAt,
    },
    update: {
      title,
      description: description || "",
      dueAt,
    },
  });

  const mod = await prisma.module.findUnique({ where: { id: lesson.moduleId }, select: { courseId: true } });
  if (mod) {
    revalidatePath(`/admin/courses/${mod.courseId}`);
    revalidatePath(`/admin/courses/${mod.courseId}/modules/${lesson.moduleId}`);
  }
}

export async function submitAssignment(assignmentId: string, formData: FormData) {
  const user = await requireStudent();
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { lesson: true },
  });
  if (!assignment) throw new Error("Assignment not found.");

  const allowed = await canAccessLesson(user.id, assignment.lessonId);
  if (!allowed) throw new Error("This assignment is locked.");

  const textAnswer = String(formData.get("textAnswer") ?? "").trim();
  const file = formData.get("file");

  let filePath: string | null = null;
  let fileName: string | null = null;
  let mimeType: string | null = null;

  if (file instanceof File && file.size > 0) {
    const saved = await saveSubmissionFile({
      userId: user.id,
      assignmentId,
      file,
    });
    filePath = saved.filePath;
    fileName = saved.fileName;
    mimeType = saved.mimeType;
  }

  if (!textAnswer && !filePath) {
    throw new Error("Provide a written answer and/or a file.");
  }

  await prisma.submission.upsert({
    where: {
      assignmentId_userId: { assignmentId, userId: user.id },
    },
    create: {
      assignmentId,
      userId: user.id,
      textAnswer: textAnswer || null,
      filePath,
      fileName,
      mimeType,
      status: SubmissionStatus.PENDING,
    },
    update: {
      textAnswer: textAnswer || null,
      filePath,
      fileName,
      mimeType,
      status: SubmissionStatus.PENDING,
      submittedAt: new Date(),
      feedback: null,
      reviewedAt: null,
    },
  });

  revalidatePath(`/student/assignment/${assignmentId}`);
}

export async function reviewSubmission(submissionId: string, formData: FormData) {
  await requireAdmin();
  const feedback = String(formData.get("feedback") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "").trim();
  const status =
    statusRaw === SubmissionStatus.REVIEWED ? SubmissionStatus.REVIEWED : SubmissionStatus.PENDING;

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      feedback: feedback || null,
      status,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/submissions");
}
