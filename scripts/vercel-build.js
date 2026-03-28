// Vercel 빌드 시 schema.prisma를 postgresql로 자동 전환
const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

schema = schema.replace(
  /datasource db \{[\s\S]*?\}/,
  `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
);

fs.writeFileSync(schemaPath, schema);
console.log("✅ schema.prisma patched to postgresql for Vercel");
