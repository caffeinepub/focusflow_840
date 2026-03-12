import { Slider } from "@/components/ui/slider";
import {
  Download,
  Eraser,
  Palette,
  Pen,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type Tool = "pen" | "eraser" | "laser";

interface Point {
  x: number;
  y: number;
}

const COLORS = [
  "#ffffff",
  "#a78bfa",
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#fb923c",
  "#e879f9",
  "#000000",
];

// Laser blinks for this long after drawing stops, then disappears
const LASER_BLINK_MS = 5000;
// Blink frequency in Hz — slow smooth pulse
const LASER_BLINK_HZ = 0.6;

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

  const historyRef = useRef<ImageData[]>([]);
  // Accumulated laser stroke points
  const laserPoints = useRef<Point[]>([]);
  const laserAnimRef = useRef<number | null>(null);
  // Timestamp when drawing stopped (null while drawing or idle)
  const laserStopTimeRef = useRef<number | null>(null);
  const lastPos = useRef<Point | null>(null);

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
      } catch {}
    }
    canvas.width = width;
    canvas.height = height;
    laser.width = width;
    laser.height = height;
    if (ctx) {
      ctx.fillStyle = "#0f0f14";
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

  useEffect(() => {
    return () => {
      if (laserAnimRef.current) cancelAnimationFrame(laserAnimRef.current);
    };
  }, []);

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
    historyRef.current = [...historyRef.current.slice(-19), snap];
    setCanUndo(historyRef.current.length > 0);
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
      ctx.fillStyle = "#0f0f14";
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
    ctx.fillStyle = "#0f0f14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  /** Render the laser trail at a given global alpha (0-1) */
  const renderLaserTrail = (globalAlpha: number) => {
    const laser = laserCanvasRef.current;
    if (!laser) return;
    const ctx = laser.getContext("2d");
    if (!ctx) return;
    const pts = laserPoints.current;
    ctx.clearRect(0, 0, laser.width, laser.height);
    if (pts.length < 2) return;

    for (let i = 1; i < pts.length; i++) {
      // Tail fades: earlier segments are more transparent
      const trailFrac = i / pts.length;
      const segAlpha = globalAlpha * (trailFrac * 0.85 + 0.15);

      // Outer wide glow pass
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 30, 30, ${segAlpha * 0.3})`;
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(255, 60, 60, ${segAlpha * 0.3})`;
      ctx.shadowBlur = 60 * globalAlpha;
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();

      // Core bright line
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255, 30, 30, ${segAlpha})`;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(255, 60, 60, ${segAlpha})`;
      ctx.shadowBlur = 40 * globalAlpha;
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }

    // Glowing dot at the tip
    const tip = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 8 * globalAlpha + 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${globalAlpha * 0.9})`;
    ctx.shadowColor = "rgba(255, 80, 80, 1)";
    ctx.shadowBlur = 50 * globalAlpha;
    ctx.fill();
  };

  const startDraw = (e: React.PointerEvent) => {
    if (tool === "laser") {
      // Cancel any ongoing blink animation
      if (laserAnimRef.current) cancelAnimationFrame(laserAnimRef.current);
      laserPoints.current = [];
      laserStopTimeRef.current = null;
      setIsDrawing(true);
      lastPos.current = getPos(e);
      return;
    }
    saveHistory();
    setIsDrawing(true);
    const pos = getPos(e);
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
      laserPoints.current.push({ x: pos.x, y: pos.y });
      renderLaserTrail(1);
      lastPos.current = pos;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPos.current) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = eraserSize;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.shadowColor = color;
      ctx.shadowBlur = brushSize > 8 ? 4 : 2;
    }

    const midX = (lastPos.current.x + pos.x) / 2;
    const midY = (lastPos.current.y + pos.y) / 2;
    ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, midX, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    lastPos.current = pos;
  };

  const endDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
      ctx.beginPath();
    }
    lastPos.current = null;

    if (tool === "laser" && laserPoints.current.length > 0) {
      laserStopTimeRef.current = Date.now();
      startLaserBlink();
    }
  };

  const startLaserBlink = () => {
    if (laserAnimRef.current) cancelAnimationFrame(laserAnimRef.current);

    const animate = () => {
      const stopTime = laserStopTimeRef.current;
      if (!stopTime) return;

      const elapsed = Date.now() - stopTime;

      if (elapsed >= LASER_BLINK_MS) {
        // Blink period over — clear and stop
        const laser = laserCanvasRef.current;
        const ctx = laser?.getContext("2d");
        if (ctx && laser) ctx.clearRect(0, 0, laser.width, laser.height);
        laserPoints.current = [];
        laserStopTimeRef.current = null;
        return;
      }

      // Envelope fades from 1 to 0 over the 5 seconds
      const envelope = 1 - elapsed / LASER_BLINK_MS;
      // Smooth slow sine pulse starting at 0 when drawing stops
      const alpha =
        envelope *
        ((Math.sin(
          (elapsed / 1000) * LASER_BLINK_HZ * Math.PI * 2 - Math.PI / 2,
        ) +
          1) /
          2);

      renderLaserTrail(alpha);
      laserAnimRef.current = requestAnimationFrame(animate);
    };

    laserAnimRef.current = requestAnimationFrame(animate);
  };

  const toolCursor =
    tool === "eraser"
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
            Draw, annotate, and present your ideas
          </p>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-3">
        <motion.div
          className="glass-card rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          {/* Tools */}
          <div className="flex items-center gap-1.5">
            {(
              [
                { id: "pen" as Tool, icon: Pen, label: "Pen" },
                { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
                { id: "laser" as Tool, icon: Zap, label: "Laser" },
              ] as const
            ).map((t) => (
              <motion.button
                key={t.id}
                type="button"
                data-ocid={`whiteboard.${t.id}.toggle`}
                onClick={() => setTool(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  tool === t.id
                    ? t.id === "laser"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-primary/15 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
                whileTap={{ scale: 0.93 }}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.id === "laser" && tool === "laser" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                )}
              </motion.button>
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Color swatches */}
          {tool === "pen" && (
            <div className="flex items-center gap-1.5">
              {COLORS.map((c) => (
                <motion.button
                  key={c}
                  type="button"
                  data-ocid="whiteboard.color.button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    background: c,
                    borderColor: color === c ? "white" : "transparent",
                    boxShadow: color === c ? `0 0 10px ${c}99` : undefined,
                  }}
                  whileTap={{ scale: 0.85 }}
                  whileHover={{ scale: 1.15 }}
                />
              ))}
              <div className="relative">
                <motion.button
                  type="button"
                  data-ocid="whiteboard.custom_color.button"
                  className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-primary/60 transition-colors"
                  onClick={() => setShowColorPicker((v) => !v)}
                  whileTap={{ scale: 0.85 }}
                >
                  <Palette className="w-3 h-3 text-muted-foreground" />
                </motion.button>
                <AnimatePresence>
                  {showColorPicker && (
                    <motion.div
                      className="absolute top-9 left-0 z-50 glass-elevated rounded-xl p-2 border border-border"
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      transition={{ duration: 0.15 }}
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-24 h-8 cursor-pointer rounded border-0 bg-transparent"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Brush / Eraser size */}
          {tool !== "laser" && (
            <>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2 min-w-[120px]">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {tool === "eraser" ? "Eraser" : "Brush"}
                </span>
                <Slider
                  data-ocid="whiteboard.brush_size.input"
                  min={tool === "eraser" ? 10 : 1}
                  max={tool === "eraser" ? 80 : 32}
                  step={1}
                  value={[tool === "eraser" ? eraserSize : brushSize]}
                  onValueChange={([v]) =>
                    tool === "eraser" ? setEraserSize(v) : setBrushSize(v)
                  }
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground w-5 text-right">
                  {tool === "eraser" ? eraserSize : brushSize}
                </span>
              </div>
            </>
          )}

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              data-ocid="whiteboard.undo.button"
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo
            </motion.button>
            <motion.button
              type="button"
              data-ocid="whiteboard.download.button"
              onClick={downloadCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <Download className="w-3.5 h-3.5" />
              Save
            </motion.button>
            <motion.button
              type="button"
              data-ocid="whiteboard.clear.button"
              onClick={clearCanvas}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 px-6 pb-6">
        <motion.div
          ref={containerRef}
          className="relative w-full h-full rounded-2xl overflow-hidden border border-border/50"
          style={{ minHeight: 400, background: "#0f0f14", cursor: toolCursor }}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          data-ocid="whiteboard.canvas_target"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, oklch(0.5 0 0 / 0.15) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
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
          {tool === "laser" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <motion.div
                className="px-3 py-1.5 rounded-full text-xs text-red-300 font-medium border border-red-500/30"
                style={{ background: "rgba(220,38,38,0.15)" }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Laser mode — blinks 5s then vanishes
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
