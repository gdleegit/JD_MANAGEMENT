import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "中東AA | Athletic Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = readFileSync(join(process.cwd(), "public/jd2.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logoBuffer.toString("base64")}`;

  // Inter TTF: 항상 로드 (woff2는 @vercel/og 미지원)
  const interData = readFileSync(join(process.cwd(), "src/app/inter.ttf"));

  // Noto Serif KR: 中東 한자 렌더링용, 실패해도 무시
  let notoData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400&text=${encodeURIComponent("中東")}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const urlMatch = css.match(/url\(([^)]+)\)\s+format\('woff2'\)/);
    if (urlMatch) {
      notoData = await fetch(urlMatch[1]).then((r) => r.arrayBuffer());
    }
  } catch {
    // 폰트 로드 실패 → 中東은 박스로 표시될 수 있음 (빌드는 정상)
  }

  type FontConfig = { name: string; data: ArrayBuffer; weight: 400; style: "normal" };
  const fonts: FontConfig[] = [
    { name: "Inter", data: interData.buffer as ArrayBuffer, weight: 400, style: "normal" },
  ];
  if (notoData) {
    fonts.push({ name: "NotoSerifKR", data: notoData, weight: 400, style: "normal" });
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#030712",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "60px",
          padding: "0 100px",
        }}
      >
        {/* 로고 */}
        <img src={logoSrc} width={180} height={180} style={{ flexShrink: 0 }} />

        {/* 사이트명 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <span
              style={{
                color: "white",
                fontSize: "100px",
                fontFamily: notoData ? "NotoSerifKR" : "Inter",
                lineHeight: 1,
              }}
            >
              中東
            </span>
            <span style={{ color: "#374151", fontSize: "56px", fontFamily: "Inter", fontWeight: 100, lineHeight: 1 }}>
              |
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{
                  color: "#d1d5db",
                  fontSize: "40px",
                  letterSpacing: "0.18em",
                  fontFamily: "Inter",
                  lineHeight: 1,
                }}
              >
                <span style={{ color: "#176fc1" }}>A</span>thletic{" "}
                <span style={{ color: "#176fc1" }}>A</span>rchive
              </span>
              <span
                style={{
                  color: "#4b5563",
                  fontSize: "16px",
                  letterSpacing: "0.22em",
                  fontFamily: "Inter",
                }}
              >
                JOONGDONG
              </span>
            </div>
          </div>
          <span style={{ color: "#374151", fontSize: "22px", fontFamily: "Inter" }}>
            Athletic Archive — Joongdong
          </span>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
