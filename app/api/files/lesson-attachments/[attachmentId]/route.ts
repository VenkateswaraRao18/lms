import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UPLOAD_ROOT } from "@/lib/upload";
import { canAccessLesson } from "@/lib/access";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: Request,
  context: { params: Promise<{ attachmentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { attachmentId } = await context.params;
  const attachment = await prisma.lessonAttachment.findUnique({
    where: { id: attachmentId },
    include: { lesson: true },
  });

  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  if (session.user.role === "ADMIN") {
    // ok
  } else if (session.user.role === "STUDENT") {
    const ok = await canAccessLesson(session.user.id, attachment.lessonId);
    if (!ok) return new Response("Forbidden", { status: 403 });
  } else {
    return new Response("Forbidden", { status: 403 });
  }

  const absolute = path.join(UPLOAD_ROOT, attachment.filePath);
  const normalized = path.normalize(absolute);
  if (!normalized.startsWith(path.normalize(UPLOAD_ROOT))) {
    return new Response("Invalid path", { status: 400 });
  }

  const buf = await readFile(normalized);
  return new Response(buf, {
    headers: {
      "Content-Type": attachment.mimeType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    },
  });
}
