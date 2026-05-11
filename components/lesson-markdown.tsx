import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function LessonMarkdown({ markdown }: { markdown: string }) {
  return (
    <div
      className={cn(
        "lesson-md space-y-4 text-sm leading-relaxed text-muted-foreground",
        "[&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:first:mt-0",
        "[&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:first:mt-0",
        "[&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_h4]:mt-4 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground",
        "[&_p]:mt-3 [&_p:first-child]:mt-0",
        "[&_ul]:mt-3 [&_ul]:list-inside [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-1",
        "[&_ol]:mt-3 [&_ol]:list-inside [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-1",
        "[&_li]:pl-0.5",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/35 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        "[&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline",
        "[&_hr]:my-8 [&_hr]:border-border",
        "[&_strong]:font-medium [&_strong]:text-foreground/95",
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg border border-border bg-muted/35 p-4 text-[13px] leading-snug">
              {children}
            </pre>
          ),
          code: ({ className, children, ...rest }) => {
            const raw = String(children).replace(/\n$/, "");
            const isFence = !!className?.includes("language-");
            const isProbablyBlock =
              isFence ||
              raw.includes("\n") ||
              raw.length > 72;
            if (!isProbablyBlock) {
              return (
                <code
                  className="rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground/90"
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={cn("font-mono text-[13px] text-foreground/92", className)}
                {...rest}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
