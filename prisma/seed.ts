import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hash(password: string) {
  return crypto.createHash("sha256").update(password + "jd-soccer-2024").digest("hex");
}

async function main() {
  // Create admin user
  const existing = await prisma.adminUser.findUnique({ where: { username: "admin" } });
  if (!existing) {
    await prisma.adminUser.create({
      data: { username: "admin", password: hash("admin1234") },
    });
    console.log("✅ 관리자 계정 생성: admin / admin1234");
  } else {
    console.log("ℹ️  관리자 계정이 이미 존재합니다");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
