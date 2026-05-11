"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

export async function createModule(courseId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  const max = await prisma.module.aggregate({
    where: { courseId },
    _max: { orderIndex: true },
  });
  const orderIndex = (max._max.orderIndex ?? -1) + 1;

  await prisma.module.create({
    data: {
      courseId,
      title,
      description: description || null,
      orderIndex,
    },
  });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateModule(moduleId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) throw new Error("Title is required.");
  const mod = await prisma.module.update({
    where: { id: moduleId },
    data: { title, description: description || null },
  });
  revalidatePath(`/admin/courses/${mod.courseId}`);
  revalidatePath(`/admin/courses/${mod.courseId}/modules/${moduleId}`);
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
  await requireAdmin();
  const modules = await prisma.module.findMany({
    where: { courseId },
    select: { id: true },
  });
  const valid = new Set(modules.map((m) => m.id));
  if (orderedIds.length !== modules.length || orderedIds.some((id) => !valid.has(id))) {
    throw new Error("Invalid module order.");
  }

  // @@unique([courseId, orderIndex]): swapping 0↔1 in one step collides. Two-phase update avoids that.
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < orderedIds.length; i += 1) {
      await tx.module.update({
        where: { id: orderedIds[i] },
        data: { orderIndex: -1000 - i },
      });
    }
    for (let i = 0; i < orderedIds.length; i += 1) {
      await tx.module.update({
        where: { id: orderedIds[i] },
        data: { orderIndex: i },
      });
    }
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteModule(moduleId: string, _formData?: FormData) {
  await requireAdmin();
  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) throw new Error("Module not found.");
  await prisma.module.delete({ where: { id: moduleId } });
  revalidatePath(`/admin/courses/${mod.courseId}`);
}
