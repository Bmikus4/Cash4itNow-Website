"use client";

/**
 * MODIFIED FROM UPSTREAM. Four changes, all of them containment, and each one is
 * listed here so a future re-copy of the original does not silently undo them.
 *
 *   1. The canvas was `fixed inset-0` and sized to window.innerWidth/Height, so
 *      it was a viewport-wide layer that stayed mounted behind every section of
 *      the page rather than living inside the one it belongs to. It is now
 *      `absolute inset-0`, sized to the host element via ResizeObserver.
 *   2. The rAF loop had no stop condition, so it repainted a full-viewport canvas
 *      for the rest of the session, including while scrolled far past it and
 *      while the tab was in the background. It now runs only while the host is
 *      on screen and the document is visible.
 *   3. mousemove and click used raw window coordinates, which after (1) are not
 *      the grid's coordinate space at all. Every pointer position is converted
 *      against the host's rect now. CLICK is bound to the host; POINTERMOVE is
 *      bound to the window on purpose — see the note at the listeners. It was
 *      briefly bound to the host too, and that is what made the highlight vanish
 *      one pixel outside the grid with its influence circle still almost
 *      entirely inside it.
 *   4. prefers-reduced-motion was not consulted at all. It now paints one static
 *      frame and starts no loop, and it re-evaluates if the setting changes.
 *
 * (2) is the one that matters most on a phone. The rest follow from it: a loop
 * you intend to stop needs to know which element it belongs to.
 */

import { useEffect, useRef, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  born: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CELL_SIZE = 55; // Desktop-ish size. Will dictate cols/rows
const INFLUENCE_RADIUS = 260;
const MAX_WARP = 24;
const DOT_SPACING = 28;
const LERP_SPEED = 0.08;

const LINE_BASE = { r: 255, g: 255, b: 255, a: 0.13 };
const NODE_BASE_RADIUS = 1.8;
const NODE_ACTIVE_RADIUS = 3.2;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerpN(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(
  base: { r: number; g: number; b: number; a: number },
  active: { r: number; g: number; b: number; a: number },
  t: number,
): string {
  const r = Math.round(lerpN(base.r, active.r, t));
  const g = Math.round(lerpN(base.g, active.g, t));
  const b = Math.round(lerpN(base.b, active.b, t));
  const a = lerpN(base.a, active.a, t);
  return `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KineticGrid({
  children,
  className,
  globalColor = "default",
}: {
  children?: ReactNode;
  className?: string;
  globalColor?: "default" | "monochrome";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const mouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const targetMouseRef = useRef<Point>({ x: -9999, y: -9999 });
  const ripplesRef = useRef<Ripple[]>([]);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // ── Warp ────────────────────────────────────────────────────────────────────

  const getWarpedPoint = useCallback(
    (
      gx: number,
      gy: number,
      col: number,
      row: number,
      mouse: Point,
      ripples: Ripple[],
      cols: number,
      rows: number,
    ): { pt: Point; proximity: number } => {
      // Edge pin — smoothly locks boundary rows/cols in place
      const edgeMargin = 1.5;
      const colPin = Math.min(
        col / edgeMargin,
        (cols - 1 - col) / edgeMargin,
        1,
      );
      const rowPin = Math.min(
        row / edgeMargin,
        (rows - 1 - row) / edgeMargin,
        1,
      );
      const pinFactor = colPin * colPin * rowPin * rowPin;

      const dx = gx - mouse.x;
      const dy = gy - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const proximity = Math.max(0, 1 - dist / INFLUENCE_RADIUS) * pinFactor;

      // Ripple displacement
      let rx = 0,
        ry = 0;
      for (const r of ripples) {
        const rdx = gx - r.x;
        const rdy = gy - r.y;
        const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
        const waveWidth = 55;
        const diff = rdist - r.radius;
        if (Math.abs(diff) < waveWidth) {
          const strength =
            (1 - Math.abs(diff) / waveWidth) * r.opacity * 18 * pinFactor;
          const angle = Math.atan2(rdy, rdx);
          const sign = diff < 0 ? -1 : 1;
          rx += Math.cos(angle) * strength * sign * -1;
          ry += Math.sin(angle) * strength * sign * -1;
        }
      }

      // Cursor warp with bell falloff
      if (dist < INFLUENCE_RADIUS && dist > 0 && pinFactor > 0) {
        const t = dist / INFLUENCE_RADIUS;
        const eased = t < 0.01 ? 0 : (1 - t) * (1 - t) * Math.min(1, dist / 60);
        const warpAmt = eased * MAX_WARP * pinFactor;
        const angle = Math.atan2(dy, dx);
        return {
          pt: {
            x: gx - Math.cos(angle) * warpAmt + rx,
            y: gy - Math.sin(angle) * warpAmt + ry,
          },
          proximity,
        };
      }

      return { pt: { x: gx + rx, y: gy + ry }, proximity };
    },
    [],
  );

  // ── Draw ────────────────────────────────────────────────────────────────────

  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w: W, h: H } = sizeRef.current;
      const mouse = mouseRef.current;
      const ripples = ripplesRef.current;

      const theme = {
        default: {
          bg: "#161618",
          lineActive: { r: 74, g: 158, b: 255, a: 0.9 },
          nodeActive: { r: 74, g: 158, b: 255, a: 1.0 },
          glow: "74,158,255",
          ripple: "100,180,255",
        },
        monochrome: {
          bg: "#000000",
          lineActive: { r: 255, g: 255, b: 255, a: 0.9 },
          nodeActive: { r: 255, g: 255, b: 255, a: 1.0 },
          glow: "255,255,255",
          ripple: "255,255,255",
        },
      }[globalColor ?? "default"];

      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      // Static background dot texture
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (let x = DOT_SPACING / 2; x < W; x += DOT_SPACING) {
        for (let y = DOT_SPACING / 2; y < H; y += DOT_SPACING) {
          ctx.beginPath();
          ctx.arc(x, y, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = (now - r.born) / 1000;
        // FIX: Ensure radius is never negative
        r.radius = Math.max(0, age * 400);
        r.opacity = Math.max(0, 1 - age * 1.2);
        if (r.opacity <= 0) ripples.splice(i, 1);
      }

      // ── Build warped grid ─────────────────────────────────────────────────
      const cols = Math.max(2, Math.ceil(W / CELL_SIZE)) + 1;
      const rows = Math.max(2, Math.ceil(H / CELL_SIZE)) + 1;
      const cellW = W / (cols - 1);
      const cellH = H / (rows - 1);

      const pts: Point[][] = [];
      const prox: number[][] = [];

      for (let row = 0; row < rows; row++) {
        pts[row] = [];
        prox[row] = [];
        for (let col = 0; col < cols; col++) {
          const { pt, proximity } = getWarpedPoint(
            col * cellW,
            row * cellH,
            col,
            row,
            mouse,
            ripples,
            cols,
            rows,
          );
          pts[row][col] = pt;
          prox[row][col] = proximity;
        }
      }

      // ── Grid lines ────────────────────────────────────────────────────────
      const drawSeg = (p1: Point, p2: Point, pr1: number, pr2: number) => {
        const avg = (pr1 + pr2) / 2;
        const t = avg * avg * (3 - 2 * avg); // smoothstep
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = lerpColor(LINE_BASE, theme.lineActive, t);
        ctx.lineWidth = lerpN(0.8, 1.5, t);
        ctx.stroke();
      };

      ctx.lineCap = "butt";

      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols - 1; col++)
          drawSeg(
            pts[row][col],
            pts[row][col + 1],
            prox[row][col],
            prox[row][col + 1],
          );

      for (let col = 0; col < cols; col++)
        for (let row = 0; row < rows - 1; row++)
          drawSeg(
            pts[row][col],
            pts[row + 1][col],
            prox[row][col],
            prox[row + 1][col],
          );

      // ── Intersection nodes ────────────────────────────────────────────────
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const p = pts[row][col];
          const pr = prox[row][col];
          const t = pr * pr * (3 - 2 * pr); // smoothstep
          const r = lerpN(NODE_BASE_RADIUS, NODE_ACTIVE_RADIUS, t);

          // Outer glow ring for active nodes
          if (t > 0.3) {
            const glowR = r + lerpN(0, 6, (t - 0.3) / 0.7);
            const grd = ctx.createRadialGradient(
              p.x,
              p.y,
              r * 0.5,
              p.x,
              p.y,
              glowR,
            );
            grd.addColorStop(0, `rgba(${theme.glow},${(t * 0.3).toFixed(3)})`);
            grd.addColorStop(1, `rgba(${theme.glow},0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();
          }

          // Node fill
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = lerpColor(
            { r: 255, g: 255, b: 255, a: 0.2 },
            theme.nodeActive,
            t,
          );
          ctx.fill();
        }
      }

      // ── Ripple rings ──────────────────────────────────────────────────────
      for (const r of ripples) {
        // FIX: Ensure radius is positive before drawing arc
        const safeRadius = Math.max(0, r.radius);
        ctx.beginPath();
        ctx.arc(r.x, r.y, safeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${theme.ripple},${(r.opacity * 0.28).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },
    [getWarpedPoint, globalColor],
  );

  // ── Animation loop ──────────────────────────────────────────────────────────

  const animate = useCallback(
    (now: number) => {
      // The stop condition upstream did not have. Without it, cancelling the
      // frame is not enough: any in-flight callback immediately queues another.
      if (!runningRef.current) return;

      const m = mouseRef.current;
      const t = targetMouseRef.current;

      m.x = lerpN(m.x, t.x, LERP_SPEED);
      m.y = lerpN(m.y, t.y, LERP_SPEED);

      draw(now);
      rafRef.current = requestAnimationFrame(animate);
    },
    [draw],
  );

  // ── Setup ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Sized from the HOST, not the window. The canvas is a layer inside this
    // section now, so the viewport is the wrong measurement in every case where
    // the section is not exactly viewport-sized.
    const setSize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (w === sizeRef.current.w && h === sizeRef.current.h) return;
      canvas.width = w;
      canvas.height = h;
      sizeRef.current = { w, h };
      // A resize invalidates the drawn frame, and while paused nothing will
      // redraw it. Paint once so a resize off-screen or under reduced motion
      // does not leave a stretched or blank canvas behind.
      if (!runningRef.current) draw(performance.now());
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(host);
    setSize();

    /*
     * HOST-RELATIVE COORDINATES, TRACKED ACROSS THE WHOLE WINDOW.
     *
     * These were bound to the host, and the note here said window-binding would
     * "warp the grid from pointer movement anywhere on the page, in the wrong
     * coordinate space". The second half of that stopped being true once the
     * canvas stopped being viewport-sized and these coordinates became
     * host-relative — subtracting the host's rect puts a pointer anywhere in the
     * window into the grid's own space, correctly, including outside it, where
     * the numbers simply go negative or past the width.
     *
     * The first half was the actual defect. Leaving the host snapped the target
     * to (-9999,-9999) and the highlight vanished instantly — one pixel past the
     * edge, with the influence circle still 259 of its 260 pixels over the grid.
     * Ben: the mouse should be able to move off screen, and the highlight should
     * only go when it is far enough that the highlight itself would be off the
     * page.
     *
     * That rule needs no special case. proximity is `1 - dist/INFLUENCE_RADIUS`
     * clamped at zero, so a pointer more than INFLUENCE_RADIUS outside the host
     * contributes nothing on its own. Tracking it honestly IS the fade.
     */
    const toLocal = (e: MouseEvent | PointerEvent): Point => {
      const rect = host.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerMove = (e: PointerEvent) => {
      targetMouseRef.current = toLocal(e);
    };

    /*
     * LEAVING THE BROWSER WINDOW is the one case tracking cannot cover, because
     * no more events arrive: the last position is on the viewport edge, where
     * half the influence circle is still over the grid, and the highlight would
     * sit there indefinitely.
     *
     * So the pointer is carried on in the direction it left, far enough that its
     * influence is entirely outside the host — one radius past whichever edge it
     * crossed. The existing lerp glides it out, which is why this looks like the
     * pointer leaving rather than the highlight being switched off.
     *
     * relatedTarget === null is what distinguishes leaving the WINDOW from
     * moving between elements inside it; every ordinary mouseout has a target.
     */
    const onWindowOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      const rect = host.getBoundingClientRect();
      const p = toLocal(e);
      const beyond = INFLUENCE_RADIUS + 1;
      if (e.clientY <= 0) p.y = -beyond;
      else if (e.clientY >= window.innerHeight - 1) p.y = rect.height + beyond;
      if (e.clientX <= 0) p.x = -beyond;
      else if (e.clientX >= window.innerWidth - 1) p.x = rect.width + beyond;
      targetMouseRef.current = p;
    };

    const onClick = (e: MouseEvent) => {
      const p = toLocal(e);
      ripplesRef.current.push({ ...p, radius: 0, opacity: 1, born: performance.now() });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseout", onWindowOut);
    host.addEventListener("click", onClick);

    const start = () => {
      if (runningRef.current || reduced.matches) return;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(animate);
    };

    const stop = () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    // The loop exists only while this section is on screen. A marketing page is
    // mostly the parts of it you are not looking at.
    let onScreen = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(host);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (onScreen) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Reduced motion gets one static frame and no loop, and it is re-evaluated
    // rather than read once, because the OS setting can change with the page open.
    const onReducedChange = () => {
      if (reduced.matches) {
        stop();
        draw(performance.now());
      } else if (onScreen && !document.hidden) {
        start();
      }
    };
    reduced.addEventListener("change", onReducedChange);

    if (reduced.matches) draw(performance.now());

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onReducedChange);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseout", onWindowOut);
      host.removeEventListener("click", onClick);
    };
  }, [animate, draw]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={hostRef}
      className={cn(
        "relative w-full min-h-screen overflow-hidden",
        globalColor === "monochrome" ? "bg-[#000000]" : "bg-[#161618]",
        className,
      )}
    >
      {/* absolute, NOT fixed. Fixed made this a viewport layer that outlived its
          own section and sat behind the whole page. */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-0 pointer-events-none"
      />

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
