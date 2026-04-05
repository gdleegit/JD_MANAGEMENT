import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const alt = "中東AA | Athletic Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = readFileSync(join(process.cwd(), "public/jd2.svg"));
  const logoSrc = `data:image/svg+xml;base64,${logoBuffer.toString("base64")}`;

  const notoSansData = readFileSync(join(process.cwd(), "src/app/noto-sans.ttf"));
  const notoSerifData = readFileSync(join(process.cwd(), "src/app/noto-serif-kr.ttf"));

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
          gap: "56px",
          padding: "0 100px",
        }}
      >
        {/* 로고 */}
        <img src={logoSrc} width={180} height={180} style={{ flexShrink: 0 }} />

        {/* 사이트명 — 헤더와 동일한 구조 */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {/* 中東 + JOONGDONG */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span
              style={{
                color: "white",
                fontSize: "96px",
                fontFamily: "NotoSerifKR",
                lineHeight: 1,
                letterSpacing: "0.05em",
              }}
            >
              中東
            </span>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: "#4b5563",
                fontSize: "15px",
                letterSpacing: "0.05em",
                fontFamily: "NotoSans",
              }}
            >
              {"JOONGDONG".split("").map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          </div>

          {/* 구분선 */}
          <span
            style={{
              color: "#374151",
              fontSize: "64px",
              fontFamily: "NotoSans",
              fontWeight: 100,
              lineHeight: 1,
            }}
          >
            |
          </span>

          {/* Athletic Archive */}
          <span
            style={{
              color: "#d1d5db",
              fontSize: "38px",
              letterSpacing: "0.18em",
              fontFamily: "NotoSans",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#176fc1" }}>A</span>thletic{" "}
            <span style={{ color: "#176fc1" }}>A</span>rchive
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NotoSans",   data: notoSansData.buffer  as ArrayBuffer, weight: 400, style: "normal" },
        { name: "NotoSerifKR", data: notoSerifData.buffer as ArrayBuffer, weight: 400, style: "normal" },
      ],
    }
  );
}
