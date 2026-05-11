import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

export function assertAllowedUpload(file: File) {
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.has(mime)) {
    throw new Error("Unsupported file type.");
  }
  const max = 10 * 1024 * 1024;
  if (file.size > max) {
    throw new Error("File too large (max 10MB).");
  }
}

export async function saveSubmissionFile(params: {
  userId: string;
  assignmentId: string;
  file: File;
}): Promise<{ filePath: string; fileName: string; mimeType: string }> {
  assertAllowedUpload(params.file);
  const dir = path.join(UPLOAD_ROOT, "assignments", params.userId, params.assignmentId);
  await mkdir(dir, { recursive: true });
  const safeName = params.file.name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  const unique = `${Date.now()}-${safeName}`;
  const full = path.join(dir, unique);
  const buf = Buffer.from(await params.file.arrayBuffer());
  await writeFile(full, buf);
  const rel = path.join("assignments", params.userId, params.assignmentId, unique);
  return {
    filePath: rel.replace(/\\/g, "/"),
    fileName: params.file.name,
    mimeType: params.file.type || "application/octet-stream",
  };
}
