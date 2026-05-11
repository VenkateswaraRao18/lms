"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { UPLOAD_ROOT, assertAllowedUpload } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

export async function uploadLessonResource(lessonId: string, formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file.");

  assertAllowedUpload(file);

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error("Lesson not found.");

  const dir = path.join(UPLOAD_ROOT, "lessons", lessonId);
  await mkdir(dir, { recursive: true });
  const safe = file.name.replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  const nameOnDisk = `${Date.now()}-${safe}`;
  const full = path.join(dir, nameOnDisk);
  await writeFile(full, Buffer.from(await file.arrayBuffer()));

  const rel = path.join("lessons", lessonId, nameOnDisk).replace(/\\/g, "/");

  await prisma.lessonAttachment.create({
    data: {
      lessonId,
      fileName: file.name,
      filePath: rel,
      mimeType: file.type || null,
      sizeBytes: file.size,
    },
  });

  const mod = await prisma.module.findUnique({ where: { id: lesson.moduleId }, select: { courseId: true } });
  if (mod) {
    revalidatePath(`/admin/courses/${mod.courseId}`);
    revalidatePath(`/admin/courses/${mod.courseId}/modules/${lesson.moduleId}`);
  }
}
