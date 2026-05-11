"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/utils/slug";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

async function uniqueSlug(baseTitle: string) {
  const base = slugify(baseTitle);
  let slug = base;
  let i = 0;
  while (await prisma.course.findUnique({ where: { slug } })) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

export async function createCourse(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) throw new Error("Title is required.");
  const slug = await uniqueSlug(title);
  await prisma.course.create({
    data: { title, description: description || "", slug, published: false },
  });
  revalidatePath("/admin/courses");
}

export async function updateCourse(courseId: string, formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const published = formData.get("published") === "on";
  if (!title) throw new Error("Title is required.");
  await prisma.course.update({
    where: { id: courseId },
    data: { title, description: description || "", published },
  });
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

/** One-click from courses list or editor — no full form required. */
export async function setCoursePublished(courseId: string, published: boolean) {
  await requireAdmin();
  await prisma.course.update({
    where: { id: courseId },
    data: { published },
  });
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function publishCourse(courseId: string, _formData?: FormData) {
  await setCoursePublished(courseId, true);
}

export async function unpublishCourse(courseId: string, _formData?: FormData) {
  await setCoursePublished(courseId, false);
}

export async function deleteCourse(courseId: string, _formData?: FormData) {
  await requireAdmin();
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/courses");
}
