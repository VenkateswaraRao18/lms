"use server";

import { LessonKind, QuestionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/utils/slug";
import { extractFirstJsonObject } from "@/lib/json";
import { ollamaGenerate } from "@/lib/ai/ollama";
import { courseGenerationPrompt, lessonSummaryPrompt } from "@/lib/ai/prompts";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

type AiCoursePayload = {
  title: string;
  description: string;
  modules: Array<{
    title: string;
    description?: string;
    lessons: Array<{
      title: string;
      kind: "NOTES" | "VIDEO";
      content?: string;
      videoUrl?: string | null;
    }>;
    quiz: {
      title: string;
      passingPercent: number;
      questions: Array<
        | { type: string; prompt?: string; question?: string; options?: unknown; correctIndex?: unknown; correctBool?: unknown }
        | Record<string, unknown>
      >;
    };
  }>;
};

export type AiCourseCommitPayload = {
  title: string;
  description: string;
  modules: Array<{
    title: string;
    description: string | null;
    lessons: Array<{
      title: string;
      kind: "NOTES" | "VIDEO";
      content: string | null;
      videoUrl: string | null;
    }>;
    quiz: { title: string; passingPercent: number };
    quizQuestions: Array<{
      type: "MCQ" | "TRUE_FALSE";
      prompt: string;
      optionsJson: string;
      correctIndex: number | null;
      correctBool: boolean | null;
    }>;
  }>;
};

export type AiCoursePreviewData = {
  title: string;
  description: string;
  modules: Array<{
    title: string;
    description: string | null;
    lessons: Array<{ title: string; kind: string }>;
    quizTitle: string;
    questionPrompts: string[];
  }>;
};

export type AiPreviewResult = {
  preview: AiCoursePreviewData;
  commitPayload: AiCourseCommitPayload;
};

type QuizRow = {
  type: QuestionType;
  prompt: string;
  optionsJson: string;
  correctIndex: number | null;
  correctBool: boolean | null;
};

async function uniqueSlugFromTitle(title: string) {
  const base = slugify(title);
  let slug = base;
  let i = 0;
  while (await prisma.course.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

function coerceAiQuestion(raw: unknown, fallbackPrompt: string): Omit<QuizRow, "optionsJson"> & { options: string[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const rawType = String(o.type ?? "")
    .toUpperCase()
    .replace(/[\s-]/g, "_");
  const prompt =
    String(o.prompt ?? o.question ?? o.text ?? o.stem ?? "").trim() || fallbackPrompt;

  if (
    rawType.includes("TRUE") ||
    rawType === "BOOLEAN" ||
    rawType === "BOOL" ||
    rawType === "T/F" ||
    rawType === "YES_NO"
  ) {
    let cb: unknown = o.correctBool ?? o.answer ?? o.correct ?? o.value;
    if (typeof cb === "string") {
      const s = cb.toLowerCase().trim();
      cb = s === "true" || s === "t" || s === "yes" || s === "1";
    }
    return {
      type: QuestionType.TRUE_FALSE,
      prompt,
      options: ["False", "True"],
      correctIndex: null,
      correctBool: Boolean(cb),
    };
  }

  let options: string[] = [];
  if (Array.isArray(o.options)) {
    options = o.options.map((x) => String(x).trim()).filter(Boolean);
  } else if (typeof o.options === "string") {
    options = o.options
      .split(/[\n\r|]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(o.choices)) {
    options = o.choices.map((x) => String(x).trim()).filter(Boolean);
  }

  if (options.length < 2) return null;

  let idx = Number(o.correctIndex ?? o.answerIndex ?? o.correct ?? o.answer ?? 0);
  if (Number.isNaN(idx)) idx = 0;
  idx = Math.max(0, Math.min(options.length - 1, Math.floor(idx)));

  return {
    type: QuestionType.MCQ,
    prompt,
    options,
    correctIndex: idx,
    correctBool: null,
  };
}

/** Always returns exactly 5 questions — pads if the model returns fewer; trims if more. */
function normalizeModuleQuizQuestions(moduleTitle: string, questions: unknown): QuizRow[] {
  const raw = Array.isArray(questions) ? questions : [];
  const rows: QuizRow[] = [];

  for (let i = 0; i < raw.length && rows.length < 5; i += 1) {
    const c = coerceAiQuestion(raw[i], `Question ${rows.length + 1}`);
    if (!c) continue;
    if (c.type === QuestionType.MCQ) {
      rows.push({
        type: QuestionType.MCQ,
        prompt: c.prompt,
        optionsJson: JSON.stringify(c.options),
        correctIndex: c.correctIndex ?? 0,
        correctBool: null,
      });
    } else {
      rows.push({
        type: QuestionType.TRUE_FALSE,
        prompt: c.prompt,
        optionsJson: JSON.stringify(["False", "True"]),
        correctIndex: null,
        correctBool: c.correctBool ?? true,
      });
    }
  }

  while (rows.length < 5) {
    rows.push({
      type: QuestionType.TRUE_FALSE,
      prompt: `[Added automatically] Confirm you reviewed "${moduleTitle}" before continuing.`,
      optionsJson: JSON.stringify(["False", "True"]),
      correctIndex: null,
      correctBool: true,
    });
  }

  return rows.slice(0, 5);
}

function normalizeLessonsForModule(
  moduleTitle: string,
  lessons: AiCoursePayload["modules"][0]["lessons"] | undefined,
): AiCoursePayload["modules"][0]["lessons"] {
  const base = Array.isArray(lessons) ? [...lessons] : [];
  while (base.length < 3) {
    base.push({
      title: `Study notes (${base.length + 1})`,
      kind: "NOTES",
      content:
        `Developer note: expand this section with your own teaching content for the module **${moduleTitle}**.`,
      videoUrl: null,
    });
  }
  return base.slice(0, 8);
}

function rowsToCommitQuestions(rows: QuizRow[]): AiCourseCommitPayload["modules"][0]["quizQuestions"] {
  return rows.map((row) => ({
    type: row.type === QuestionType.MCQ ? ("MCQ" as const) : ("TRUE_FALSE" as const),
    prompt: row.prompt,
    optionsJson: row.optionsJson,
    correctIndex: row.correctIndex,
    correctBool: row.correctBool,
  }));
}

function buildCommitPayload(
  parsed: AiCoursePayload,
  modules: AiCoursePayload["modules"],
  quizQuestionRows: QuizRow[][],
): AiCourseCommitPayload {
  return {
    title: String(parsed.title ?? "").trim(),
    description: String(parsed.description ?? "").trim(),
    modules: modules.map((m, mi) => {
      const lessonArr = Array.isArray(m.lessons) ? m.lessons : [];
      const qz = m.quiz;
      return {
        title: String(m.title ?? "").trim() || "Module",
        description: m.description ?? null,
        lessons: lessonArr.map((l) => ({
          title: String(l.title ?? "Lesson"),
          kind: l.kind === "VIDEO" ? ("VIDEO" as const) : ("NOTES" as const),
          content: l.content ?? null,
          videoUrl: l.videoUrl ?? null,
        })),
        quiz: {
          title: qz.title.trim(),
          passingPercent: Math.min(100, Math.max(0, Number(qz.passingPercent) || 70)),
        },
        quizQuestions: rowsToCommitQuestions(quizQuestionRows[mi] ?? []),
      };
    }),
  };
}

function previewFromPayload(payload: AiCourseCommitPayload): AiCoursePreviewData {
  return {
    title: payload.title,
    description: payload.description,
    modules: payload.modules.map((m) => ({
      title: m.title,
      description: m.description,
      lessons: m.lessons.map((l) => ({ title: l.title, kind: l.kind })),
      quizTitle: m.quiz.title,
      questionPrompts: m.quizQuestions.map((q) => q.prompt),
    })),
  };
}

async function buildCommitPayloadFromTopic(topic: string, model?: string): Promise<AiCourseCommitPayload> {
  const trimmed = topic.trim();
  if (!trimmed) throw new Error("Topic is required.");

  const modelName = model?.trim() || process.env.OLLAMA_MODEL_COURSE || "gemma:7b";
  let raw: string;
  try {
    raw = await ollamaGenerate(modelName, courseGenerationPrompt(trimmed), {
      json: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Could not reach Ollama or the model failed (${msg}). Check Ollama is running on ${process.env.OLLAMA_HOST ?? "http://localhost:11434"} and the model is pulled.`,
    );
  }

  let parsed: AiCoursePayload;
  try {
    parsed = extractFirstJsonObject<AiCoursePayload>(raw);
  } catch (e) {
    const hint = e instanceof Error ? e.message : "Unknown parse error";
    throw new Error(
      `AI output was not valid JSON (${hint}). Try again, or use a larger model if responses are truncated.`,
    );
  }

  if (!parsed.title || !Array.isArray(parsed.modules) || parsed.modules.length === 0) {
    throw new Error("AI returned no modules. Try a clearer topic or a different model.");
  }

  const modules = parsed.modules.slice(0, 8);
  const quizQuestionRows: QuizRow[][] = [];

  for (const m of modules) {
    const moduleTitle = String(m.title ?? "Module").trim() || "Module";
    const lessonList = normalizeLessonsForModule(moduleTitle, m.lessons);

    if (!m.quiz?.title?.trim()) {
      m.quiz = {
        title: `${moduleTitle} checkpoint`,
        passingPercent: 70,
        questions: [],
      };
    }

    quizQuestionRows.push(normalizeModuleQuizQuestions(moduleTitle, m.quiz.questions));
    m.lessons = lessonList;
  }

  return buildCommitPayload(parsed, modules, quizQuestionRows);
}

function validateCommitPayload(p: AiCourseCommitPayload) {
  if (!p.title?.trim()) throw new Error("Invalid course: missing title.");
  if (!Array.isArray(p.modules) || p.modules.length === 0) {
    throw new Error("Invalid course: no modules.");
  }
  for (const m of p.modules) {
    if (!m.lessons?.length) throw new Error(`Invalid module "${m.title}": no lessons.`);
    if (!m.quizQuestions?.length) throw new Error(`Invalid module "${m.title}": no quiz questions.`);
  }
}

async function persistAiCourse(payload: AiCourseCommitPayload) {
  validateCommitPayload(payload);
  const slug = await uniqueSlugFromTitle(payload.title);

  await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title: payload.title,
        description: payload.description ?? "",
        slug,
        published: false,
      },
    });

    for (let mi = 0; mi < payload.modules.length; mi += 1) {
      const m = payload.modules[mi];
      const mod = await tx.module.create({
        data: {
          courseId: course.id,
          title: m.title,
          description: m.description ?? null,
          orderIndex: mi,
        },
      });

      for (let li = 0; li < m.lessons.length; li += 1) {
        const lesson = m.lessons[li];
        const kind: LessonKind = lesson.kind === "VIDEO" ? LessonKind.VIDEO : LessonKind.NOTES;
        await tx.lesson.create({
          data: {
            moduleId: mod.id,
            title: lesson.title,
            kind,
            content: lesson.content ?? null,
            videoUrl: lesson.videoUrl ?? null,
            orderIndex: li,
          },
        });
      }

      const rows = m.quizQuestions;
      const quizRow = await tx.quiz.create({
        data: {
          moduleId: mod.id,
          title: m.quiz.title.trim(),
          passingPercent: Math.min(100, Math.max(0, Number(m.quiz.passingPercent) || 70)),
          maxAttempts: 3,
        },
      });

      for (const row of rows) {
        await tx.quizQuestion.create({
          data: {
            quizId: quizRow.id,
            type: row.type === "MCQ" ? QuestionType.MCQ : QuestionType.TRUE_FALSE,
            prompt: row.prompt,
            optionsJson: row.optionsJson,
            correctIndex: row.correctIndex,
            correctBool: row.correctBool,
          },
        });
      }
    }
  });

  revalidatePath("/admin/courses");
}

/** Generate with Ollama and return a preview plus a payload you can commit after review — nothing is saved yet. */
export async function previewAiCourse(topic: string, model?: string): Promise<AiPreviewResult> {
  await requireAdmin();
  const commitPayload = await buildCommitPayloadFromTopic(topic, model);
  return {
    preview: previewFromPayload(commitPayload),
    commitPayload,
  };
}

/** Save a reviewed AI course as a draft in the database. */
export async function commitAiCourse(payload: AiCourseCommitPayload) {
  await requireAdmin();
  await persistAiCourse(payload);
}

export async function previewAiCourseFromForm(formData: FormData): Promise<AiPreviewResult> {
  const topic = String(formData.get("topic") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  return previewAiCourse(topic, model || undefined);
}

export async function commitAiCourseFromClient(payload: AiCourseCommitPayload) {
  await commitAiCourse(payload);
}

/** @deprecated Prefer preview + commit — kept for scripts/tests */
export async function generateCourseWithOllama(topic: string, model?: string) {
  const payload = await buildCommitPayloadFromTopic(topic, model);
  await persistAiCourse(payload);
}

export async function generateCourseFromForm(formData: FormData) {
  const topic = String(formData.get("topic") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  await generateCourseWithOllama(topic, model || undefined);
}

export async function summarizeLessonWithOllama(lessonId: string, _formData?: FormData) {
  await requireAdmin();
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { module: true },
  });
  if (!lesson) throw new Error("Lesson not found.");

  const modelName = process.env.OLLAMA_MODEL_FAST || "gemma:7b";
  const summary = await ollamaGenerate(
    modelName,
    lessonSummaryPrompt(lesson.title, lesson.content ?? ""),
  );

  const appended = `\n\n---\nAI summary:\n${summary.trim()}`;
  await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      content: `${lesson.content ?? ""}${appended}`.trim(),
    },
  });

  revalidatePath(`/admin/courses/${lesson.module.courseId}`);
  revalidatePath(`/admin/courses/${lesson.module.courseId}/modules/${lesson.moduleId}`);
}
