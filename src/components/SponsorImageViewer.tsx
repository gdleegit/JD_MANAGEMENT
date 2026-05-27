"use client";

import { useState } from "react";

export default function SponsorImageViewer({
  imageUrl,
  tournamentName,
}: {
  imageUrl: string;
  tournamentName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 썸네일 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 block w-full"
        style={{ borderTop: "3px solid #176fc1" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`${tournamentName} 협찬·후원`}
          className="w-full object-cover max-h-48 sm:max-h-56"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow">
            🔍 크게 보기
          </span>
        </div>
      </button>

      {/* 라이트박스 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-white text-sm font-semibold">{tournamentName} · 협찬·후원</span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/70 hover:text-white text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            {/* 이미지 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${tournamentName} 협찬·후원`}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
