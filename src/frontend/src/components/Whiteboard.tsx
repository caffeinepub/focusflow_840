import { Slider } from "@/components/ui/slider";
import {
  Download,
  Eraser,
  FileText,
  Palette,
  Pen,
  Plus,
  Trash2,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Tool = "pen" | "eraser" | "laser";

interface Point {
  x: number;
  y: number;
}

const COLORS = [
  "#ffffff",
  "#a78bfa",
  "#818cf8",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#fb923c",
  "#f87171",
  "#f472b6",
];

const LASER_FADE_MS = 5000;
const CANVAS_BG = "#0a0a10";

interface Slide {
  id: string;
  dataURL: string;
}

let _slideId = 0;
function mkSlideId() {
  return `s${++_slideId}`;
}

function blankDataURL(w: number, h: number): string {
  const c = document.createElement("canvas");
  c.width = w || 800;
  c.height = h || 500;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = CANVAS_BG;
  ctx.fillRect(0, 0, c.width, c.height);
  return c.toDataURL();
}

function exportAllAsPdf(
  slides: Slide[],
  currentIdx: number,
  currentCanvas: HTMLCanvasElement | null,
) {
  const allSlides = slides.map((s, i) => {
    if (i === currentIdx && currentCanvas) return currentCanvas.toDataURL();
    return s.dataURL;
  });

  const rows = allSlides
    .map(
      (src, i) =>
        `<div class="page"><img src="${src}"/><div class="lbl">Slide ${i + 1} / ${allSlides.length}</div></div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Stoa Whiteboard</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000}
.page{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a10;page-break-after:always;position:relative}
.page:last-child{page-break-after:avoid}
img{max-width:100%;max-height:100%;display:block}
.lbl{position:absolute;bottom:10px;right:14px;font-family:sans-serif;font-size:11px;color:rgba(255,255,255,.3)}
@media print{.page{page-break-after:always}.page:last-child{page-break-after:avoid}}
</style></head><body>
${rows}
<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Popup blocked", {
      description: "Allow popups for this site to export as PDF.",
      duration: 5000,
    });
    return;
  }
  win.document.write(html);
  win.document.close();
}

/* ── Slide thumbnail ── */
function SlideThumbnail({
  dataURL,
  index,
  active,
  onClick,
  onDelete,
  canDelete,
}: {
  dataURL: string;
  index: number;
  active: boolean;
  onClick: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <motion.div
      className="relative flex-shrink-0 cursor-pointer group"
      style={{ width: 96, height: 62 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <img
        src={dataURL}
        alt={`Slide ${index + 1}`}
        className="w-full h-full rounded-xl object-cover"
        style={{
          border: active
            ? "2px solid oklch(0.55 0.18 270 / 0.9)"
            : "1.5px solid oklch(0.28 0.04 270 / 0.5)",
          boxShadow: active
            ? "0 0 14px oklch(0.55 0.18 270 / 0.45)"
            : "0 2px 8px oklch(0 0 0 / 0.5)",
          transition: "border 0.2s, box-shadow 0.2s",
        }}
      />
      <div
        className="absolute bottom-1 left-1.5 text-[9px] font-bold rounded px-1"
        style={{
          background: "oklch(0.08 0.02 270 / 0.8)",
          color: active ? "oklch(0.78 0.14 270)" : "oklch(0.50 0.04 270)",
        }}
      >
        {index + 1}
      </div>
      {canDelete && (
        <motion.button
          type="button"
          aria-label="Delete slide"
          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: "oklch(0.22 0.08 25 / 0.95)",
            border: "1px solid oklch(0.50 0.18 25 / 0.6)",
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className="w-2 h-2" style={{ color: "oklch(0.72 0.14 25)" }} />
        </motion.button>
      )}
    </motion.div>
  );
}

/* ── Whiteboard ── */
export function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const laserCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(24);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slidesInitialized = useRef(false);

  const historyRef = useRef<ImageData[]>([]);
  const laserPoints = useRef<Point[]>([]);
  const laserAnimRef = useRef<number | null>(null);
  const laserStopTimeRef = useRef<number | null>(null);
  const lastPos = useRef<Point | null>(null);
  const switchingSlide = useRef(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const laser = laserCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !laser || !container) return;
    const { width, height } = container.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    let saved: ImageData | null = null;
    if (ctx && canvas.width > 0 && canvas.height > 0) {
      try {
        saved = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        /* ignore */
      }
    }
    canvas.width = width;
    canvas.height = height;
    laser.width = width;
    laser.height = height;
    if (ctx) {
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, width, height);
      if (saved) ctx.putImageData(saved, 0, 0);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // Init first slide once canvas is ready
  useEffect(() => {
    if (slidesInitialized.current) return;
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    slidesInitialized.current = true;
    setSlides([{ id: mkSlideId(), dataURL: canvas.toDataURL() }]);
  });

  useEffect(
    () => () => {
      if (laserAnimRef.current) cancelAnimationFrame(laserAnimRef.current);
    },
    [],
  );

  function saveCurrentSlideState(): string {
    return canvasRef.current?.toDataURL() ?? "";
  }

  function loadSlideIntoCanvas(dataURL: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!dataURL) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = dataURL;
  }

  function switchToSlide(index: number) {
    if (index === currentSlide || switchingSlide.current) return;
    switchingSlide.current = true;
    const saved = saveCurrentSlideState();
    setSlides((prev) => {
      const next = [...prev];
      next[currentSlide] = { ...next[currentSlide], dataURL: saved };
      return next;
    });
    setCurrentSlide(index);
    historyRef.current = [];
    setCanUndo(false);
    setTimeout(() => {
      loadSlideIntoCanvas(slides[index]?.dataURL ?? "");
      switchingSlide.current = false;
    }, 0);
  }

  function addSlide() {
    const saved = saveCurrentSlideState();
    const newURL = blankDataURL(
      canvasRef.current?.width ?? 800,
      canvasRef.current?.height ?? 500,
    );
    const newIndex = slides.length;
    setSlides((prev) => {
      const next = [...prev];
      next[currentSlide] = { ...next[currentSlide], dataURL: saved };
      return [...next, { id: mkSlideId(), dataURL: newURL }];
    });
    setCurrentSlide(newIndex);
    historyRef.current = [];
    setCanUndo(false);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = CANVAS_BG;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 0);
  }

  function deleteSlide(index: number) {
    if (slides.length <= 1) return;
    const savedCurrent = saveCurrentSlideState();
    const newSlides = slides.map((s, i) =>
      i === currentSlide ? { ...s, dataURL: savedCurrent } : s,
    );
    newSlides.splice(index, 1);
    const newIndex = Math.min(index, newSlides.length - 1);
    setSlides(newSlides);
    setCurrentSlide(newIndex);
    historyRef.current = [];
    setCanUndo(false);
    setTimeout(() => {
      loadSlideIntoCanvas(newSlides[newIndex]?.dataURL ?? "");
    }, 0);
  }

  const getPos = (e: React.PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [...historyRef.current.slice(-29), snap];
    setCanUndo(true);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || historyRef.current.length === 0) return;
    historyRef.current = historyRef.current.slice(0, -1);
    if (historyRef.current.length > 0) {
      ctx.putImageData(historyRef.current[historyRef.current.length - 1], 0, 0);
    } else {
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setCanUndo(historyRef.current.length > 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveHistory();
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "stoa-whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const renderLaserTrail = (globalAlpha: number) => {
    const laser = laserCanvasRef.current;
    if (!laser) return;
    const ctx = laser.getContext("2d");
    if (!ctx) return;
    const pts = laserPoints.current;
    ctx.clearRect(0, 0, laser.width, laser.height);
    if (pts.length < 2) return;

    const total = pts.length;
    for (let i = 1; i < total; i++) {
      const trailFrac = i / total;
      const segAlpha = globalAlpha * (trailFrac * 0.85 + 0.15);
      const p0 = pts[i - 1];
      const p1 = pts[i];

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 30, 80, ${segAlpha * 0.18})`;
      ctx.lineWidth = 40 * trailFrac + 10;
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(255, 30, 80, ${segAlpha * 0.18})`;
      ctx.shadowBlur = 80 * globalAlpha;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 80, 100, ${segAlpha * 0.55})`;
      ctx.lineWidth = 18 * trailFrac + 5;
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(255, 80, 100, ${segAlpha * 0.55})`;
      ctx.shadowBlur = 40 * globalAlpha;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 180, 180, ${segAlpha})`;
      ctx.lineWidth = 6 * trailFrac + 2;
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(255, 100, 100, ${segAlpha})`;
      ctx.shadowBlur = 12 * globalAlpha;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${segAlpha * 0.9})`;
      ctx.lineWidth = 2 * trailFrac + 1;
      ctx.lineCap = "round";
      ctx.shadowBlur = 0;
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    const tip = pts[total - 1];
    const bloomGrad = ctx.createRadialGradient(
      tip.x,
      tip.y,
      0,
      tip.x,
      tip.y,
      32,
    );
    bloomGrad.addColorStop(0, `rgba(255, 80, 80, ${globalAlpha * 0.35})`);
    bloomGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 32, 0, Math.PI * 2);
    ctx.fillStyle = bloomGrad;
    ctx.shadowBlur = 0;
    ctx.fill();

    const tipGrad = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 12);
    tipGrad.addColorStop(0, `rgba(255, 255, 255, ${globalAlpha})`);
    tipGrad.addColorStop(0.4, `rgba(255, 100, 100, ${globalAlpha * 0.9})`);
    tipGrad.addColorStop(1, "rgba(255, 0, 0, 0)");
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = tipGrad;
    ctx.fill();
  };

  const startDraw = (e: React.PointerEvent) => {
    const pos = getPos(e);
    if (tool === "laser") {
      if (laserAnimRef.current) cancelAnimationFrame(laserAnimRef.current);
      laserPoints.current = [];
      laserStopTimeRef.current = null;
      setIsDrawing(true);
      lastPos.current = pos;
      return;
    }
    saveHistory();
    setIsDrawing(true);
    lastPos.current = pos;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);

    if (tool === "laser") {
      laserPoints.current.push(pos);
      renderLaserTrail(1);
      lastPos.current = pos;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = eraserSize;
      ctx.shadowBlur = 0;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.shadowColor = color;
      ctx.shadowBlur = brushSize > 6 ? 6 : 3;
    }

    const midX = (lastPos.current.x + pos.x) / 2;
    const midY = (lastPos.current.y + pos.y) / 2;
    ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, midX, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    lastPos.current = pos;
    ctx.restore();
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === "laser" && laserPoints.current.length > 0) {
      laserStopTimeRef.current = Date.now();
      startLaserFade();
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "source-over";
        ctx.shadowBlur = 0;
        ctx.beginPath();
      }
    }
    lastPos.current = null;
  };

  const startLaserFade = () => {
    if (laserAnimRef.current) cancelAnimationFrame(laserAnimRef.current);
    const animate = () => {
      const stopTime = laserStopTimeRef.current;
      if (!stopTime) return;
      const elapsed = Date.now() - stopTime;
      if (elapsed >= LASER_FADE_MS) {
        const laser = laserCanvasRef.current;
        const ctx = laser?.getContext("2d");
        if (ctx && laser) ctx.clearRect(0, 0, laser.width, laser.height);
        laserPoints.current = [];
        laserStopTimeRef.current = null;
        return;
      }
      const t = elapsed / LASER_FADE_MS;
      const alpha = 1 - (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
      renderLaserTrail(Math.max(0, alpha));
      laserAnimRef.current = requestAnimationFrame(animate);
    };
    laserAnimRef.current = requestAnimationFrame(animate);
  };

  const toolCursor =
    tool === "laser"
      ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='5' fill='none' stroke='%23ff4466' stroke-width='2'/%3E%3Ccircle cx='10' cy='10' r='2' fill='%23ff4466'/%3E%3C/svg%3E") 10 10, crosshair`
      : tool === "eraser"
        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${eraserSize}' height='${eraserSize}' viewBox='0 0 ${eraserSize} ${eraserSize}'%3E%3Ccircle cx='${eraserSize / 2}' cy='${eraserSize / 2}' r='${eraserSize / 2 - 1}' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E") ${eraserSize / 2} ${eraserSize / 2}, crosshair`
        : "crosshair";

  return (
    <div
      className="flex flex-col h-full"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl font-display font-bold text-foreground">
            White<span className="text-gradient-primary">board</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Draw, sketch, and annotate freely — {slides.length} slide
            {slides.length !== 1 ? "s" : ""}
          </p>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-3">
        <motion.div
          className="glass-card rounded-2xl px-4 py-2.5 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          {/* Tool buttons */}
          <div className="flex items-center gap-1">
            {[
              { id: "pen" as Tool, icon: Pen, label: "Pen" },
              { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
              { id: "laser" as Tool, icon: Zap, label: "Laser" },
            ].map((t) => (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                title={t.label}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  tool === t.id
                    ? t.id === "laser"
                      ? "bg-red-500/20 text-red-300 border border-red-400/40 shadow-[0_0_12px_rgba(255,50,80,0.35)]"
                      : "bg-primary/20 text-primary border border-primary/40 shadow-[0_0_12px_oklch(var(--primary)/0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/8 border border-transparent"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.id === "laser" && tool === "laser" && (
                  <span
                    className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{
                      background: "#ff4466",
                      boxShadow: "0 0 6px #ff4466",
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <div className="w-px h-7 bg-border/60" />

          {/* Color swatches */}
          {tool !== "eraser" && tool !== "laser" && (
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <motion.button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-5 h-5 rounded-full border-2 transition-all flex-shrink-0"
                  style={{
                    background: c,
                    borderColor: color === c ? "white" : "transparent",
                    boxShadow: color === c ? `0 0 10px ${c}` : "none",
                  }}
                  whileHover={{ scale: 1.25 }}
                  whileTap={{ scale: 0.85 }}
                />
              ))}
              <div className="relative">
                <motion.button
                  type="button"
                  className="w-5 h-5 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-primary/60"
                  onClick={() => setShowColorPicker((v) => !v)}
                  whileTap={{ scale: 0.85 }}
                >
                  <Palette className="w-2.5 h-2.5 text-muted-foreground" />
                </motion.button>
                {showColorPicker && (
                  <div className="absolute top-8 left-0 z-50 glass-elevated rounded-xl p-2 border border-border">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-24 h-8 cursor-pointer rounded border-0 bg-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Brush/eraser size */}
          {tool !== "laser" && (
            <>
              <div className="w-px h-7 bg-border/60" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {tool === "eraser" ? "Eraser" : "Brush"}
                </span>
                <Slider
                  min={tool === "eraser" ? 10 : 1}
                  max={tool === "eraser" ? 80 : 32}
                  step={1}
                  value={[tool === "eraser" ? eraserSize : brushSize]}
                  onValueChange={([v]) =>
                    tool === "eraser" ? setEraserSize(v) : setBrushSize(v)
                  }
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground w-5 text-right">
                  {tool === "eraser" ? eraserSize : brushSize}
                </span>
              </div>
            </>
          )}

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </motion.button>
            <motion.button
              type="button"
              onClick={downloadCanvas}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/8 transition-all"
              whileTap={{ scale: 0.9 }}
              title="Save current slide as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              PNG
            </motion.button>
            <motion.button
              type="button"
              onClick={() =>
                exportAllAsPdf(slides, currentSlide, canvasRef.current)
              }
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                color: "oklch(0.72 0.14 270)",
                background: "oklch(0.16 0.06 270 / 0.4)",
                border: "1px solid oklch(0.35 0.10 270 / 0.35)",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.9 }}
              title="Export all slides as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              Save PDF
            </motion.button>
            <motion.button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Main: slides panel + canvas */}
      <div className="flex flex-1 gap-3 px-6 pb-6 min-h-0">
        {/* Slides panel */}
        <motion.div
          className="flex flex-col gap-2 flex-shrink-0"
          style={{ width: 112 }}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <div
            className="flex-1 rounded-2xl p-2 flex flex-col gap-2 overflow-y-auto"
            style={{
              background: "oklch(0.09 0.02 270 / 0.7)",
              border: "1px solid oklch(0.22 0.04 270 / 0.5)",
              boxShadow: "inset 0 1px 0 oklch(1 0 0 / 0.04)",
              scrollbarWidth: "thin",
              scrollbarColor: "oklch(0.28 0.06 270 / 0.5) transparent",
            }}
          >
            <AnimatePresence>
              {slides.map((slide, i) => (
                <SlideThumbnail
                  key={slide.id}
                  dataURL={slide.dataURL}
                  index={i}
                  active={i === currentSlide}
                  canDelete={slides.length > 1}
                  onClick={() => switchToSlide(i)}
                  onDelete={() => deleteSlide(i)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Add slide */}
          <motion.button
            type="button"
            data-ocid="whiteboard.add_slide"
            onClick={addSlide}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold w-full"
            style={{
              background: "oklch(0.14 0.06 270 / 0.7)",
              border: "1.5px solid oklch(0.42 0.12 270 / 0.45)",
              color: "oklch(0.68 0.12 270)",
            }}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 0 14px oklch(0.50 0.15 270 / 0.35)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Slide
          </motion.button>
        </motion.div>

        {/* Canvas */}
        <motion.div
          ref={containerRef}
          className="relative flex-1 rounded-2xl overflow-hidden"
          style={{
            minHeight: 400,
            background: CANVAS_BG,
            cursor: toolCursor,
            backgroundImage:
              "radial-gradient(circle, oklch(0.45 0.02 250 / 0.25) 1.5px, transparent 1.5px)",
            backgroundSize: "28px 28px",
            boxShadow:
              "0 0 0 1px oklch(0.35 0.02 250 / 0.5), 0 4px 60px oklch(0.1 0.02 250 / 0.8), inset 0 1px 0 oklch(1 0 0 / 0.04)",
          }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.5 0.15 280 / 0.06) 0%, transparent 70%)",
            }}
          />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none"
            style={{ cursor: toolCursor }}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
          />
          <canvas
            ref={laserCanvasRef}
            className="absolute inset-0 pointer-events-none touch-none"
          />

          {/* Slide indicator */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <div
              className="px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{
                background: "oklch(0.10 0.03 270 / 0.85)",
                border: "1px solid oklch(0.30 0.06 270 / 0.5)",
                color: "oklch(0.60 0.10 270)",
                backdropFilter: "blur(8px)",
              }}
            >
              {currentSlide + 1} / {slides.length}
            </div>
          </div>

          {/* Laser active label */}
          {tool === "laser" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{
                  color: "rgba(255,100,120,0.9)",
                  borderColor: "rgba(255,50,80,0.3)",
                  background: "rgba(255,50,80,0.08)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 0 16px rgba(255,50,80,0.15)",
                }}
              >
                ⚡ Laser — glows red, fades in 5s
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
