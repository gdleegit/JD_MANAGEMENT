"use client";
import React, { useRef, useEffect } from "react";

const COPIES = 8; // 충분히 많이 복사해 어떤 화면폭에서도 루프 끊김 없음

export default function SponsorMarquee({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    let raf: number;
    let resumeTimer: ReturnType<typeof setTimeout>;
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startOffset = 0;
    let velX = 0;
    let lastX = 0;
    let lastT = 0;
    let paused = false;
    let prevTime = 0;
    let offset = 0;
    let directionLocked: "h" | "v" | null = null;

    const SPEED = 45; // px/s

    // 단일 복사본 너비 = 전체 track / COPIES
    const lapWidth = () => track.scrollWidth / COPIES;

    const normalize = (v: number) => {
      const h = lapWidth();
      if (h <= 0) return v;
      while (v <= -h) v += h;
      while (v > 0) v -= h;
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
      dragging = true;
      paused = true;
      startX = x;
      startY = y;
      startOffset = offset;
      velX = 0;
      lastX = x;
      lastT = Date.now();
      directionLocked = null;
      container.style.cursor = "grabbing";
      clearTimeout(resumeTimer);
    };

    const moveDrag = (x: number, y: number, e?: TouchEvent) => {
      if (!dragging) return;
      if (!directionLocked) {
        const dx = Math.abs(x - startX);
        const dy = Math.abs(y - startY);
        if (dx < 3 && dy < 3) return;
        directionLocked = dx >= dy ? "h" : "v";
      }
      if (directionLocked === "v") {
        dragging = false;
        paused = false;
        container.style.cursor = "grab";
        return;
      }
      if (e) e.preventDefault();
      offset = normalize(startOffset + (x - startX));
      apply();
      const now = Date.now();
      if (now - lastT > 0) velX = (x - lastX) / (now - lastT);
      lastX = x;
      lastT = now;
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
        apply();
        v *= 0.92;
        requestAnimationFrame(momentum);
      };
      requestAnimationFrame(momentum);
    };

    const onMouseDown = (e: MouseEvent) => { e.preventDefault(); startDrag(e.clientX, e.clientY); };
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX, e.clientY);
    const onMouseUp = () => endDrag();
    const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientX, e.touches[0].clientY, e);
    const onTouchEnd = () => endDrag();

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const childArray = React.Children.toArray(children);

  return (
    <div ref={containerRef} className="overflow-hidden cursor-grab select-none">
      <div
        ref={trackRef}
        className="flex gap-4 pb-2 px-4 sm:px-8"
        style={{ width: "max-content", willChange: "transform" }}
      >
        {Array.from({ length: COPIES }, (_, copyIdx) =>
          childArray.map((child, itemIdx) => (
            <React.Fragment key={`${copyIdx}-${itemIdx}`}>{child}</React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
