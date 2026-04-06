"use client";
import { useRef, useEffect } from "react";

export default function SponsorMarquee({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf: number;
    let resumeTimer: ReturnType<typeof setTimeout>;
    let dragging = false;
    let startX = 0;
    let startScroll = 0;
    let velX = 0;
    let lastX = 0;
    let lastT = 0;
    let paused = false;
    let prevTime = 0;

    const SPEED = 50; // px/s

    const tick = (now: number) => {
      const dt = prevTime ? Math.min(now - prevTime, 50) : 0;
      prevTime = now;
      if (!dragging && !paused && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += SPEED * dt / 1000;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft -= el.scrollWidth / 2;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const startDrag = (x: number) => {
      dragging = true;
      paused = true;
      startX = x;
      startScroll = el.scrollLeft;
      velX = 0;
      lastX = x;
      lastT = Date.now();
      el.style.cursor = "grabbing";
      clearTimeout(resumeTimer);
    };

    const moveDrag = (x: number) => {
      if (!dragging) return;
      el.scrollLeft = startScroll - (x - startX);
      const now = Date.now();
      if (now - lastT > 0) velX = (x - lastX) / (now - lastT);
      lastX = x;
      lastT = now;
    };

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = "grab";
      let v = velX * 100;
      const momentum = () => {
        if (Math.abs(v) < 0.5) {
          resumeTimer = setTimeout(() => { paused = false; }, 800);
          return;
        }
        el.scrollLeft -= v * 0.016;
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

    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resumeTimer);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="overflow-x-scroll cursor-grab select-none pb-2"
      style={{ scrollbarWidth: "none" }}
    >
      {children}
    </div>
  );
}
