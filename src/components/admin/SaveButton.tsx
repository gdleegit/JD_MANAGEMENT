"use client";

import { useState, useEffect } from "react";

type SaveState = "idle" | "saving" | "saved";

export default function SaveButton({
  onClick,
  disabled,
  label = "저장",
  className = "",
  size = "default",
}: {
  onClick: () => Promise<void>;
  disabled?: boolean;
  label?: string;
  className?: string;
  size?: "default" | "sm";
}) {
  const [state, setState] = useState<SaveState>("idle");

  const handleClick = async () => {
    if (state !== "idle" || disabled) return;
    setState("saving");
    try {
      await onClick();
      setState("saved");
    } catch {
      setState("idle");
    }
  };

  useEffect(() => {
    if (state !== "saved") return;
    const t = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(t);
  }, [state]);

  const sizeClass = size === "sm" ? "btn-sm text-xs" : "";
  const colorClass =
    state === "saved"
      ? "bg-green-600 hover:bg-green-600 text-white"
      : "btn-primary";

  return (
    <button
      onClick={handleClick}
      disabled={state === "saving" || disabled}
      className={`btn ${colorClass} ${sizeClass} ${className} gap-1.5`}
    >
      {state === "saving" && (
        <svg className="animate-spin h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {state === "saved" && (
        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
      {state === "saving" ? "저장 중..." : state === "saved" ? "저장됨" : label}
    </button>
  );
}
