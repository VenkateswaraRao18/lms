"use server";

import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return session.user;
}

export async function requireStudent() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    throw new Error("Forbidden");
  }
  return session.user;
}
