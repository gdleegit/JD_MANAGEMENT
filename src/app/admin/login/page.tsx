"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #176fc1 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #176fc1 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-[380px]">
        {/* 카드 */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(23,111,193,0.15)",
          }}
        >
          {/* 상단 파란 라인 */}
          <div style={{ height: "3px", background: "linear-gradient(90deg, #176fc1, #2252ab, #176fc1)" }} />

          <div className="px-8 pt-8 pb-9">
            {/* 로고 + 브랜딩 */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div
                  className="absolute inset-0 rounded-full blur-xl opacity-40"
                  style={{ background: "#176fc1" }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/jd2.svg"
                  alt="中東 Athletic Archive"
                  className="relative w-14 h-14"
                />
              </div>
              <p className="text-xs font-bold tracking-[0.25em] uppercase mb-1" style={{ color: "#176fc1" }}>
                Athletic Archive
              </p>
              <h1 className="text-white text-xl font-extrabold tracking-tight">관리자</h1>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>
                  아이디
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="아이디를 입력하세요"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "1rem",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = "1px solid rgba(23,111,193,0.7)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(23,111,193,0.15)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: loading || !username.trim()
                    ? "rgba(23,111,193,0.4)"
                    : "linear-gradient(135deg, #176fc1, #2252ab)",
                  boxShadow: loading || !username.trim() ? "none" : "0 4px 20px rgba(23,111,193,0.4)",
                  fontSize: "0.95rem",
                  letterSpacing: "0.04em",
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    로그인 중...
                  </span>
                ) : "로그인"}
              </button>
            </form>
          </div>
        </div>

        {/* 하단 안내 */}
        <p className="text-center text-xs text-gray-600 mt-5">
          중동 체육위원회 관리자 전용
        </p>
      </div>
    </div>
  );
}
