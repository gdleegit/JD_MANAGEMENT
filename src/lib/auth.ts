import { cookies } from "next/headers";
import crypto from "crypto";

export function hashPassword(password: string): string {
  const secret = process.env.AUTH_SECRET || "jd-soccer-2026-secret-key";
  return crypto.createHash("sha256").update(password + secret).digest("hex");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  if (!token) return null;

  // simple token = base64(username:timestamp)
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [username, timestamp] = decoded.split(":");
    if (!username || !timestamp) return null;
    const age = Date.now() - parseInt(timestamp);
    if (age > 1000 * 60 * 60 * 24 * 7) return null; // 7일
    return { username };
  } catch {
    return null;
  }
}

export function createToken(username: string): string {
  return Buffer.from(`${username}:${Date.now()}`).toString("base64");
}
