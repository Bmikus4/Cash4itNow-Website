import React, { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Draggable before/after image comparison slider.
 * The "after" image is the base layer; the "before" image is clipped to the
 * left of the handle. Drag (mouse/touch) or use arrow keys to reveal.
 */
export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
  className = "",
}) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  const setFromClientX = useCallback((clientX) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  }, []);

  const onPointerDown = (e) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    setFromClientX(e.clientX);
  };
  const stopDrag = (e) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden touch-none cursor-ew-resize ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={stopDrag}
      onPointerLeave={stopDrag}
    >
      {/* After (base layer, full) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        draggable={false}
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Before (clipped to the left of the handle) */}
      <img
        src={beforeSrc}
        alt={beforeLabel}
        draggable={false}
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      {/* Corner labels */}
      <span className="absolute top-4 left-4 bg-foreground/80 text-background text-xs font-heading font-bold uppercase tracking-widest px-3 py-1.5 pointer-events-none">
        {beforeLabel}
      </span>
      <span className="absolute top-4 right-4 bg-accent text-white text-xs font-heading font-bold uppercase tracking-widest px-3 py-1.5 pointer-events-none">
        {afterLabel}
      </span>

      {/* Divider line + handle */}
      <div
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `calc(${pos}% - 2px)` }}
      />
      <button
        type="button"
        role="slider"
        aria-label="Drag to compare before and after"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        onKeyDown={onKeyDown}
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white text-foreground flex items-center justify-center shadow-lg ring-2 ring-accent focus:outline-none focus:ring-4 focus:ring-accent/60"
        style={{ left: `${pos}%` }}
      >
        <ChevronLeft className="w-4 h-4 -mr-1" />
        <ChevronRight className="w-4 h-4 -ml-1" />
      </button>
    </div>
  );
}
