import { randomBytes } from "crypto";

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = randomBytes(3).toString("hex");
  return base ? `${base}-${suffix}` : `course-${suffix}`;
}
