"use client";
import React, { useRef, useLayoutEffect, useEffect, useState } from "react";

const COPIES = 8;

export default function SponsorMarquee({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef  = useRef<HTMLDivElement>(null);
  const trackRef    = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"measuring" | "static" | "scroll">("measuring");

  const childArray = React.Children.toArray(children);

  // 페인트 전에 너비 측정 → 깜빡임 없음
  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure   = measureRef.current;
    if (!container || !measure) return;

    const check = () => {
      const singleW    = measure.scrollWidth;
      const containerW = container.clientWidth;
      setMode(singleW > containerW ? "scroll" : "static");
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // 마퀴 애니메이션 — scroll 모드일 때만 실행
  useEffect(() => {
    if (mode !== "scroll") return;
    const container = containerRef.current;
    const track     = trackRef.current;
    if (!container || !track) return;

    let raf: number;
    let resumeTimer: ReturnType<typeof setTimeout>;
    let dragging = false;
    let startX = 0, startY = 0, startOffset = 0;
    let velX = 0, lastX = 0, lastT = 0;
    let paused = false, prevTime = 0, offset = 0;
    let directionLocked: "h" | "v" | null = null;

    const SPEED = 45;
    const lapW = () => track.scrollWidth / COPIES;

    const normalize = (v: number) => {
      const h = lapW();
      if (h <= 0) return v;
      while (v <= -h) v += h;
      while (v > 0)  v -= h;
      return v;
    };

    const apply = () => {
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const tick = (now: number) => {
      const dt = prevTime ? Math.min(now - prevTime, 50) : 0;
      prevTime = now;
      if (!dragging && !paused) {
        offset = normalize(offset - SPEED * dt / 1000);
        apply();
      }
      raf = requestAnimationFrame(tick);
    };

    const startDrag = (x: number, y: number) => {
      dragging = true; paused = true;
      startX = x; startY = y; startOffset = offset;
      velX = 0; lastX = x; lastT = Date.now();
      directionLocked = null;
      container.style.cursor = "grabbing";
      clearTimeout(resumeTimer);
    };

    const moveDrag = (x: number, y: number, e?: TouchEvent) => {
      if (!dragging) return;
      if (!directionLocked) {
        const dx = Math.abs(x - startX), dy = Math.abs(y - startY);
        if (dx < 3 && dy < 3) return;
        directionLocked = dx >= dy ? "h" : "v";
      }
      if (directionLocked === "v") {
        dragging = false; paused = false;
        container.style.cursor = "grab"; return;
      }
      if (e) e.preventDefault();
      offset = normalize(startOffset + (x - startX));
      apply();
      const now = Date.now();
      if (now - lastT > 0) velX = (x - lastX) / (now - lastT);
      lastX = x; lastT = now;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      container.style.cursor = "grab";
      let v = velX * 120;
      const momentum = () => {
        if (Math.abs(v) < 0.3) {
          resumeTimer = setTimeout(() => { paused = false; }, 600);
          return;
        }
        offset = normalize(offset + v * 0.016);
        apply(); v *= 0.92;
        requestAnimationFrame(momentum);
      };
      requestAnimationFrame(momentum);
    };

    const onMouseDown = (e: MouseEvent) => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp   = () => endDrag();
    const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove  = (e: TouchEvent) => moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
    const onTouchEnd   = () => endDrag();

    container.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mousemove",     onMouseMove);
    window.addEventListener("mouseup",       onMouseUp);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove",  onTouchMove,  { passive: false });
    container.addEventListener("touchend",   onTouchEnd);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      container.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mousemove",     onMouseMove);
      window.removeEventListener("mouseup",       onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove",  onTouchMove);
      container.removeEventListener("touchend",   onTouchEnd);
    };
  }, [mode]);

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden" }}>
      {/* 너비 측정용 숨김 div (단일 복사본) */}
      <div
        ref={measureRef}
        className="flex gap-2.5 px-4 sm:px-8"
        style={{ width: "max-content", position: "absolute", visibility: "hidden", pointerEvents: "none" }}
        aria-hidden
      >
        {childArray}
      </div>

      {/* 정적 중앙 배치 */}
      {mode === "static" && (
        <div className="flex justify-center flex-wrap gap-2.5 px-4 sm:px-8 pb-2">
          {childArray}
        </div>
      )}

      {/* 마퀴 스크롤 */}
      {mode !== "static" && (
        <div
          className="overflow-hidden cursor-grab select-none"
          style={{ opacity: mode === "measuring" ? 0 : 1 }}
        >
          <div
            ref={trackRef}
            className="flex gap-2.5 pb-2 px-4 sm:px-8"
            style={{ width: "max-content", willChange: "transform" }}
          >
            {Array.from({ length: COPIES }, (_, ci) =>
              childArray.map((child, ii) => (
                <React.Fragment key={`${ci}-${ii}`}>{child}</React.Fragment>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
