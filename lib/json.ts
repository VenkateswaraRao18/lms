/** Strip common ``` / ```json wrappers from model output. */
function stripCodeFence(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  let rest = t.slice(3);
  if (rest.toLowerCase().startsWith("json")) {
    rest = rest.slice(4);
  }
  rest = rest.replace(/^\s*\n?/, "");
  const close = rest.lastIndexOf("```");
  if (close === -1) return rest.trim();
  return rest.slice(0, close).trim();
}

function repairLooseJson(s: string): string {
  let out = s.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'");
  out = out.replace(/,\s*([}\]])/g, "$1");
  return out;
}

/** Brace-balanced slice of first `{` … `}` honoring strings and escapes. */
function sliceFirstBalancedObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i += 1) {
    const c = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (c === "{") depth += 1;
    if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function tryParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(repairLooseJson(raw)) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Extract the first JSON object from model output.
 * Tries whole-string parse (works well with Ollama `format: "json"`), then fenced blocks, then brace-balanced slice.
 */
export function extractFirstJsonObject<T>(text: string): T {
  const stripped = stripCodeFence(text);
  const cleaned = stripped.trim();

  if (cleaned.startsWith("{")) {
    const direct = tryParse<T>(cleaned);
    if (direct !== null) return direct;
  }

  const slice = sliceFirstBalancedObject(stripped);
  if (slice) {
    const parsed = tryParse<T>(slice);
    if (parsed !== null) return parsed;
    throw new Error(
      "Found a JSON-like object but it could not be parsed (invalid escapes, truncated output, or bad commas). Try again, enable JSON mode, or shorten content / raise token limit.",
    );
  }

  throw new Error("Model output did not contain a complete JSON object (no balanced `{` … `}`).");
}
