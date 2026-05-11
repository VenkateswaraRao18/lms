import type { PublicQuestion } from "@/types/quiz-public";

export function QuizPreviewReadonly({
  passingPercent,
  maxAttempts,
  questions,
}: {
  passingPercent: number;
  maxAttempts: number;
  questions: PublicQuestion[];
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          Passing score: <strong className="text-foreground">{passingPercent}%</strong>
        </span>
        <span>
          Attempt limit shown to learners: <strong className="text-foreground">{maxAttempts}</strong>
        </span>
      </div>
      {questions.map((q, idx) => (
        <div key={q.id} className="rounded-xl border border-border bg-card p-5">
          <div className="text-sm font-medium text-foreground">
            {idx + 1}. {q.prompt}
          </div>
          {q.type === "MCQ" ? (
            <ul className="mt-4 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              {q.options.map((opt, oidx) => (
                <li key={`${q.id}-${oidx}`} className="pl-1">
                  {opt}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Learners choose <strong className="text-foreground">True</strong> or{" "}
              <strong className="text-foreground">False</strong>.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
