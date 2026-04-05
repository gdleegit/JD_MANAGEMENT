import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "中東AA | Athletic Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = readFileSync(join(process.cwd(), "public/jd2.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logoBuffer.toString("base64")}`;

  // 중동 한자 렌더링용 Korean/CJK 폰트 로드 시도
  let fontData: ArrayBuffer | null = null;
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400&text=${encodeURIComponent("中東")}`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const urlMatch = css.match(/url\(([^)]+)\)\s+format\('woff2'\)/);
    if (urlMatch) {
      fontData = await fetch(urlMatch[1]).then((r) => r.arrayBuffer());
    }
  } catch {
    // 폰트 로드 실패 시 시스템 serif 사용
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
                fontFamily: fontData ? "NotoSerifKR" : "serif",
                lineHeight: 1,
              }}
            >
              中東
            </span>
            <span style={{ color: "#374151", fontSize: "56px", fontWeight: 100, lineHeight: 1 }}>
              |
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span
                style={{
                  color: "#d1d5db",
                  fontSize: "40px",
                  letterSpacing: "0.18em",
                  fontFamily: "sans-serif",
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
                  fontFamily: "sans-serif",
                }}
              >
                JOONGDONG
              </span>
            </div>
          </div>
          <span style={{ color: "#374151", fontSize: "22px", fontFamily: "sans-serif" }}>
            중동인의 땀방울을 기록하다
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "NotoSerifKR", data: fontData, weight: 400, style: "normal" }]
        : [],
    }
  );
}
