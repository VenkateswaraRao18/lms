"use client";

export default function StudentExamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const hint =
    error.message.includes("does not exist") || error.message.includes("WrittenExam")
      ? "Ask your host to run database migrations (npm run db:migrate:deploy)."
      : null;

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-destructive/25 bg-card p-8">
      <h2 className="text-lg font-semibold text-foreground">Could not load exams</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        Try again
      </button>
    </div>
  );
}
