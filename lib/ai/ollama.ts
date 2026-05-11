export type OllamaGenerateOptions = {
  /** Ask Ollama to emit valid JSON (recommended for structured course output). */
  json?: boolean;
  /** Max tokens to generate — passed as options.num_predict. */
  numPredict?: number;
};

export async function ollamaGenerate(
  model: string,
  prompt: string,
  opts?: OllamaGenerateOptions,
): Promise<string> {
  const host = process.env.OLLAMA_HOST ?? "http://localhost:11434";

  const envCourseTokens = Number(process.env.OLLAMA_NUM_PREDICT_COURSE ?? "8192");
  const numPredict =
    opts?.numPredict ??
    (opts?.json && Number.isFinite(envCourseTokens) && envCourseTokens > 0 ? envCourseTokens : undefined);

  const body: Record<string, unknown> = {
    model,
    prompt,
    stream: false,
  };

  if (opts?.json) {
    body.format = "json";
  }

  if (numPredict !== undefined && Number.isFinite(numPredict) && numPredict > 0) {
    body.options = { num_predict: Math.floor(numPredict) };
  }

  const res = await fetch(`${host}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { response?: string };
  if (!data.response) throw new Error("Unexpected Ollama response shape.");
  return data.response;
}
