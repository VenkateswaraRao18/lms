"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  previewAiCourseFromForm,
  commitAiCourseFromClient,
  type AiPreviewResult,
} from "@/actions/ai-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AiGenerateForm({ defaultModel }: { defaultModel: string }) {
  const router = useRouter();
  const [previewPending, startPreview] = useTransition();
  const [commitPending, startCommit] = useTransition();
  const [previewResult, setPreviewResult] = useState<AiPreviewResult | null>(null);

  const busy = previewPending || commitPending;

  function onGeneratePreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    startPreview(async () => {
      try {
        const result = await previewAiCourseFromForm(fd);
        setPreviewResult(result);
        toast.message("Review the outline below, then save as draft or discard.");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not generate a preview.";
        toast.error(msg);
      }
    });
  }

  function onSaveDraft() {
    if (!previewResult) return;
    startCommit(async () => {
      try {
        await commitAiCourseFromClient(previewResult.commitPayload);
        toast.success("Draft saved — open it under Courses to edit or publish.");
        setPreviewResult(null);
        router.push("/admin/courses");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not save the draft.";
        toast.error(msg);
      }
    });
  }

  function onDiscard() {
    setPreviewResult(null);
    toast.message("Preview cleared — generate again when you’re ready.");
  }

  return (
    <>
      <div
        aria-hidden={!busy}
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-md transition-opacity duration-200",
          busy ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-card shadow-lg shadow-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
        </div>
        <div className="max-w-sm text-center">
          <p className="font-medium text-foreground">
            {commitPending ? "Saving draft…" : "Generating preview…"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Ollama may take <span className="text-foreground/90">30 seconds to a few minutes</span> on CPU.
            Nothing is saved until you choose <strong className="text-foreground">Save draft</strong>.
          </p>
        </div>
      </div>

      {!previewResult ? (
        <form onSubmit={onGeneratePreview} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium">
              Learning goal
            </Label>
            <Input
              id="topic"
              name="topic"
              placeholder="e.g. SQL for analysts — queries, joins, and reporting"
              required
              disabled={busy}
              className="h-11 border-border/80 bg-background/80 text-[15px] shadow-sm transition-shadow focus-visible:ring-2"
            />
            <p className="text-xs text-muted-foreground">
              Be specific — the model uses this to shape modules and quiz questions.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium">
              Ollama model
            </Label>
            <select
              id="model"
              name="model"
              defaultValue={defaultModel}
              disabled={busy}
              className="border-input bg-background/80 h-11 w-full max-w-md rounded-lg border px-3 text-sm shadow-sm outline-none transition-shadow focus-visible:ring-2 disabled:opacity-60"
            >
              <option value="gemma:7b">gemma:7b</option>
              <option value="gemma2:9b">gemma2:9b</option>
              <option value="llama3">llama3</option>
              <option value="qwen2.5-coder:7b">qwen2.5-coder:7b</option>
            </select>
          </div>

          <Button type="submit" size="lg" disabled={busy} className="min-w-[200px] gap-2">
            {previewPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Working…
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" aria-hidden />
                Generate preview
              </>
            )}
          </Button>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-primary/20 bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Preview — not saved yet
                </p>
                <h3 className="font-display mt-1 text-xl font-semibold tracking-tight text-foreground">
                  {previewResult.preview.title}
                </h3>
                {previewResult.preview.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {previewResult.preview.description}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
                {previewResult.preview.modules.length} modules
              </span>
            </div>

            <ul className="mt-5 space-y-5">
              {previewResult.preview.modules.map((mod, i) => (
                <li
                  key={`${mod.title}-${i}`}
                  className="rounded-lg border border-border/80 bg-background/60 px-4 py-3"
                >
                  <div className="font-medium text-foreground">
                    {i + 1}. {mod.title}
                  </div>
                  {mod.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
                  ) : null}

                  <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lessons
                  </div>
                  <ul className="mt-1 list-inside list-disc text-sm text-foreground/90">
                    {mod.lessons.map((l, j) => (
                      <li key={`${l.title}-${j}`}>
                        {l.title}{" "}
                        <span className="text-muted-foreground">({l.kind})</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Quiz — {mod.quizTitle}
                  </div>
                  <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-foreground/85">
                    {mod.questionPrompts.map((q, k) => (
                      <li key={k} className="pl-1">
                        {q.length > 160 ? `${q.slice(0, 157)}…` : q}
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              disabled={commitPending}
              className="gap-2"
              onClick={onSaveDraft}
            >
              {commitPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Save as draft
                </>
              )}
            </Button>
            <Button type="button" variant="outline" size="lg" disabled={commitPending} onClick={onDiscard}>
              Discard preview
            </Button>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Saving creates an unpublished draft under Courses. Students only see it after you publish.
          </p>
        </div>
      )}
    </>
  );
}
