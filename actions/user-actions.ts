"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actions/guard";

export async function createStudentUser(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || password.length < 8) {
    throw new Error("Name, email, and password (min 8 chars) are required.");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Error("A user with this email already exists.");

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: Role.STUDENT,
    },
  });

  revalidatePath("/admin/students");
}
