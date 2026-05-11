export function courseGenerationPrompt(topic: string): string {
  return `You are designing an online course for independent learners.

Topic / learning goal: ${topic}

The API requires syntactically valid JSON. Emit one JSON object only (no markdown fences, no text before or after the object).

Shape:
{
  "title": string,
  "description": string,
  "modules": [
    {
      "title": string,
      "description": string,
      "lessons": [
        {
          "title": string,
          "kind": "NOTES" | "VIDEO",
          "content": string,
          "videoUrl": string | null
        }
      ],
      "quiz": {
        "title": string,
        "passingPercent": number,
        "questions": [
          {
            "type": "MCQ",
            "prompt": string,
            "options": string[],
            "correctIndex": number
          },
          {
            "type": "TRUE_FALSE",
            "prompt": string,
            "correctBool": boolean
          }
        ]
      }
    }
  ]
}

STRICT RULES:
1. Provide **4 to 6 modules** (prefer **6 modules** when the topic is intentionally broad — e.g. retrieval-augmented generation, ML foundations, multi-week curricula). Fewer modules is fine only if the topic stays narrow.
2. Each module MUST include **3 to 5 lessons** focused on learning:
   - **Most lessons MUST be kind "NOTES"**: practical teaching notes as **GitHub-flavored Markdown** in \`content\`: use \`##\` headings, bullet lists, and fenced \`\`\`language code blocks\`\`\` when showing examples. Keep each \`content\` string **under 4000 characters** so the JSON stays complete — depth over length.
   - Use \\n inside strings for paragraph breaks. Do not put raw unescaped double-quote characters inside string values.
   - You MAY include **at most one "VIDEO" lesson per module** if it helps; otherwise all NOTES is fine. VIDEO needs a plausible embedded-video URL or null videoUrl for NOTES.
3. Each module MUST end with a **single quiz** object that assesses that module only:
   - The quiz MUST contain **exactly 5 questions** (no fewer, no more).
   - Mix MCQ and TRUE_FALSE types across those 5 questions.
   - Questions must reflect what appears in that module's lesson content.
   - MCQ: at least 2 options; correctIndex is 0-based index into "options".
   - passingPercent: recommend 70 unless the topic needs 80.
4. Learners pass a module quiz to unlock the **next** module — design questions so they check real understanding.

Keep titles clear. Descriptions should help an instructor review the draft before publishing.
`;
}

export function lessonSummaryPrompt(lessonTitle: string, lessonContent: string): string {
  return `Summarize the lesson below for a student review sheet that will be appended to the lesson body as Markdown.

Output rules:
- Use GitHub-flavored Markdown only (headings, short bullets, bold for key terms, fenced code blocks only if the lesson already contains code worth repeating).
- No outer markdown code fence around the whole answer.
- Max ~200 words. Be concrete and avoid repeating the full lesson verbatim.

Lesson title: ${lessonTitle}

Lesson content:
${lessonContent.slice(0, 12000)}
`;
}
