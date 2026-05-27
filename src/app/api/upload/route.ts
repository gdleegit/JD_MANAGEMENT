import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageClient, STORAGE_BUCKET } from "@/lib/supabase-storage";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일 없음" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type))
    return NextResponse.json({ error: "JPG, PNG, WEBP, GIF만 가능합니다" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = getStorageClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, file, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
  return NextResponse.json({ url: data.publicUrl });
}
