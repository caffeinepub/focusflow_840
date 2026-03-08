import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Square, Wind } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type Phase = "inhale" | "hold" | "exhale" | "rest";

const PHASE_DURATIONS: Record<Phase, number> = {
  inhale: 4,
  hold: 4,
  exhale: 6,
  rest: 2,
};

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Inhale...",
  hold: "Hold...",
  exhale: "Exhale...",
  rest: "Rest...",
};

const PHASE_ORDER: Phase[] = ["inhale", "hold", "exhale", "rest"];

// Color for each phase
const PHASE_COLORS: Record<
  Phase,
  { circle: string; ring: string; glow: string }
> = {
  inhale: {
    circle: "oklch(0.55 0.22 230 / 0.4)",
    ring: "oklch(0.65 0.18 220)",
    glow: "oklch(0.65 0.18 220 / 0.35)",
  },
  hold: {
    circle: "oklch(0.55 0.2 260 / 0.4)",
    ring: "oklch(0.62 0.24 270)",
    glow: "oklch(0.62 0.24 270 / 0.35)",
  },
  exhale: {
    circle: "oklch(0.48 0.22 300 / 0.4)",
    ring: "oklch(0.58 0.22 290)",
    glow: "oklch(0.58 0.22 290 / 0.35)",
  },
  rest: {
    circle: "oklch(0.4 0.1 280 / 0.3)",
    ring: "oklch(0.5 0.12 270)",
    glow: "oklch(0.5 0.12 270 / 0.25)",
  },
};

export function Meditation() {
  const [duration, setDuration] = useState<number>(10);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("inhale");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [concentricKey, setConcentricKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>("inhale");
  const phaseSecondsRef = useRef<number>(0);
  const totalRef = useRef<number>(0);

  function startSession() {
    phaseRef.current = "inhale";
    phaseSecondsRef.current = 0;
    totalRef.current = duration * 60;
    setPhase("inhale");
    setPhaseProgress(0);
    setTotalRemaining(duration * 60);
    setIsRunning(true);
  }

  function stopSession() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setPhase("inhale");
    setPhaseProgress(0);
  }

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      totalRef.current -= 1;
      setTotalRemaining(totalRef.current);

      if (totalRef.current <= 0) {
        clearInterval(intervalRef.current!);
        setIsRunning(false);
        setPhase("inhale");
        setPhaseProgress(0);
        return;
      }

      phaseSecondsRef.current += 1;
      const currentPhase = phaseRef.current;
      const phaseDuration = PHASE_DURATIONS[currentPhase];
      const progress = phaseSecondsRef.current / phaseDuration;
      setPhaseProgress(Math.min(progress, 1));

      if (phaseSecondsRef.current >= phaseDuration) {
        phaseSecondsRef.current = 0;
        const idx = PHASE_ORDER.indexOf(phaseRef.current);
        const nextPhase = PHASE_ORDER[(idx + 1) % PHASE_ORDER.length];
        phaseRef.current = nextPhase;
        setPhase(nextPhase);
        setPhaseProgress(0);
        // Trigger new concentric rings on phase change
        setConcentricKey((k) => k + 1);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const mins = Math.floor(totalRemaining / 60);
  const secs = totalRemaining % 60;

  const circleScale = (() => {
    if (!isRunning) return 1;
    if (phase === "inhale") return 1 + phaseProgress * 0.55;
    if (phase === "hold") return 1.55;
    if (phase === "exhale") return 1.55 - phaseProgress * 0.55;
    return 1;
  })();

  const ringOpacity = (() => {
    if (!isRunning) return 0.4;
    if (phase === "inhale") return 0.3 + phaseProgress * 0.7;
    if (phase === "hold") return 1;
    if (phase === "exhale") return 1 - phaseProgress * 0.7;
    return 0.3;
  })();

  const phaseColor = PHASE_COLORS[isRunning ? phase : "inhale"];

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <h1 className="page-heading text-foreground">Meditation</h1>
        <p className="text-muted-foreground mt-1.5 text-sm tracking-wide">
          Breathe deeply, calm your mind
        </p>
      </motion.div>

      {/* Breathing animation */}
      <motion.div
        className="relative flex flex-col items-center justify-center py-12 rounded-3xl overflow-hidden"
        style={{
          background: isRunning
            ? "radial-gradient(ellipse at center, oklch(0.2 0.07 240 / 0.85) 0%, oklch(0.12 0.04 265 / 0.97) 100%)"
            : "radial-gradient(ellipse at center, oklch(0.16 0.04 265 / 0.8) 0%, oklch(0.1 0.028 265 / 0.97) 100%)",
          transition: "background 1.2s ease",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Ambient background blob for current phase */}
        {isRunning && (
          <motion.div
            key={phase}
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            style={{
              background: `radial-gradient(ellipse at center, ${phaseColor.circle} 0%, transparent 65%)`,
            }}
          />
        )}

        {/* Background floating particles */}
        {isRunning &&
          Array.from({ length: 6 }, (_, i) => i).map((i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: 4 + i * 2,
                height: 4 + i * 2,
                background: phaseColor.ring,
                left: `${12 + i * 14}%`,
                top: `${20 + (i % 3) * 25}%`,
                opacity: 0.3,
              }}
              animate={{
                y: [0, -18, 0],
                opacity: [0.15, 0.45, 0.15],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3 + i,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Concentric expanding rings on phase change */}
        <AnimatePresence>
          {isRunning &&
            [0, 1, 2].map((ring) => (
              <motion.div
                key={`concentric-${concentricKey}-${ring}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 160,
                  height: 160,
                  border: `1.5px solid ${phaseColor.ring}`,
                  top: "50%",
                  left: "50%",
                  marginTop: -80,
                  marginLeft: -80,
                }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.8 + ring * 0.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.5,
                  delay: ring * 0.35,
                  ease: "easeOut",
                }}
              />
            ))}
        </AnimatePresence>

        {/* Outer rings */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 300, height: 300 }}
        >
          {[3, 2, 1].map((ring) => (
            <motion.div
              key={ring}
              className="absolute rounded-full"
              style={{
                width: 80 + ring * 70,
                height: 80 + ring * 70,
                border: `1px solid ${phaseColor.ring}`,
                opacity: isRunning ? ringOpacity * (ring * 0.22) : 0.08,
                transition: "border-color 1.5s ease",
              }}
              animate={
                isRunning
                  ? {
                      scale: [
                        circleScale * 0.88,
                        circleScale,
                        circleScale * 0.88,
                      ],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          ))}

          {/* Main breathing circle */}
          <motion.div
            className="rounded-full flex items-center justify-center relative"
            style={{
              width: 170,
              height: 170,
              background: `radial-gradient(circle, ${phaseColor.circle} 0%, oklch(0.12 0.05 265 / 0.15) 70%)`,
              border: `2.5px solid ${phaseColor.ring}`,
              boxShadow: `0 0 60px ${phaseColor.glow}, inset 0 0 30px oklch(0.62 0.24 270 / 0.08)`,
              transition:
                "background 1.5s ease, border-color 1.5s ease, box-shadow 1.5s ease",
            }}
            animate={
              isRunning
                ? { scale: circleScale, opacity: Math.max(0.5, ringOpacity) }
                : { scale: 1, opacity: 0.65 }
            }
            transition={{ duration: 0.8, ease: [0.45, 0, 0.55, 1] }}
          >
            <motion.div
              animate={
                isRunning
                  ? { rotate: [0, 180, 360], opacity: [0.7, 1, 0.7] }
                  : {}
              }
              transition={{
                duration: 8,
                repeat: isRunning ? Number.POSITIVE_INFINITY : 0,
                ease: "linear",
              }}
            >
              <Wind
                className="w-10 h-10"
                style={{
                  color: phaseColor.ring,
                  transition: "color 1.5s ease",
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Phase label */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isRunning ? phase : "idle"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="text-center mt-6"
          >
            {isRunning ? (
              <>
                <div
                  className="text-3xl font-display font-bold mb-2 transition-colors duration-1000"
                  style={{ color: phaseColor.ring }}
                >
                  {PHASE_LABELS[phase]}
                </div>
                <div className="text-lg text-muted-foreground">
                  {String(mins).padStart(2, "0")}:
                  {String(secs).padStart(2, "0")} remaining
                </div>
              </>
            ) : (
              <div className="text-xl text-muted-foreground">
                Ready to begin your practice
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="glass-card rounded-2xl p-6 space-y-4"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2 block uppercase tracking-wider">
              Session Duration
            </p>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v))}
              disabled={isRunning}
            >
              <SelectTrigger
                data-ocid="meditation.duration.select"
                className="bg-white/5 border-white/10 text-foreground h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 mt-5">
            {!isRunning ? (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={startSession}
                  data-ocid="meditation.start_button"
                  className="h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl glow-primary font-semibold relative overflow-hidden group"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Begin
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-15deg]" />
                </Button>
              </motion.div>
            ) : (
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={stopSession}
                  variant="outline"
                  data-ocid="meditation.stop_button"
                  className="h-11 px-8 border-destructive/40 text-destructive hover:bg-destructive/10 rounded-xl font-semibold"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Breathing guide */}
        <div className="pt-2 border-t border-white/5">
          <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
            Breathing Pattern
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PHASE_ORDER.map((p) => {
              const isActive = isRunning && phase === p;
              const pColor = PHASE_COLORS[p];
              return (
                <motion.div
                  key={p}
                  className="rounded-xl p-3 text-center transition-all duration-500"
                  animate={isActive ? { scale: 1.03 } : { scale: 1 }}
                  style={{
                    background: isActive
                      ? `${pColor.circle}`
                      : "oklch(1 0 0 / 0.03)",
                    border: isActive
                      ? `1px solid ${pColor.ring}`
                      : "1px solid oklch(1 0 0 / 0.05)",
                    boxShadow: isActive ? `0 0 12px ${pColor.glow}` : "none",
                    transition:
                      "background 0.8s ease, border-color 0.8s ease, box-shadow 0.8s ease",
                  }}
                >
                  <div
                    className="text-xs font-semibold capitalize mb-1 transition-colors duration-500"
                    style={{ color: isActive ? pColor.ring : undefined }}
                  >
                    {p}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {PHASE_DURATIONS[p]}s
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
