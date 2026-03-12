import { useEffect, useRef } from "react";

interface TrailDot {
  x: number;
  y: number;
  id: number;
  el: HTMLDivElement;
  timeoutId: ReturnType<typeof setTimeout>;
}

let dotCounter = 0;

export function CursorTrail() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<TrailDot[]>([]);
  const tickRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function onMouseMove(e: MouseEvent) {
      if (!container) return;
      // Throttle to every 2nd move event for performance
      tickRef.current++;
      if (tickRef.current % 2 !== 0) return;

      dotCounter++;
      const id = dotCounter;
      const el = document.createElement("div");
      const size = 6 + Math.random() * 5;
      const isEmerald = Math.random() > 0.5;
      const color = isEmerald
        ? "oklch(0.72 0.17 162 / 0.7)"
        : "oklch(0.78 0.16 75 / 0.6)";

      el.style.cssText = `
        position:fixed;
        left:${e.clientX}px;
        top:${e.clientY}px;
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        background:${color};
        box-shadow:0 0 ${size * 2}px ${color};
        pointer-events:none;
        z-index:9999;
        margin-left:${-size / 2}px;
        margin-top:${-size / 2}px;
        transform:scale(1);
        opacity:1;
        transition:transform 0.5s ease-out, opacity 0.5s ease-out;
        will-change:transform,opacity;
      `;

      container.appendChild(el);

      // Trigger animation on next frame
      requestAnimationFrame(() => {
        el.style.transform = "scale(0.1)";
        el.style.opacity = "0";
      });

      const timeoutId = setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
        trailRef.current = trailRef.current.filter((d) => d.id !== id);
      }, 550);

      trailRef.current.push({ x: e.clientX, y: e.clientY, id, el, timeoutId });
    }

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      for (const dot of trailRef.current) {
        clearTimeout(dot.timeoutId);
        if (dot.el.parentNode) dot.el.parentNode.removeChild(dot.el);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
