"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

export async function enrollStudent(courseId: string, userId: string) {
  await requireAdmin();
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
  });
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/student/courses");
}

export async function unenrollStudent(courseId: string, userId: string) {
  await requireAdmin();
  await prisma.enrollment.deleteMany({ where: { userId, courseId } });
  revalidatePath(`/admin/courses/${courseId}`);
}
