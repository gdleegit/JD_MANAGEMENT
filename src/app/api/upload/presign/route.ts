import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageClient, STORAGE_BUCKET } from "@/lib/supabase-storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { filename } = await req.json();
  const ext = (filename.split(".").pop() ?? "jpg").toLowerCase();
  const path = `sponsors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = getStorageClient();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    publicUrl: urlData.publicUrl,
  });
}
