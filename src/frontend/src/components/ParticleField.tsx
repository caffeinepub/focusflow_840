import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type SceneMode =
  | "aurora"
  | "space"
  | "rain"
  | "forest"
  | "study"
  | "galaxy"
  | "mountains"
  | "ocean"
  | "city";

const SCENE_META: Record<
  SceneMode,
  { icon: string; label: string; color: string }
> = {
  aurora: { icon: "🔮", label: "Aurora", color: "oklch(0.68 0.14 285 / 0.8)" },
  space: { icon: "✦", label: "Space", color: "oklch(0.82 0.05 255 / 0.8)" },
  rain: { icon: "🌧", label: "Rain", color: "oklch(0.65 0.12 220 / 0.8)" },
  forest: { icon: "🌿", label: "Forest", color: "oklch(0.72 0.17 162 / 0.8)" },
  study: {
    icon: "📚",
    label: "Study Room",
    color: "oklch(0.78 0.16 75 / 0.8)",
  },
  galaxy: { icon: "🌌", label: "Galaxy", color: "oklch(0.65 0.18 290 / 0.8)" },
  mountains: {
    icon: "⛰️",
    label: "Mountains",
    color: "oklch(0.60 0.08 200 / 0.8)",
  },
  ocean: { icon: "🌊", label: "Ocean", color: "oklch(0.62 0.15 220 / 0.8)" },
  city: {
    icon: "🌃",
    label: "City Night",
    color: "oklch(0.70 0.12 255 / 0.8)",
  },
};

const SCENES: SceneMode[] = [
  "aurora",
  "space",
  "rain",
  "forest",
  "study",
  "galaxy",
  "mountains",
  "ocean",
  "city",
];

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
interface StudyParticle {
  x: number;
  y: number;
  vy: number;
  opacity: number;
  size: number;
  color: string;
}
interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  opacity: number;
  active: boolean;
  timer: number;
}
interface MistParticle {
  x: number;
  y: number;
  vx: number;
  opacity: number;
  size: number;
}
interface OceanWave {
  phase: number;
  speed: number;
  amplitude: number;
  y: number;
  color: string;
}
interface CityLight {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  flickerPhase: number;
  flickerSpeed: number;
  on: boolean;
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
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `oklch(0.92 0.04 240 / ${twinkle})`;
    ctx.fill();
    if (s.r > 1.4) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `oklch(0.85 0.06 240 / ${twinkle * 0.12})`;
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
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
    grad.addColorStop(0, `oklch(0.78 0.22 145 / ${glow * 0.5})`);
    grad.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 6, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fillStyle = `oklch(0.88 0.20 152 / ${glow})`;
    ctx.fill();
  }
}

function drawStudy(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  particles: StudyParticle[],
  t: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Warm lamp glow from bottom right
  const glowX = canvas.width * 0.82;
  const glowY = canvas.height * 0.78;
  const lampGrad = ctx.createRadialGradient(
    glowX,
    glowY,
    0,
    glowX,
    glowY,
    canvas.width * 0.55,
  );
  lampGrad.addColorStop(0, "oklch(0.75 0.14 75 / 0.09)");
  lampGrad.addColorStop(0.5, "oklch(0.70 0.12 65 / 0.04)");
  lampGrad.addColorStop(1, "transparent");
  ctx.fillStyle = lampGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Cool blue ambient on left
  const coolGrad = ctx.createRadialGradient(
    canvas.width * 0.1,
    canvas.height * 0.3,
    0,
    canvas.width * 0.1,
    canvas.height * 0.3,
    canvas.width * 0.4,
  );
  coolGrad.addColorStop(0, "oklch(0.55 0.12 255 / 0.06)");
  coolGrad.addColorStop(1, "transparent");
  ctx.fillStyle = coolGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Floating particles (dust motes)
  for (const p of particles) {
    p.y -= p.vy;
    p.opacity += Math.sin(t * 1.2 + p.size) * 0.003;
    if (p.y < -10) {
      p.y = canvas.height + 10;
      p.x = Math.random() * canvas.width;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = p.color.replace(
      "OPA",
      String(Math.max(0.05, Math.min(0.35, p.opacity))),
    );
    ctx.fill();
  }
}

function drawGalaxy(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  stars: Star[],
  shootingStars: ShootingStar[],
  t: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Milky way band
  const bandGrad = ctx.createLinearGradient(
    canvas.width * 0.2,
    0,
    canvas.width * 0.8,
    canvas.height,
  );
  bandGrad.addColorStop(0, "transparent");
  bandGrad.addColorStop(0.3, "oklch(0.45 0.10 285 / 0.05)");
  bandGrad.addColorStop(0.5, "oklch(0.50 0.12 270 / 0.08)");
  bandGrad.addColorStop(0.7, "oklch(0.45 0.10 285 / 0.05)");
  bandGrad.addColorStop(1, "transparent");
  ctx.fillStyle = bandGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Stars with colors
  for (const s of stars) {
    s.x += s.vx;
    s.y += s.vy;
    if (s.x < 0) s.x += canvas.width;
    else if (s.x > canvas.width) s.x -= canvas.width;
    if (s.y < 0) s.y += canvas.height;
    else if (s.y > canvas.height) s.y -= canvas.height;
    const twinkle =
      0.3 + 0.7 * ((Math.sin(t * s.twinkleSpeed + s.twinklePhase) + 1) / 2);
    const hues = [240, 280, 320, 60, 180];
    const hue = hues[Math.floor(s.twinklePhase * 5) % hues.length];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue}, 60%, ${70 + twinkle * 20}%, ${twinkle})`;
    ctx.fillStyle =
      s.r > 1.2
        ? `oklch(0.88 0.12 ${hue} / ${twinkle})`
        : `oklch(0.82 0.06 240 / ${twinkle})`;
    ctx.fill();
  }
  // Shooting stars
  for (const ss of shootingStars) {
    ss.timer -= 0.016;
    if (ss.timer <= 0 || ss.opacity <= 0) {
      if (Math.random() < 0.008) {
        ss.x = Math.random() * canvas.width;
        ss.y = Math.random() * canvas.height * 0.4;
        ss.vx = -(4 + Math.random() * 5);
        ss.vy = 2 + Math.random() * 3;
        ss.opacity = 0.9;
        ss.timer = 1.5;
        ss.active = true;
      }
      continue;
    }
    ss.x += ss.vx;
    ss.y += ss.vy;
    ss.opacity -= 0.018;
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(ss.x - ss.vx * ss.length, ss.y - ss.vy * ss.length);
    const streakGrad = ctx.createLinearGradient(
      ss.x,
      ss.y,
      ss.x - ss.vx * ss.length,
      ss.y - ss.vy * ss.length,
    );
    streakGrad.addColorStop(0, `oklch(0.95 0.05 240 / ${ss.opacity})`);
    streakGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawMountains(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  mist: MistParticle[],
  t: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  // Atmospheric haze
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, "oklch(0.20 0.06 240 / 0.15)");
  skyGrad.addColorStop(0.6, "oklch(0.18 0.05 220 / 0.08)");
  skyGrad.addColorStop(1, "oklch(0.22 0.08 200 / 0.12)");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);
  // Stars in sky
  for (let i = 0; i < 60; i++) {
    const sx = (Math.sin(i * 7.3) * 0.5 + 0.5) * w;
    const sy = (Math.sin(i * 3.7) * 0.5 + 0.5) * h * 0.45;
    const twinkle = 0.2 + 0.4 * ((Math.sin(t * (0.5 + i * 0.1) + i) + 1) / 2);
    ctx.beginPath();
    ctx.arc(sx, sy, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = `oklch(0.90 0.04 240 / ${twinkle})`;
    ctx.fill();
  }
  // Moon glow
  const moonX = w * 0.75;
  const moonY = h * 0.15;
  const moonGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 80);
  moonGrad.addColorStop(0, "oklch(0.88 0.06 60 / 0.12)");
  moonGrad.addColorStop(1, "transparent");
  ctx.fillStyle = moonGrad;
  ctx.fillRect(0, 0, w, h);
  // Layer 4 - farthest mountains (muted blue)
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  const mtnPts4 = [
    0.05, 0.55, 0.12, 0.42, 0.2, 0.5, 0.28, 0.38, 0.38, 0.52, 0.48, 0.4, 0.56,
    0.54, 0.65, 0.38, 0.75, 0.5, 0.84, 0.42, 0.92, 0.56, 1.0, 0.48,
  ];
  for (let i = 0; i < mtnPts4.length; i += 2)
    ctx.lineTo(mtnPts4[i] * w, mtnPts4[i + 1] * h);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = "oklch(0.28 0.06 240 / 0.55)";
  ctx.fill();
  // Layer 3
  ctx.beginPath();
  ctx.moveTo(0, h * 0.8);
  const mtnPts3 = [
    0.08, 0.6, 0.18, 0.48, 0.3, 0.62, 0.42, 0.46, 0.54, 0.6, 0.66, 0.44, 0.78,
    0.58, 0.88, 0.5, 1.0, 0.62,
  ];
  for (let i = 0; i < mtnPts3.length; i += 2)
    ctx.lineTo(mtnPts3[i] * w, mtnPts3[i + 1] * h);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = "oklch(0.22 0.07 230 / 0.65)";
  ctx.fill();
  // Layer 2
  ctx.beginPath();
  ctx.moveTo(0, h);
  const mtnPts2 = [
    0.0, 0.72, 0.1, 0.58, 0.22, 0.68, 0.35, 0.54, 0.48, 0.66, 0.6, 0.52, 0.72,
    0.64, 0.84, 0.55, 0.95, 0.68, 1.0, 0.6,
  ];
  for (let i = 0; i < mtnPts2.length; i += 2)
    ctx.lineTo(mtnPts2[i] * w, mtnPts2[i + 1] * h);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = "oklch(0.18 0.06 220 / 0.70)";
  ctx.fill();
  // Snow caps on layer 2
  const snowPeaks = [
    [0.1, 0.58],
    [0.35, 0.54],
    [0.6, 0.52],
    [0.84, 0.55],
  ];
  for (const [px, py] of snowPeaks) {
    ctx.beginPath();
    ctx.moveTo(px * w, py * h);
    ctx.lineTo((px - 0.04) * w, (py + 0.06) * h);
    ctx.lineTo((px + 0.04) * w, (py + 0.06) * h);
    ctx.closePath();
    ctx.fillStyle = "oklch(0.92 0.02 220 / 0.35)";
    ctx.fill();
  }
  // Layer 1 - nearest, darkest
  ctx.beginPath();
  ctx.moveTo(0, h);
  const mtnPts1 = [
    0.0, 0.8, 0.15, 0.7, 0.3, 0.78, 0.45, 0.68, 0.6, 0.76, 0.75, 0.65, 0.88,
    0.74, 1.0, 0.68,
  ];
  for (let i = 0; i < mtnPts1.length; i += 2)
    ctx.lineTo(mtnPts1[i] * w, mtnPts1[i + 1] * h);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = "oklch(0.12 0.04 210 / 0.80)";
  ctx.fill();
  // Mist particles
  for (const m of mist) {
    m.x += m.vx;
    if (m.x > canvas.width + m.size) m.x = -m.size;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fillStyle = `oklch(0.75 0.04 220 / ${m.opacity * (0.7 + 0.3 * Math.sin(t * 0.3 + m.x * 0.01))})`;
    ctx.fill();
  }
}

function drawOcean(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  waves: OceanWave[],
  t: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  // Sky atmosphere
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  skyGrad.addColorStop(0, "oklch(0.18 0.06 240 / 0.12)");
  skyGrad.addColorStop(1, "oklch(0.22 0.10 220 / 0.06)");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);
  // Moon reflection
  const reflGrad = ctx.createLinearGradient(w * 0.4, 0, w * 0.6, h);
  reflGrad.addColorStop(0, "oklch(0.75 0.06 220 / 0.04)");
  reflGrad.addColorStop(0.5, "oklch(0.70 0.08 220 / 0.08)");
  reflGrad.addColorStop(1, "transparent");
  ctx.fillStyle = reflGrad;
  ctx.fillRect(0, 0, w, h);
  // Waves from far to near
  for (let i = waves.length - 1; i >= 0; i--) {
    const wave = waves[i];
    wave.phase += wave.speed;
    ctx.beginPath();
    ctx.moveTo(0, wave.y);
    for (let x = 0; x <= w; x += 4) {
      const y =
        wave.y +
        Math.sin((x / w) * Math.PI * 5 + wave.phase + t * 0.5) *
          wave.amplitude +
        Math.sin((x / w) * Math.PI * 3 + wave.phase * 0.7) *
          wave.amplitude *
          0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = wave.color;
    ctx.fill();
    // Wave crest shimmer
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const y =
        wave.y +
        Math.sin((x / w) * Math.PI * 5 + wave.phase + t * 0.5) *
          wave.amplitude +
        Math.sin((x / w) * Math.PI * 3 + wave.phase * 0.7) *
          wave.amplitude *
          0.4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "oklch(0.80 0.08 210 / 0.12)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function drawCity(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  lights: CityLight[],
  t: number,
) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = canvas.width;
  const h = canvas.height;
  // Hazy night sky glow (city light pollution)
  const hazeGrad = ctx.createRadialGradient(w * 0.5, h, 0, w * 0.5, h, w * 0.8);
  hazeGrad.addColorStop(0, "oklch(0.35 0.12 280 / 0.14)");
  hazeGrad.addColorStop(0.5, "oklch(0.28 0.10 255 / 0.08)");
  hazeGrad.addColorStop(1, "transparent");
  ctx.fillStyle = hazeGrad;
  ctx.fillRect(0, 0, w, h);
  // Far buildings silhouette
  const farBldgs = [
    [0, 0.62, 0.08, 0.38],
    [0.06, 0.55, 0.07, 0.45],
    [0.11, 0.65, 0.09, 0.35],
    [0.18, 0.5, 0.06, 0.5],
    [0.22, 0.6, 0.08, 0.4],
    [0.28, 0.48, 0.1, 0.52],
    [0.36, 0.58, 0.07, 0.42],
    [0.41, 0.45, 0.09, 0.55],
    [0.48, 0.55, 0.08, 0.45],
    [0.54, 0.42, 0.07, 0.58],
    [0.59, 0.52, 0.09, 0.48],
    [0.66, 0.48, 0.08, 0.52],
    [0.72, 0.38, 0.1, 0.62],
    [0.8, 0.55, 0.07, 0.45],
    [0.85, 0.62, 0.08, 0.38],
    [0.91, 0.5, 0.09, 0.5],
  ];
  ctx.fillStyle = "oklch(0.12 0.04 255 / 0.6)";
  for (const [bx, by, bw, bh] of farBldgs) {
    ctx.fillRect(bx * w, by * h, bw * w, bh * h);
  }
  // Near buildings (darker, larger)
  const nearBldgs = [
    [0, 0.72, 0.12, 0.28],
    [0.1, 0.65, 0.1, 0.35],
    [0.18, 0.75, 0.14, 0.25],
    [0.3, 0.6, 0.12, 0.4],
    [0.4, 0.7, 0.16, 0.3],
    [0.54, 0.62, 0.1, 0.38],
    [0.62, 0.72, 0.14, 0.28],
    [0.74, 0.58, 0.12, 0.42],
    [0.84, 0.68, 0.16, 0.32],
  ];
  ctx.fillStyle = "oklch(0.08 0.03 255 / 0.80)";
  for (const [bx, by, bw, bh] of nearBldgs) {
    ctx.fillRect(bx * w, by * h, bw * w, bh * h);
  }
  // Window lights
  for (const l of lights) {
    if (!l.on) continue;
    const flicker =
      0.6 + 0.4 * ((Math.sin(t * l.flickerSpeed + l.flickerPhase) + 1) / 2);
    ctx.fillStyle = l.color.replace("FLK", String(flicker * 0.75));
    ctx.fillRect(l.x, l.y, l.w, l.h);
    // Glow
    const glowGrad = ctx.createRadialGradient(
      l.x + l.w / 2,
      l.y + l.h / 2,
      0,
      l.x + l.w / 2,
      l.y + l.h / 2,
      l.w * 3,
    );
    glowGrad.addColorStop(0, l.color.replace("FLK", String(flicker * 0.15)));
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(l.x - l.w * 2, l.y - l.h * 2, l.w * 5, l.h * 5);
  }
  // Ground reflection
  const refGrad = ctx.createLinearGradient(0, h * 0.88, 0, h);
  refGrad.addColorStop(0, "oklch(0.30 0.10 270 / 0.08)");
  refGrad.addColorStop(1, "oklch(0.20 0.08 255 / 0.15)");
  ctx.fillStyle = refGrad;
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
}

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

    // Aurora
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

    // Space stars
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

    // Rain
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

    // Forest fireflies
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

    // Study dust motes
    const studyParticles: StudyParticle[] = [];
    for (let i = 0; i < 60; i++) {
      studyParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vy: 0.15 + Math.random() * 0.4,
        opacity: 0.05 + Math.random() * 0.2,
        size: 0.8 + Math.random() * 2,
        color:
          Math.random() > 0.5
            ? "oklch(0.78 0.16 75 / OPA)"
            : "oklch(0.70 0.12 285 / OPA)",
      });
    }

    // Galaxy stars (more, colorful)
    const galaxyStars: Star[] = [];
    for (let i = 0; i < 250; i++) {
      galaxyStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
        r: 0.3 + Math.random() * 2.2,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.3 + Math.random() * 2.5,
      });
    }
    const shootingStars: ShootingStar[] = [];
    for (let i = 0; i < 5; i++) {
      shootingStars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.5,
        vx: -(4 + Math.random() * 5),
        vy: 2 + Math.random() * 3,
        length: 6 + Math.random() * 8,
        opacity: 0,
        active: false,
        timer: -Math.random() * 8,
      });
    }

    // Mountain mist
    const mistParticles: MistParticle[] = [];
    for (let i = 0; i < 40; i++) {
      mistParticles.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight * (0.55 + Math.random() * 0.35),
        vx: 0.2 + Math.random() * 0.5,
        opacity: 0.03 + Math.random() * 0.08,
        size: 30 + Math.random() * 80,
      });
    }

    // Ocean waves
    const oceanWaves: OceanWave[] = [
      {
        phase: 0,
        speed: 0.008,
        amplitude: 12,
        y: window.innerHeight * 0.45,
        color: "oklch(0.28 0.10 230 / 0.60)",
      },
      {
        phase: 1,
        speed: 0.011,
        amplitude: 15,
        y: window.innerHeight * 0.55,
        color: "oklch(0.24 0.10 225 / 0.65)",
      },
      {
        phase: 2,
        speed: 0.014,
        amplitude: 18,
        y: window.innerHeight * 0.63,
        color: "oklch(0.20 0.09 220 / 0.70)",
      },
      {
        phase: 3,
        speed: 0.009,
        amplitude: 22,
        y: window.innerHeight * 0.7,
        color: "oklch(0.17 0.08 215 / 0.75)",
      },
      {
        phase: 4,
        speed: 0.018,
        amplitude: 25,
        y: window.innerHeight * 0.78,
        color: "oklch(0.14 0.07 210 / 0.80)",
      },
      {
        phase: 5,
        speed: 0.022,
        amplitude: 28,
        y: window.innerHeight * 0.85,
        color: "oklch(0.11 0.06 205 / 0.85)",
      },
    ];

    // City lights
    const cityLights: CityLight[] = [];
    const lightColors = [
      "oklch(0.85 0.15 75 / FLK)", // warm yellow
      "oklch(0.75 0.12 200 / FLK)", // cool blue-white
      "oklch(0.82 0.14 90 / FLK)", // pale yellow
      "oklch(0.70 0.16 280 / FLK)", // purple-ish
      "oklch(0.78 0.10 160 / FLK)", // green-white
    ];
    for (let i = 0; i < 180; i++) {
      const bx = Math.random() * window.innerWidth;
      const by = window.innerHeight * (0.42 + Math.random() * 0.42);
      cityLights.push({
        x: bx,
        y: by,
        w: 2 + Math.random() * 4,
        h: 2 + Math.random() * 4,
        color: lightColors[Math.floor(Math.random() * lightColors.length)],
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 0.3 + Math.random() * 1.5,
        on: Math.random() > 0.25,
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
      const s = sceneRef.current;
      if (s === "aurora") drawAurora(ctx, canvas, particles);
      else if (s === "space") drawSpace(ctx, canvas, stars, t);
      else if (s === "rain") drawRain(ctx, canvas, drops);
      else if (s === "forest") drawForest(ctx, canvas, fireflies, t);
      else if (s === "study") drawStudy(ctx, canvas, studyParticles, t);
      else if (s === "galaxy")
        drawGalaxy(ctx, canvas, galaxyStars, shootingStars, t);
      else if (s === "mountains") drawMountains(ctx, canvas, mistParticles, t);
      else if (s === "ocean") drawOcean(ctx, canvas, oceanWaves, t);
      else if (s === "city") drawCity(ctx, canvas, cityLights, t);
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
      <canvas
        ref={canvasRef}
        id="particle-canvas"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Scene picker */}
      <div
        className="fixed z-[35] flex flex-col items-center gap-1.5"
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
                  delay: (SCENES.length - 1 - i) * 0.03,
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm border transition-all"
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
                <span title={SCENE_META[s].label}>{SCENE_META[s].icon}</span>
              </motion.button>
            ))}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setPickerOpen((p) => !p)}
          title={`Background: ${SCENE_META[scene].label}`}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm border"
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
          <span>{SCENE_META[scene].icon}</span>
        </motion.button>
      </div>
    </>
  );
}
