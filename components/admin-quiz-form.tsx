"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { upsertModuleQuiz, type DraftQuestion } from "@/actions/quiz-actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Draft =
  | {
      key: string;
      type: "MCQ";
      prompt: string;
      optionsText: string;
      correctIndex: number;
    }
  | {
      key: string;
      type: "TRUE_FALSE";
      prompt: string;
      correctBool: boolean;
    };

function toDraft(q: DraftQuestion, idx: number): Draft {
  const key = `${idx}`;
  if (q.type === "MCQ") {
    return {
      key,
      type: "MCQ",
      prompt: q.prompt,
      optionsText: q.options.join("\n"),
      correctIndex: q.correctIndex,
    };
  }
  return {
    key,
    type: "TRUE_FALSE",
    prompt: q.prompt,
    correctBool: q.correctBool,
  };
}

export function AdminQuizForm({
  moduleId,
  initial,
}: {
  moduleId: string;
  initial: {
    title: string;
    passingPercent: number;
    maxAttempts: number;
    questions: DraftQuestion[];
  } | null;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [passingPercent, setPassingPercent] = useState(String(initial?.passingPercent ?? 70));
  const [maxAttempts, setMaxAttempts] = useState(String(initial?.maxAttempts ?? 3));
  const [questions, setQuestions] = useState<Draft[]>(() =>
    initial?.questions?.length
      ? initial.questions.map((q, i) => toDraft(q, i))
      : [
          {
            key: "0",
            type: "TRUE_FALSE",
            prompt: "",
            correctBool: true,
          },
        ],
  );
  const [pending, setPending] = useState(false);

  const canSubmit = useMemo(() => title.trim().length > 0 && questions.length > 0, [title, questions]);

  function addQuestion(kind: "MCQ" | "TRUE_FALSE") {
    const key = `${Date.now()}`;
    if (kind === "MCQ") {
      setQuestions((q) => [
        ...q,
        { key, type: "MCQ", prompt: "", optionsText: "Option A\nOption B", correctIndex: 0 },
      ]);
    } else {
      setQuestions((q) => [...q, { key, type: "TRUE_FALSE", prompt: "", correctBool: true }]);
    }
  }

  function moveQuestion(index: number, delta: number) {
    setQuestions((rows) => {
      const next = [...rows];
      const j = index + delta;
      if (j < 0 || j >= next.length) return rows;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      const passing = Number.parseInt(passingPercent, 10);
      const attempts = Number.parseInt(maxAttempts, 10);
      const payload: {
        title: string;
        passingPercent: number;
        maxAttempts: number;
        questions: DraftQuestion[];
      } = {
        title: title.trim(),
        passingPercent: Number.isFinite(passing) ? passing : 70,
        maxAttempts: Number.isFinite(attempts) ? attempts : 3,
        questions: questions.map((q) => {
          if (q.type === "MCQ") {
            const options = q.optionsText
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean);
            return {
              type: "MCQ" as const,
              prompt: q.prompt.trim(),
              options,
              correctIndex: q.correctIndex,
            };
          }
          return {
            type: "TRUE_FALSE" as const,
            prompt: q.prompt.trim(),
            correctBool: q.correctBool,
          };
        }),
      };
      await upsertModuleQuiz(moduleId, payload);
      toast.success("Quiz saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save quiz.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Edit any AI-generated question below, remove ones you don&apos;t want, or add new MCQ / True-False items.
        Use <strong className="font-medium text-foreground">Save quiz</strong> when finished — order matters for students.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="quiz-title">Quiz title</Label>
          <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pass">Pass %</Label>
            <Input
              id="pass"
              inputMode="numeric"
              value={passingPercent}
              onChange={(e) => setPassingPercent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attempts">Max tries</Label>
            <Input
              id="attempts"
              inputMode="numeric"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => addQuestion("MCQ")}>
          Add MCQ
        </Button>
        <Button type="button" variant="outline" onClick={() => addQuestion("TRUE_FALSE")}>
          Add True/False
        </Button>
      </div>

      <div className="space-y-5">
        {questions.map((q, idx) => (
          <div key={q.key} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Question {idx + 1} · {q.type}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={idx === 0}
                  onClick={() => moveQuestion(idx, -1)}
                  aria-label="Move question up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={idx === questions.length - 1}
                  onClick={() => moveQuestion(idx, 1)}
                  aria-label="Move question down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuestions((rows) => rows.filter((r) => r.key !== q.key))}
                >
                  Remove
                </Button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Label>Prompt</Label>
              <Textarea
                value={q.prompt}
                onChange={(e) =>
                  setQuestions((rows) =>
                    rows.map((row) => (row.key === q.key ? { ...row, prompt: e.target.value } : row)),
                  )
                }
              />
            </div>
            {q.type === "MCQ" ? (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={q.optionsText}
                    onChange={(e) =>
                      setQuestions((rows) =>
                        rows.map((row) =>
                          row.key === q.key && row.type === "MCQ"
                            ? { ...row, optionsText: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Correct option</Label>
                  <Select
                    value={String(q.correctIndex)}
                    onValueChange={(v) =>
                      setQuestions((rows) =>
                        rows.map((row) =>
                          row.key === q.key && row.type === "MCQ"
                            ? { ...row, correctIndex: Number.parseInt(v ?? "0", 10) }
                            : row,
                        ),
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.optionsText
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((label, oidx) => (
                          <SelectItem key={oidx} value={String(oidx)}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <Label>Correct answer</Label>
                <Select
                  value={q.correctBool ? "true" : "false"}
                  onValueChange={(v) =>
                    setQuestions((rows) =>
                      rows.map((row) =>
                        row.key === q.key && row.type === "TRUE_FALSE"
                          ? { ...row, correctBool: v === "true" }
                          : row,
                      ),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">False</SelectItem>
                    <SelectItem value="true">True</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button type="submit" disabled={pending || !canSubmit}>
        {pending ? "Saving…" : "Save quiz"}
      </Button>
    </form>
  );
}
