import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTimer } from "@/contexts/TimerContext";
import {
  CheckCircle,
  Clock,
  History,
  Pause,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// Animated digit — flips up/down when value changes
function AnimatedDigit({
  value,
  running,
}: { value: string; running?: boolean }) {
  return (
    <span
      className="relative inline-block"
      style={{ minWidth: "0.6em", overflow: "visible" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          className="inline-block"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          style={{
            display: "inline-block",
            ...(running
              ? {
                  background:
                    "linear-gradient(135deg, oklch(0.95 0.01 260), oklch(0.78 0.16 270))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }
              : { color: "oklch(0.92 0.015 260)" }),
          }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Orbiting particle dot
function OrbitParticle({
  duration,
  delay,
  radius,
  size,
  color,
  reverse,
}: {
  duration: number;
  delay: number;
  radius: number;
  size: number;
  color: string;
  reverse?: boolean;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: color,
        top: "50%",
        left: "50%",
        marginTop: -size / 2,
        marginLeft: -size / 2,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
      animate={{
        rotate: reverse ? [0, -360] : [0, 360],
      }}
      transition={{
        duration,
        delay,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
    >
      <motion.div
        style={{
          position: "absolute",
          top: -radius,
          left: "50%",
          marginLeft: -size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 ${size * 3}px ${color}`,
        }}
      />
    </motion.div>
  );
}

export function StudyTimer() {
  const {
    totalSeconds,
    remaining,
    running,
    completePulse,
    customHours,
    customMinutes,
    customSeconds,
    setCustomHours,
    setCustomMinutes,
    setCustomSeconds,
    handleStart,
    handleReset,
    handleCustomTime,
    applyPreset,
    sessions,
    clearSessions,
  } = useTimer();

  const completed = sessions.length;

  const pct =
    totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (pct / 100) * circumference;

  const statusText = running
    ? "Focusing..."
    : remaining === 0
      ? "Complete!"
      : "Ready to focus";

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <h1 className="page-heading text-foreground">Study Timer</h1>
        <p className="text-muted-foreground mt-1.5 text-sm tracking-wide">
          Deep work through the Pomodoro technique
        </p>
      </motion.div>

      {/* Timer — elevated glass depth */}
      <motion.div
        className="glass-elevated rounded-3xl p-8 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        {/* SVG ring + orbiting particles */}
        <div
          className={`relative ${running ? "animate-timer-pulse" : ""}`}
          style={{ width: 300, height: 300 }}
        >
          {/* Halo outer ring — pulses outward when running */}
          {running && (
            <>
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  animation: "halo-pulse 2.2s ease-out infinite",
                  border: "2px solid oklch(0.62 0.24 270 / 0.4)",
                  borderRadius: "50%",
                  top: "50%",
                  left: "50%",
                  width: 300,
                  height: 300,
                  marginTop: -150,
                  marginLeft: -150,
                }}
              />
              <div
                className="absolute pointer-events-none"
                style={{
                  animation: "halo-pulse 2.2s ease-out infinite 1.1s",
                  border: "1.5px solid oklch(0.7 0.15 210 / 0.3)",
                  borderRadius: "50%",
                  top: "50%",
                  left: "50%",
                  width: 300,
                  height: 300,
                  marginTop: -150,
                  marginLeft: -150,
                }}
              />
            </>
          )}

          {/* Orbiting particles */}
          {running && (
            <>
              <OrbitParticle
                duration={6}
                delay={0}
                radius={150}
                size={5}
                color="oklch(0.62 0.24 270)"
              />
              <OrbitParticle
                duration={9}
                delay={-2}
                radius={148}
                size={3.5}
                color="oklch(0.7 0.15 210)"
                reverse
              />
              <OrbitParticle
                duration={7.5}
                delay={-4}
                radius={150}
                size={4}
                color="oklch(0.75 0.2 290)"
              />
            </>
          )}

          <svg
            width="300"
            height="300"
            aria-hidden="true"
            style={{ transform: "rotate(-90deg)" }}
            className="absolute inset-0"
          >
            {/* Track */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke="oklch(0.22 0.03 265)"
              strokeWidth="6"
            />
            {/* Secondary glow ring */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke="oklch(0.62 0.24 270 / 0.08)"
              strokeWidth="16"
            />
            {/* Progress */}
            <circle
              cx="150"
              cy="150"
              r={radius}
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{
                transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)",
                filter: running
                  ? "drop-shadow(0 0 6px oklch(0.62 0.24 270 / 0.7))"
                  : "none",
              }}
            />
            <defs>
              <linearGradient
                id="timerGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="oklch(0.78 0.2 270)" />
                <stop offset="50%" stopColor="oklch(0.62 0.24 270)" />
                <stop offset="100%" stopColor="oklch(0.55 0.26 285)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Inner glass circle */}
          <div
            className="absolute rounded-full flex flex-col items-center justify-center"
            style={{
              inset: 14,
              background: running
                ? "radial-gradient(circle, oklch(0.17 0.04 270 / 0.95) 0%, oklch(0.12 0.03 265 / 0.95) 100%)"
                : "radial-gradient(circle, oklch(0.15 0.03 265 / 0.95) 0%, oklch(0.11 0.025 265 / 0.95) 100%)",
              boxShadow: running
                ? "inset 0 0 60px oklch(0.62 0.24 270 / 0.15), 0 0 0 1px oklch(0.62 0.24 270 / 0.1)"
                : "inset 0 0 30px oklch(0.0 0 0 / 0.3)",
              transition: "background 0.5s ease, box-shadow 0.5s ease",
            }}
          >
            {/* Complete pulse effect */}
            <AnimatePresence>
              {completePulse && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{
                    border: "3px solid oklch(0.72 0.18 145)",
                    boxShadow: "0 0 30px oklch(0.72 0.18 145 / 0.5)",
                  }}
                />
              )}
            </AnimatePresence>

            <div
              className="text-6xl font-display font-bold tabular-nums flex items-center"
              style={{
                filter: running
                  ? "drop-shadow(0 0 12px oklch(0.62 0.24 270 / 0.5))"
                  : "none",
                animation: running
                  ? "number-glow 2.5s ease-in-out infinite"
                  : "none",
              }}
            >
              <AnimatedDigit
                value={String(minutes).padStart(2, "0")[0]}
                running={running}
              />
              <AnimatedDigit
                value={String(minutes).padStart(2, "0")[1]}
                running={running}
              />
              <span
                style={{
                  color: running
                    ? "oklch(0.78 0.16 270)"
                    : "oklch(0.92 0.015 260)",
                }}
              >
                :
              </span>
              <AnimatedDigit
                value={String(seconds).padStart(2, "0")[0]}
                running={running}
              />
              <AnimatedDigit
                value={String(seconds).padStart(2, "0")[1]}
                running={running}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-2 tracking-widest uppercase">
              {statusText}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-5 mt-8">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="lg"
              onClick={handleReset}
              data-ocid="timer.reset_button"
              className="h-12 w-12 p-0 rounded-2xl glass-card hover:bg-white/10 text-muted-foreground hover:text-foreground border-0"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              onClick={handleStart}
              data-ocid={running ? "timer.pause_button" : "timer.start_button"}
              className={`h-16 w-44 rounded-2xl font-bold text-base tracking-wide transition-all duration-200 relative overflow-hidden group ${
                running
                  ? "bg-white/10 hover:bg-white/15 text-foreground border border-white/10"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground glow-primary"
              }`}
            >
              <span className="relative z-10 flex items-center">
                {running ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 ml-0.5" />
                    {remaining === totalSeconds ? "Start" : "Resume"}
                  </>
                )}
              </span>
              {!running && (
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-15deg]" />
              )}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
            <div
              className="h-12 w-12 rounded-2xl glass-card flex items-center justify-center relative cursor-default"
              title={`${completed} session${completed !== 1 ? "s" : ""} completed`}
            >
              <Trophy className="w-4.5 h-4.5 text-primary" />
              {completed > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
                >
                  {completed > 9 ? "9+" : completed}
                </motion.span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Session dots */}
        {completed > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 mt-6"
          >
            {Array.from({ length: Math.min(completed, 8) }, (_, i) => i).map(
              (i) => (
                <motion.div
                  key={`check-${i}`}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 12,
                    delay: i * 0.05,
                  }}
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </motion.div>
              ),
            )}
            {completed > 8 && (
              <span className="text-sm text-muted-foreground">
                +{completed - 8}
              </span>
            )}
            <span className="text-xs text-muted-foreground ml-1 tracking-wide">
              {completed} {completed === 1 ? "session" : "sessions"} today
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Custom duration */}
      <motion.div
        className="glass-card rounded-2xl p-6"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <div className="section-label text-muted-foreground mb-4">
          Custom Duration
        </div>

        {/* H / M / S inputs */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label
              htmlFor="timer-hours"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Hours
            </Label>
            <Input
              id="timer-hours"
              type="number"
              min={0}
              max={11}
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              data-ocid="timer.hours_input"
              className="bg-white/5 border-white/10 text-foreground h-11 text-center focus:border-primary/50 focus:ring-primary/20 transition-colors"
            />
          </div>
          <span className="text-muted-foreground pb-3 font-bold text-lg">
            :
          </span>
          <div className="flex-1">
            <Label
              htmlFor="timer-minutes"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Minutes
            </Label>
            <Input
              id="timer-minutes"
              type="number"
              min={0}
              max={59}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              data-ocid="timer.session_input"
              className="bg-white/5 border-white/10 text-foreground h-11 text-center focus:border-primary/50 focus:ring-primary/20 transition-colors"
            />
          </div>
          <span className="text-muted-foreground pb-3 font-bold text-lg">
            :
          </span>
          <div className="flex-1">
            <Label
              htmlFor="timer-seconds"
              className="text-xs text-muted-foreground mb-2 block"
            >
              Seconds
            </Label>
            <Input
              id="timer-seconds"
              type="number"
              min={0}
              max={59}
              value={customSeconds}
              onChange={(e) => setCustomSeconds(e.target.value)}
              data-ocid="timer.seconds_input"
              className="bg-white/5 border-white/10 text-foreground h-11 text-center focus:border-primary/50 focus:ring-primary/20 transition-colors"
            />
          </div>
          <motion.div whileTap={{ scale: 0.96 }}>
            <Button
              onClick={handleCustomTime}
              data-ocid="timer.set_button"
              variant="outline"
              className="h-11 px-5 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 rounded-xl transition-all"
            >
              Set
            </Button>
          </motion.div>
        </div>

        {/* Preset chips */}
        <div className="flex gap-2 mt-4">
          {[5, 15, 25, 45, 60, 90].map((min) => (
            <motion.div key={min} whileTap={{ scale: 0.9 }} className="flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => applyPreset(min)}
                className={`w-full rounded-xl text-xs h-9 font-medium transition-all ${
                  totalSeconds === min * 60
                    ? "bg-primary/20 text-primary border border-primary/30 glow-primary"
                    : "hover:bg-white/6 text-muted-foreground border border-transparent hover:border-white/8"
                }`}
              >
                {min >= 60 ? `${min / 60}h` : `${min}m`}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Session History */}
      <motion.div
        className="glass-card rounded-2xl p-6"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.4,
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 section-label text-muted-foreground">
            <History className="w-4 h-4" />
            Session History
          </div>
          {sessions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSessions}
              data-ocid="session_history.clear_button"
              className="h-7 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {sessions.length === 0 ? (
            <motion.div
              key="empty"
              data-ocid="session_history.empty_state"
              className="flex flex-col items-center justify-center py-8 gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Clock className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/60 text-center leading-relaxed">
                No sessions yet.
                <br />
                Start your first focus session!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="max-h-72 overflow-y-auto space-y-2 pr-1 session-scroll"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {sessions.map((session, index) => {
                const date = new Date(session.completedAt);
                const dateStr = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const timeStr = date.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
                const ocidIndex = index + 1;

                return (
                  <motion.div
                    key={session.id}
                    data-ocid={`session_history.item.${ocidIndex}`}
                    className="rounded-xl px-4 py-3 bg-white/[0.04] border border-white/[0.06] flex items-center gap-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: [0.22, 1, 0.36, 1],
                      delay: Math.min(index * 0.04, 0.2),
                    }}
                  >
                    {/* Icon */}
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />

                    {/* Date + time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 font-medium truncate">
                        {dateStr}
                        <span className="text-muted-foreground font-normal">
                          {" · "}
                          {timeStr}
                        </span>
                      </p>
                    </div>

                    {/* Duration badge */}
                    <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/20">
                      {session.durationMinutes < 1
                        ? "<1 min"
                        : `${session.durationMinutes} min`}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
