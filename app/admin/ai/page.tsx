import Link from "next/link";
import { AiGenerateForm } from "@/components/admin/ai-generate-form";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sparkles } from "lucide-react";

export default function AdminAiPage() {
  const defaultModel = process.env.OLLAMA_MODEL_COURSE ?? "gemma:7b";

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Authoring"
        title="AI Studio"
        description={
          <>
            Generate a course outline with Ollama, <strong className="font-medium text-foreground">review the preview</strong>, then save as a draft — nothing is stored until you confirm.
            Publishing to learners still requires <strong className="font-medium text-foreground">Published</strong> on the course.
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Alert className="surface-card border-primary/25 px-4 py-4 lg:col-span-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <AlertTitle className="font-display text-base">How drafts are built</AlertTitle>
          <AlertDescription className="space-y-3 pt-1 text-[13px] leading-relaxed text-muted-foreground">
            <ul className="list-none space-y-2.5">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                <span>
                  <strong className="text-foreground/95">3–5 modules</strong>, each with doc-style lessons and a{" "}
                  <strong className="text-foreground/95">5-question</strong> checkpoint quiz.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                <span>
                  Passing a module quiz <strong className="text-foreground/95">unlocks the next module</strong> for students.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
                <span>
                  Generation talks to{" "}
                  <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[12px] text-foreground/90">
                    localhost:11434
                  </code>
                  . CPU runs can take <strong className="text-foreground/95">30s–several minutes</strong> — we show a
                  live progress state so the UI never feels frozen.
                </span>
              </li>
            </ul>
          </AlertDescription>
        </Alert>

        <section className="surface-card border-border/80 p-7 lg:col-span-3">
          <div className="border-b border-border/60 pb-5">
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">New course from AI</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Describe the outcome learners should reach. You&apos;ll see a <strong className="font-medium text-foreground">preview</strong>{" "}
              (modules, lessons, quiz prompts) before anything is saved. Then open it under{" "}
              <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin/courses">
                Courses
              </Link>{" "}
              to edit or publish.
            </p>
          </div>

          <AiGenerateForm defaultModel={defaultModel} />

          <p className="mt-8 border-t border-border/60 pt-6 text-[13px] text-muted-foreground">
            Preview runs entirely in memory until you click <strong className="text-foreground/90">Save as draft</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
