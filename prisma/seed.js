const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

const SECRET = "jd-soccer-2024-secret-key";

function hash(password) {
  return crypto.createHash("sha256").update(password + SECRET).digest("hex");
}

async function main() {
  // 기존 admin 계정 삭제 후 재생성 (비밀번호 재설정)
  await prisma.adminUser.upsert({
    where: { username: "admin" },
    update: { password: hash("admin1234") },
    create: { username: "admin", password: hash("admin1234") },
  });
  console.log("✅ 관리자 계정: admin / admin1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
