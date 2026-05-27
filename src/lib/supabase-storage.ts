import { createClient } from "@supabase/supabase-js";

export function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 없습니다");
  return createClient(url, key);
}

export const STORAGE_BUCKET = "images";
