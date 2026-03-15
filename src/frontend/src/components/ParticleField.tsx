import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type SceneMode = "aurora" | "space" | "rain" | "forest";

const SCENE_META: Record<
  SceneMode,
  { icon: string; label: string; color: string }
> = {
  aurora: { icon: "🔮", label: "Aurora", color: "oklch(0.68 0.14 285 / 0.8)" },
  space: { icon: "✦", label: "Space", color: "oklch(0.82 0.05 255 / 0.8)" },
  rain: { icon: "🌧", label: "Rain", color: "oklch(0.65 0.12 220 / 0.8)" },
  forest: { icon: "🌿", label: "Forest", color: "oklch(0.72 0.17 162 / 0.8)" },
};

const SCENES: SceneMode[] = ["aurora", "space", "rain", "forest"];

function loadScene(): SceneMode {
  try {
    const v = localStorage.getItem("focusflow_bg_scene");
    if (v && SCENES.includes(v as SceneMode)) return v as SceneMode;
  } catch {}
  return "aurora";
}

function saveScene(s: SceneMode) {
  try {
    localStorage.setItem("focusflow_bg_scene", s);
  } catch {}
}

// ─────────────────────────────────────────────
// SCENE RENDERERS
// ─────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}
interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  twinklePhase: number;
  twinkleSpeed: number;
}
interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}
interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  glowPhase: number;
  glowSpeed: number;
}

function drawAurora(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  particles: Particle[],
) {
  const CONNECTION_DIST = 120;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x += canvas.width;
    else if (p.x > canvas.width) p.x -= canvas.width;
    if (p.y < 0) p.y += canvas.height;
    else if (p.y > canvas.height) p.y -= canvas.height;
  }

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECTION_DIST) {
        const alpha = (1 - dist / CONNECTION_DIST) * 0.18;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `oklch(0.72 0.14 180 / ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
  }
}

function drawSpace(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stars: Star[],
  t: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const s of stars) {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < 0) s.x += canvas.width;
    else if (s.x > canvas.width) s.x -= canvas.width;
    if (s.y < 0) s.y += canvas.height;
    else if (s.y > canvas.height) s.y -= canvas.height;

    const twinkle =
      0.3 + 0.7 * ((Math.sin(t * s.twinkleSpeed + s.twinklePhase) + 1) / 2);
    const alpha = twinkle;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `oklch(0.92 0.04 240 / ${alpha})`;
    ctx.fill();

    // Tiny glow for bigger stars
    if (s.r > 1.4) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `oklch(0.85 0.06 240 / ${alpha * 0.12})`;
      ctx.fill();
    }
  }
}

function drawRain(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  drops: RainDrop[],
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const d of drops) {
    d.x += 1.5;
    d.y += d.speed;
    if (d.y > canvas.height + d.length) {
      d.y = -d.length - Math.random() * canvas.height * 0.5;
      d.x = Math.random() * canvas.width;
    }
    if (d.x > canvas.width + 50) d.x -= canvas.width + 100;

    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - d.length * 0.5, d.y + d.length);
    ctx.strokeStyle = `oklch(0.72 0.10 210 / ${d.opacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawForest(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  flies: Firefly[],
  t: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const f of flies) {
    f.x += f.vx + Math.sin(t * 0.5 + f.glowPhase) * 0.3;
    f.y += f.vy;
    if (f.y < -10) {
      f.y = canvas.height + 10;
      f.x = Math.random() * canvas.width;
    }
    if (f.x < 0) f.x += canvas.width;
    if (f.x > canvas.width) f.x -= canvas.width;

    const glow =
      0.4 + 0.6 * ((Math.sin(t * f.glowSpeed + f.glowPhase) + 1) / 2);

    // Outer glow
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
    grad.addColorStop(0, `oklch(0.78 0.22 145 / ${glow * 0.5})`);
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 6, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Core dot
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = `oklch(0.88 0.20 152 / ${glow})`;
    ctx.fill();
  }
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<SceneMode>(loadScene);
  const [pickerOpen, setPickerOpen] = useState(false);
  const sceneRef = useRef<SceneMode>(scene);
  sceneRef.current = scene;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // ── AURORA ──
    const particles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      const isEmerald = Math.random() > 0.5;
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: 1 + Math.random() * 1.2,
        color: isEmerald
          ? `oklch(0.72 0.17 162 / ${0.25 + Math.random() * 0.35})`
          : `oklch(0.78 0.16 75 / ${0.2 + Math.random() * 0.3})`,
      });
    }

    // ── SPACE ──
    const stars: Star[] = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
        r: 0.5 + Math.random() * 1.8,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 2,
      });
    }

    // ── RAIN ──
    const drops: RainDrop[] = [];
    for (let i = 0; i < 100; i++) {
      drops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        length: 15 + Math.random() * 30,
        speed: 4 + Math.random() * 5,
        opacity: 0.06 + Math.random() * 0.12,
      });
    }

    // ── FOREST ──
    const fireflies: Firefly[] = [];
    for (let i = 0; i < 55; i++) {
      fireflies.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -(0.2 + Math.random() * 0.6),
        r: 1.2 + Math.random() * 2,
        glowPhase: Math.random() * Math.PI * 2,
        glowSpeed: 0.8 + Math.random() * 2,
      });
    }

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!canvas || !ctx) return;
      t += 0.016;
      const currentScene = sceneRef.current;
      if (currentScene === "aurora") drawAurora(ctx, canvas, particles);
      else if (currentScene === "space") drawSpace(ctx, canvas, stars, t);
      else if (currentScene === "rain") drawRain(ctx, canvas, drops);
      else if (currentScene === "forest") drawForest(ctx, canvas, fireflies, t);
      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  function selectScene(s: SceneMode) {
    setScene(s);
    saveScene(s);
    setPickerOpen(false);
  }

  return (
    <>
      <canvas ref={canvasRef} id="particle-canvas" />

      {/* Scene picker */}
      <div
        className="fixed z-[35] flex flex-col items-center gap-2"
        style={{ bottom: 72, right: 18 }}
      >
        <AnimatePresence>
          {pickerOpen &&
            SCENES.map((s, i) => (
              <motion.button
                type="button"
                key={s}
                onClick={() => selectScene(s)}
                title={SCENE_META[s].label}
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 10 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 22,
                  delay: (SCENES.length - 1 - i) * 0.04,
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-base border transition-all"
                style={{
                  background:
                    scene === s
                      ? "oklch(0.72 0.17 162 / 0.25)"
                      : "oklch(0.12 0.018 255 / 0.85)",
                  border:
                    scene === s
                      ? "1px solid oklch(0.72 0.17 162 / 0.55)"
                      : "1px solid oklch(0.30 0.030 255 / 0.40)",
                  backdropFilter: "blur(12px)",
                  boxShadow:
                    scene === s
                      ? "0 0 14px oklch(0.72 0.17 162 / 0.35)"
                      : "none",
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {SCENE_META[s].icon}
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Toggle button */}
        <motion.button
          type="button"
          onClick={() => setPickerOpen((p) => !p)}
          title="Change background"
          className="w-9 h-9 rounded-full flex items-center justify-center text-base border"
          style={{
            background: "oklch(0.12 0.018 255 / 0.85)",
            border: "1px solid oklch(0.30 0.030 255 / 0.45)",
            backdropFilter: "blur(12px)",
            boxShadow: pickerOpen
              ? "0 0 18px oklch(0.72 0.17 162 / 0.35)"
              : "0 2px 8px oklch(0 0 0 / 0.3)",
          }}
          animate={{ rotate: pickerOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.9 }}
        >
          <span style={{ display: "inline-block", fontSize: "1rem" }}>
            {SCENE_META[scene].icon}
          </span>
        </motion.button>
      </div>
    </>
  );
}
