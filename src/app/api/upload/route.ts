import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageClient, STORAGE_BUCKET } from "@/lib/supabase-storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0)
      return NextResponse.json({ error: "파일 없음" }, { status: 400 });

    // 확장자로도 허용 (file.type이 비어있을 수 있음)
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowedExts.includes(ext))
      return NextResponse.json({ error: "JPG, PNG, WEBP, GIF만 가능합니다" }, { status: 400 });

    const contentType = file.type || `image/${ext === "jpg" ? "jpeg" : ext}`;
    const filename = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // File → Buffer 변환 (Node.js 환경에서 안정적)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = getStorageClient();
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, { contentType, upsert: false });

    if (error) {
      console.error("[upload] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
    return NextResponse.json({ url: data.publicUrl });
  } catch (e) {
    console.error("[upload] unexpected error:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
