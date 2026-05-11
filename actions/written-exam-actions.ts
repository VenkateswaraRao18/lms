"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireStudent } from "@/actions/guard";

function parseQuestionLines(formData: FormData): string[] {
  const raw = String(formData.get("questions") ?? "");
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createWrittenExam(formData: FormData) {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const published = formData.get("published") === "on";
  const prompts = parseQuestionLines(formData);

  if (!courseId) throw new Error("Course is required.");
  if (!title) throw new Error("Title is required.");
  if (prompts.length === 0) throw new Error("Add at least one question (one per line).");

  const exam = await prisma.writtenExam.create({
    data: {
      courseId,
      title,
      instructions: instructions || "",
      published,
      questions: {
        create: prompts.map((prompt, orderIndex) => ({ orderIndex, prompt })),
      },
    },
  });

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/courses/${courseId}`);
  return exam.id;
}

export async function createWrittenExamAndRedirect(formData: FormData) {
  const id = await createWrittenExam(formData);
  redirect(`/admin/exams/${id}`);
}

export async function updateWrittenExam(examId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const published = formData.get("published") === "on";
  const prompts = parseQuestionLines(formData);

  if (!title) throw new Error("Title is required.");

  const exam = await prisma.writtenExam.findUnique({
    where: { id: examId },
    select: { courseId: true },
  });
  if (!exam) throw new Error("Exam not found.");

  const submissionCount = await prisma.writtenExamSubmission.count({ where: { examId } });

  if (submissionCount > 0) {
    await prisma.writtenExam.update({
      where: { id: examId },
      data: {
        title,
        instructions: instructions || "",
        published,
      },
    });
  } else {
    if (prompts.length === 0) throw new Error("Add at least one question (one per line).");
    await prisma.$transaction(async (tx) => {
      await tx.writtenExamQuestion.deleteMany({ where: { examId } });
      await tx.writtenExam.update({
        where: { id: examId },
        data: {
          title,
          instructions: instructions || "",
          published,
          questions: {
            create: prompts.map((prompt, orderIndex) => ({ orderIndex, prompt })),
          },
        },
      });
    });
  }

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${examId}`);
  revalidatePath(`/admin/courses/${exam.courseId}`);
}

export async function deleteWrittenExam(examId: string, _formData?: FormData) {
  await requireAdmin();
  const exam = await prisma.writtenExam.findUnique({
    where: { id: examId },
    select: { courseId: true },
  });
  await prisma.writtenExam.delete({ where: { id: examId } });
  if (exam) {
    revalidatePath("/admin/exams");
    revalidatePath(`/admin/courses/${exam.courseId}`);
  }
  revalidatePath("/student/exams");
}

export async function gradeWrittenExamSubmission(submissionId: string, formData: FormData) {
  await requireAdmin();
  const scoreRaw = Number(formData.get("score"));
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!Number.isFinite(scoreRaw) || scoreRaw < 0 || scoreRaw > 10 || !Number.isInteger(scoreRaw)) {
    throw new Error("Score must be a whole number from 0 to 10.");
  }

  const sub = await prisma.writtenExamSubmission.findUnique({
    where: { id: submissionId },
    include: { exam: { select: { courseId: true } } },
  });
  if (!sub) throw new Error("Submission not found.");

  await prisma.writtenExamSubmission.update({
    where: { id: submissionId },
    data: {
      score: scoreRaw,
      feedback: feedback || null,
      gradedAt: new Date(),
    },
  });

  revalidatePath(`/admin/exams/${sub.examId}`);
  revalidatePath("/admin/exams");
  revalidatePath("/student/exams");
  revalidatePath(`/student/exams/${sub.examId}`);
}

export async function submitWrittenExamAnswers(examId: string, formData: FormData) {
  const user = await requireStudent();

  const exam = await prisma.writtenExam.findUnique({
    where: { id: examId },
    include: { questions: { orderBy: { orderIndex: "asc" } } },
  });
  if (!exam || !exam.published) throw new Error("Exam not available.");

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: exam.courseId } },
  });
  if (!enrolled) throw new Error("You are not enrolled in this course.");

  const completed = await prisma.writtenExamCompletion.findUnique({
    where: { examId_userId: { examId, userId: user.id } },
  });
  if (completed) throw new Error("You have already completed this exam.");

  const existing = await prisma.writtenExamSubmission.findUnique({
    where: { examId_userId: { examId, userId: user.id } },
  });
  if (existing) {
    if (existing.score !== null) {
      throw new Error("This attempt was already graded — open results or wait.");
    }
    throw new Error("You already submitted answers. Wait for grading.");
  }

  const answers: Record<string, string> = {};
  for (const q of exam.questions) {
    const text = String(formData.get(`answer_${q.id}`) ?? "").trim();
    if (!text) throw new Error(`Answer every question — missing answer for a prompt.`);
    answers[q.id] = text;
  }

  await prisma.writtenExamSubmission.create({
    data: {
      examId,
      userId: user.id,
      answersJson: JSON.stringify(answers),
    },
  });

  revalidatePath("/student/exams");
  revalidatePath(`/student/exams/${examId}`);
  revalidatePath(`/admin/exams/${examId}`);
}

export async function acknowledgeWrittenExamResult(submissionId: string, _formData?: FormData) {
  const user = await requireStudent();

  const sub = await prisma.writtenExamSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!sub || sub.userId !== user.id) throw new Error("Not found.");
  if (sub.score === null) throw new Error("Not graded yet.");

  await prisma.$transaction(async (tx) => {
    await tx.writtenExamSubmission.delete({ where: { id: submissionId } });
    await tx.writtenExamCompletion.upsert({
      where: { examId_userId: { examId: sub.examId, userId: user.id } },
      create: { examId: sub.examId, userId: user.id },
      update: { acknowledgedAt: new Date() },
    });
  });

  revalidatePath("/student/exams");
  revalidatePath(`/student/exams/${sub.examId}`);
  revalidatePath(`/admin/exams/${sub.examId}`);
}
