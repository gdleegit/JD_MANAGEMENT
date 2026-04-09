"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminFooterLink() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-gray-500 mb-1 hover:text-gray-700 transition-colors cursor-pointer block w-full"
      >
        중동인의 땀방울을 기록하다.
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🔐</div>
            <h2 className="text-base font-extrabold text-gray-900 mb-1">관리자 전용 구역</h2>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              시크릿 버튼을 누르셨네요!<br />편집 페이지로 이동할까요?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                아니요
              </button>
              <button
                onClick={() => { setOpen(false); router.push("/admin"); }}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: "#176fc1" }}
              >
                이동할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
