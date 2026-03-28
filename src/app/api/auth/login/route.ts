import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username) return NextResponse.json({ error: "입력값 오류" }, { status: 400 });

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "아이디가 틀렸습니다" }, { status: 401 });
  }

  // admin 계정은 비밀번호 없이 로그인 가능
  if (username !== "admin" && user.password !== hashPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 틀렸습니다" }, { status: 401 });
  }

  const token = createToken(username);
  const cookieStore = await cookies();
  cookieStore.set("admin-token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });

  return NextResponse.json({ ok: true });
}
