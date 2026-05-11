import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email: "admin@local.test" },
    update: {},
    create: {
      email: "admin@local.test",
      name: "Admin",
      passwordHash: hash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: "student@local.test" },
    update: {},
    create: {
      email: "student@local.test",
      name: "Demo Student",
      passwordHash: await bcrypt.hash("student123", 12),
      role: Role.STUDENT,
    },
  });

  console.log("Seed OK — admin@local.test /", password);
  console.log("Seed OK — student@local.test / student123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
