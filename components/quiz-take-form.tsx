"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { submitQuizAttempt } from "@/actions/quiz-attempt-actions";
import type { PublicQuestion } from "@/types/quiz-public";
import type { AnswerPayload } from "@/lib/quiz-grading";

export type { PublicQuestion } from "@/types/quiz-public";

export function QuizTakeForm({
  quizId,
  passingPercent,
  maxAttempts,
  attemptsUsed,
  alreadyPassed,
  questions,
}: {
  quizId: string;
  passingPercent: number;
  maxAttempts: number;
  attemptsUsed: number;
  alreadyPassed: boolean;
  questions: PublicQuestion[];
}) {
  const [answers, setAnswers] = useState<AnswerPayload>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const lockedOut = useMemo(() => {
    if (alreadyPassed) return true;
    return attemptsUsed >= maxAttempts;
  }, [alreadyPassed, attemptsUsed, maxAttempts]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lockedOut) return;
    setPending(true);
    try {
      const res = await submitQuizAttempt(quizId, answers);
      if ("alreadyPassed" in res && res.alreadyPassed) {
        toast.success("You already passed this quiz.");
        setResult({ score: res.score, passed: true });
      } else if ("passed" in res && "score" in res) {
        const passed = Boolean(res.passed);
        setResult({ score: res.score, passed });
        toast[passed ? "success" : "error"](
          passed ? "Quiz passed — next module unlocked." : "Quiz not passed — review and retry.",
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit quiz.");
    } finally {
      setPending(false);
    }
  }

  if (alreadyPassed || (result?.passed ?? false)) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm">
        You have passed this quiz. The next module is unlocked when applicable.
      </div>
    );
  }

  if (lockedOut && !alreadyPassed) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-card p-6 text-sm text-destructive">
        Maximum attempts reached ({maxAttempts}). Contact your instructor if you need help.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>Passing score: {passingPercent}%</span>
        <span>
          Attempts: {attemptsUsed}/{maxAttempts}
        </span>
      </div>

      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-medium">
            {idx + 1}. {q.prompt}
          </div>
          {q.type === "MCQ" ? (
            <div className="mt-4 flex flex-col gap-2">
              {q.options.map((opt, oidx) => (
                <Button
                  key={oidx}
                  type="button"
                  variant={answers[q.id] === oidx ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setAnswers((p) => ({ ...p, [q.id]: oidx }))}
                >
                  {opt}
                </Button>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant={answers[q.id] === false ? "default" : "outline"}
                onClick={() => setAnswers((p) => ({ ...p, [q.id]: false }))}
              >
                False
              </Button>
              <Button
                type="button"
                variant={answers[q.id] === true ? "default" : "outline"}
                onClick={() => setAnswers((p) => ({ ...p, [q.id]: true }))}
              >
                True
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit quiz"}
      </Button>

      {result ? (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
          Score: {result.score.toFixed(1)}% — {result.passed ? "Passed" : "Not passed"}
        </div>
      ) : null}
    </form>
  );
}
