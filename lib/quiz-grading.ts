import type { QuestionType } from "@prisma/client";

export type AnswerPayload = Record<string, number | boolean>;

export function gradeQuiz(
  questions: {
    id: string;
    type: QuestionType;
    correctIndex: number | null;
    correctBool: boolean | null;
  }[],
  answers: AnswerPayload,
): { score: number; detail: { correct: number; total: number } } {
  let correct = 0;
  const total = questions.length;
  for (const q of questions) {
    const a = answers[q.id];
    if (a === undefined) continue;
    if (q.type === "MCQ" && typeof a === "number" && q.correctIndex !== null && q.correctIndex === a) {
      correct += 1;
    }
    if (q.type === "TRUE_FALSE" && typeof a === "boolean" && q.correctBool !== null && q.correctBool === a) {
      correct += 1;
    }
  }
  const score = total === 0 ? 0 : (correct / total) * 100;
  return { score, detail: { correct, total } };
}
