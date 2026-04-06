"use client";
import { useRef, useEffect } from "react";

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
    let startOffset = 0;
    let velX = 0;
    let lastX = 0;
    let lastT = 0;
    let paused = false;
    let prevTime = 0;
    let offset = 0;

    const SPEED = 50; // px/s

    const halfWidth = () => track.scrollWidth / 2;

    const clamp = (v: number) => {
      const h = halfWidth();
      if (h <= 0) return v;
      while (v <= -h) v += h;
      while (v > 0) v -= h;
      return v;
    };

    const apply = () => {
      track.style.transform = `translateX(${offset}px)`;
    };

    const tick = (now: number) => {
      const dt = prevTime ? Math.min(now - prevTime, 50) : 0;
      prevTime = now;
      if (!dragging && !paused) {
        offset = clamp(offset - SPEED * dt / 1000);
        apply();
      }
      raf = requestAnimationFrame(tick);
    };

    const startDrag = (x: number) => {
      dragging = true;
      paused = true;
      startX = x;
      startOffset = offset;
      velX = 0;
      lastX = x;
      lastT = Date.now();
      container.style.cursor = "grabbing";
      clearTimeout(resumeTimer);
    };

    const moveDrag = (x: number) => {
      if (!dragging) return;
      offset = clamp(startOffset + (x - startX));
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
      let v = velX * 80;
      const momentum = () => {
        if (Math.abs(v) < 0.3) {
          resumeTimer = setTimeout(() => { paused = false; }, 800);
          return;
        }
        offset = clamp(offset + v * 0.016);
        apply();
        v *= 0.9;
        requestAnimationFrame(momentum);
      };
      requestAnimationFrame(momentum);
    };

    const onMouseDown = (e: MouseEvent) => { e.preventDefault(); startDrag(e.clientX); };
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX);
    const onMouseUp = () => endDrag();
    const onTouchStart = (e: TouchEvent) => startDrag(e.touches[0].clientX);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); moveDrag(e.touches[0].clientX); };
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

  return (
    <div ref={containerRef} className="overflow-hidden cursor-grab select-none">
      <div
        ref={trackRef}
        className="flex gap-4 pb-2"
        style={{ width: "max-content", willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}
