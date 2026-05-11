import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_ROOT } from "@/lib/upload";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: Request,
  context: { params: Promise<{ submissionId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { submissionId } = await context.params;
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission?.filePath) {
    return new Response("Not found", { status: 404 });
  }

  const allowed =
    session.user.role === "ADMIN" ||
    (session.user.role === "STUDENT" && submission.userId === session.user.id);
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  const absolute = path.join(UPLOAD_ROOT, submission.filePath);
  const normalized = path.normalize(absolute);
  if (!normalized.startsWith(path.normalize(UPLOAD_ROOT))) {
    return new Response("Invalid path", { status: 400 });
  }

  const buf = await readFile(normalized);
  return new Response(buf, {
    headers: {
      "Content-Type": submission.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(submission.fileName ?? "file")}`,
    },
  });
}
