import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  Droplets,
  History,
  Quote,
  RefreshCw,
  Timer,
  User,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useSpring,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useGetRandomQuote } from "../hooks/useQueries";
import { useSessionHistory } from "../hooks/useSessionHistory";
import { LiveClock } from "./LiveClock";
import { TiltCard } from "./TiltCard";

interface DashboardProps {
  onStartTimer: () => void;
  nextWaterReminder: number | null;
}

function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 80,
    damping: 18,
    restDelta: 0.5,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = String(Math.round(latest));
      }
    });
    return unsubscribe;
  }, [spring]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}

// Circular progress ring for "Studied Today"
function CircularProgress({
  pct,
  size = 56,
  stroke = 3,
  color = "oklch(0.72 0.17 162)",
  trackColor = "oklch(0.72 0.17 162 / 0.12)",
}: {
  pct: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      aria-label="Progress ring"
      role="img"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={trackColor}
        strokeWidth={stroke}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </svg>
  );
}

export function Dashboard({ onStartTimer, nextWaterReminder }: DashboardProps) {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: quote, isLoading: quoteLoading } = useGetRandomQuote();
  const { sessions, streak, todaySessions, todayMinutes } = useSessionHistory();
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 8)}...${principal.slice(-6)}`
    : null;

  const quotes = [
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it's done. \u2014 Nelson Mandela",
    "Don't watch the clock; do what it does. Keep going. \u2014 Sam Levenson",
    "The future belongs to those who believe in the beauty of their dreams. \u2014 Eleanor Roosevelt",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. \u2014 Winston Churchill",
    "Believe you can and you're halfway there. \u2014 Theodore Roosevelt",
    "You don't have to be great to start, but you have to start to be great. \u2014 Zig Ziglar",
    "Hard work beats talent when talent doesn't work hard. \u2014 Tim Notke",
    "The only way to do great work is to love what you do. \u2014 Steve Jobs",
    "In the middle of difficulty lies opportunity. \u2014 Albert Einstein",
    "Education is the most powerful weapon you can use to change the world. \u2014 Nelson Mandela",
    "An investment in knowledge pays the best interest. \u2014 Benjamin Franklin",
    "The more that you read, the more things you will know. \u2014 Dr. Seuss",
    "Learning never exhausts the mind. \u2014 Leonardo da Vinci",
    "Success is the sum of small efforts repeated day in and day out. \u2014 Robert Collier",
    "Push yourself, because no one else is going to do it for you.",
    "Great things never come from comfort zones.",
    "Dream it. Wish it. Do it.",
    "Stay focused and never give up.",
    "Discipline is choosing between what you want now and what you want most.",
  ];

  function refreshQuote() {
    const available = quote ? quotes.filter((q) => q !== quote) : quotes;
    const newQuote = available[Math.floor(Math.random() * available.length)];
    queryClient.setQueryData(["quote"], newQuote);
  }

  const refreshQuoteRef = useRef(refreshQuote);
  refreshQuoteRef.current = refreshQuote;

  useEffect(() => {
    const interval = setInterval(() => {
      refreshQuoteRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatWaterReminder(): string {
    if (!nextWaterReminder) return "Start a session";
    const mins = Math.ceil((nextWaterReminder - Date.now()) / 60000);
    if (mins <= 0) return "Time to hydrate!";
    return `In ${mins} min`;
  }

  function formatStudyTime(minutes: number): string {
    if (minutes === 0) return "0 min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  }

  const recentSessions = sessions.slice(0, 5);
  const streakVal = streak;
  const sessionsVal = todaySessions.length;

  // Daily goal: 2 hours = 120 min
  const dailyGoalMinutes = 120;
  const studyPct = Math.min(100, (todayMinutes / dailyGoalMinutes) * 100);

  // 5-day study history computation
  const fiveDayData = (() => {
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${mo}-${day}`;
      const mins = sessions
        .filter((s) => {
          const sd = new Date(s.completedAt);
          const sk = `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}-${String(sd.getDate()).padStart(2, "0")}`;
          return sk === key;
        })
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      const label =
        i === 0
          ? "Today"
          : i === 1
            ? "Yesterday"
            : d.toLocaleDateString("en-US", { weekday: "short" });
      return { key, label, mins };
    });
  })();
  const maxDayMins = Math.max(...fiveDayData.map((d) => d.mins), 1);

  const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.07 + i * 0.08,
        duration: 0.45,
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
      },
    }),
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
        }}
        className="flex items-start justify-between gap-4 relative"
      >
        {/* Ambient glow behind heading */}
        <div
          className="absolute -left-4 -top-4 w-64 h-24 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, oklch(0.72 0.17 162 / 0.12) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <div className="relative">
          <h1
            className="page-heading text-foreground leading-tight"
            style={{
              fontFamily:
                "'Bricolage Grotesque', 'Sora', system-ui, sans-serif",
            }}
          >
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-sm tracking-wide">
            Good to see you. Let&apos;s make today count.
          </p>
        </div>

        {/* Right side: clock + optional principal */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <LiveClock />
          {shortPrincipal && (
            <motion.div
              className="glass-card rounded-xl px-3 py-1.5 flex items-center gap-2"
              whileHover={{ scale: 1.02, y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <User className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">
                {shortPrincipal}
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <TiltCard maxTilt={7}>
          <motion.div
            className="shimmer-card glass-stat gradient-border noise-overlay rounded-2xl p-5 flex items-center gap-3 cursor-default overflow-hidden"
            custom={0}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
              y: -4,
              transition: { type: "spring", stiffness: 380, damping: 22 },
            }}
          >
            <motion.div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.78 0.16 75 / 0.12)",
                border: "1px solid oklch(0.78 0.16 75 / 0.25)",
                boxShadow: "0 0 24px oklch(0.78 0.16 75 / 0.22)",
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <span className="animate-flame-dance text-2xl select-none">
                🔥
              </span>
            </motion.div>
            <div className="relative z-10">
              <div className="section-label text-muted-foreground mb-1">
                Day Streak
              </div>
              <div className="flex items-baseline gap-1">
                <AnimatedNumber
                  value={streakVal}
                  className="text-3xl font-display font-bold text-gradient-orange tabular-nums"
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
          </motion.div>
        </TiltCard>

        {/* Today's sessions */}
        <TiltCard maxTilt={7}>
          <motion.div
            className="shimmer-card glass-stat gradient-border noise-overlay rounded-2xl p-5 flex items-center gap-3 cursor-default overflow-hidden"
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
              y: -4,
              transition: { type: "spring", stiffness: 380, damping: 22 },
            }}
          >
            <motion.div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.72 0.17 162 / 0.12)",
                border: "1px solid oklch(0.72 0.17 162 / 0.25)",
                boxShadow: "0 0 24px oklch(0.72 0.17 162 / 0.22)",
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <BookOpen className="w-6 h-6 text-primary" />
            </motion.div>
            <div className="relative z-10">
              <div className="section-label text-muted-foreground mb-1">
                Today's Sessions
              </div>
              <div className="flex items-baseline gap-1">
                <AnimatedNumber
                  value={sessionsVal}
                  className="text-3xl font-display font-bold text-gradient-primary tabular-nums"
                />
                <span className="text-xs text-muted-foreground">done</span>
              </div>
            </div>
          </motion.div>
        </TiltCard>

        {/* Studied Today */}
        <TiltCard maxTilt={7}>
          <motion.div
            className="shimmer-card glass-stat gradient-border noise-overlay rounded-2xl p-5 flex items-center gap-3 cursor-pointer overflow-hidden group"
            custom={2}
            onClick={() => setShowHistoryModal(true)}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
              y: -4,
              transition: { type: "spring", stiffness: 380, damping: 22 },
            }}
          >
            <div className="relative flex-shrink-0">
              <CircularProgress
                pct={studyPct}
                size={52}
                stroke={3}
                color="oklch(0.72 0.17 162)"
                trackColor="oklch(0.72 0.17 162 / 0.12)"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Timer
                  className="w-5 h-5"
                  style={{ color: "oklch(0.72 0.17 162)" }}
                />
              </div>
            </div>
            <div className="relative z-10 min-w-0">
              <div className="section-label text-muted-foreground mb-1 flex items-center gap-1.5">
                Studied Today
                <span className="opacity-0 group-hover:opacity-60 transition-opacity text-[9px] text-primary">
                  ▸ history
                </span>
              </div>
              <motion.div
                key={todayMinutes}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-xl font-display font-bold text-gradient-primary"
              >
                {formatStudyTime(todayMinutes)}
              </motion.div>
              <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                Goal: 2h
              </div>
            </div>
          </motion.div>
        </TiltCard>

        {/* Water reminder */}
        <TiltCard maxTilt={7}>
          <motion.div
            className="shimmer-card glass-stat gradient-border noise-overlay rounded-2xl p-5 flex items-center gap-3 cursor-default overflow-hidden"
            custom={3}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
              y: -4,
              transition: { type: "spring", stiffness: 380, damping: 22 },
            }}
          >
            <motion.div
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "oklch(0.70 0.15 210 / 0.12)",
                border: "1px solid oklch(0.70 0.15 210 / 0.25)",
                boxShadow: "0 0 24px oklch(0.70 0.15 210 / 0.22)",
              }}
              animate={{ scale: [1, 1.04, 1] }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1.5,
              }}
            >
              <Droplets
                className="w-6 h-6"
                style={{ color: "oklch(0.80 0.15 205)" }}
              />
            </motion.div>
            <div className="relative z-10">
              <div className="section-label text-muted-foreground mb-1">
                Hydration
              </div>
              <div className="text-lg font-display font-bold text-gradient-cyan">
                {formatWaterReminder()}
              </div>
            </div>
          </motion.div>
        </TiltCard>
      </div>

      {/* Quote + Quick Start */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quote card */}
        <motion.div
          className="glass-elevated gradient-border rounded-2xl p-6 relative overflow-hidden"
          initial={{ opacity: 0, x: -24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
          }}
        >
          {/* Decorative gradient orb */}
          <div
            className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.17 162 / 0.35) 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          {/* Left accent bar */}
          <div
            className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, transparent, oklch(0.72 0.17 162 / 0.6), oklch(0.78 0.16 75 / 0.4), transparent)",
            }}
          />
          <div className="flex items-center justify-between mb-5 relative">
            <div className="flex items-center gap-2.5">
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "oklch(0.72 0.17 162 / 0.15)",
                  border: "1px solid oklch(0.72 0.17 162 / 0.22)",
                }}
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Quote className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="section-label text-muted-foreground">
                Daily Inspiration
              </span>
            </div>
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.35 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshQuote}
                data-ocid="dashboard.refresh_quote.button"
                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/12 text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          </div>
          {quoteLoading ? (
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            // ── Cinematic blur-fade quote reveal ──
            <AnimatePresence mode="wait">
              <motion.p
                key={quote}
                initial={{ opacity: 0, filter: "blur(8px)", scale: 0.97, y: 6 }}
                animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
                exit={{ opacity: 0, filter: "blur(8px)", scale: 0.97, y: -6 }}
                transition={{ duration: 0.52, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-foreground/90 text-base leading-relaxed relative pl-3"
                style={{ fontStyle: "italic" }}
              >
                &ldquo;
                {quote ?? "The secret of getting ahead is getting started."}
                &rdquo;
              </motion.p>
            </AnimatePresence>
          )}
        </motion.div>

        {/* Quick start */}
        <motion.div
          className="glass-elevated gradient-border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
          initial={{ opacity: 0, x: 24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.36,
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
          }}
        >
          <div
            className="absolute bottom-0 right-0 w-44 h-44 rounded-full opacity-15 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.72 0.17 162 / 0.55) 0%, transparent 70%)",
              transform: "translate(20%, 20%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-3">
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "oklch(0.72 0.17 162 / 0.15)",
                  border: "1px solid oklch(0.72 0.17 162 / 0.22)",
                }}
                whileHover={{ rotate: -10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Clock className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="section-label text-muted-foreground">
                Quick Start
              </span>
            </div>
            <p className="text-foreground/70 text-sm mb-5 leading-relaxed">
              Begin a 25-minute Pomodoro focus session. Enter flow state.
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.97 }} className="relative">
            <Button
              onClick={onStartTimer}
              data-ocid="dashboard.start_session.primary_button"
              className="w-full h-12 font-semibold rounded-xl transition-all duration-200 text-sm tracking-wide relative overflow-hidden group active:scale-95"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.17 162), oklch(0.60 0.20 175))",
                color: "oklch(0.07 0.01 162)",
                boxShadow:
                  "0 0 28px oklch(0.72 0.17 162 / 0.35), 0 4px 16px oklch(0.72 0.17 162 / 0.25)",
              }}
            >
              <span className="relative z-10">Start Focus Session →</span>
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-15deg]" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Session history */}
      <motion.div
        className="glass-card gradient-border rounded-2xl p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.42,
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "oklch(0.72 0.17 162 / 0.15)",
              border: "1px solid oklch(0.72 0.17 162 / 0.22)",
            }}
          >
            <History className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="section-label text-muted-foreground">
            Recent Sessions
          </span>
        </div>
        {recentSessions.length === 0 ? (
          <div
            data-ocid="dashboard.sessions.empty_state"
            className="text-center py-10"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 18,
                delay: 0.1,
              }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "oklch(0.72 0.17 162 / 0.06)",
                border: "1px solid oklch(0.72 0.17 162 / 0.10)",
              }}
            >
              <BookOpen className="w-7 h-7 text-muted-foreground/30" />
            </motion.div>
            <p className="text-muted-foreground text-sm">
              No sessions yet. Start your first study session!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentSessions.map((session, idx) => (
              <motion.div
                key={session.id}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/4 transition-colors group"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: idx * 0.06,
                  ease: [0.34, 1.56, 0.64, 1],
                  duration: 0.4,
                }}
                whileHover={{ x: 3 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full transition-colors"
                    style={{
                      background: "oklch(0.72 0.17 162 / 0.65)",
                      boxShadow: "0 0 5px oklch(0.72 0.17 162 / 0.5)",
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(session.completedAt)}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold font-display"
                  style={{
                    color: "oklch(0.72 0.17 162 / 0.85)",
                  }}
                >
                  {session.durationMinutes} min
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 5-day study history modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowHistoryModal(false)}
            data-ocid="dashboard.history.modal"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal card */}
            <motion.div
              className="relative z-10 w-full max-w-sm rounded-2xl p-6 overflow-hidden"
              style={{
                background: "oklch(0.12 0.03 250 / 0.95)",
                border: "1px solid oklch(0.72 0.17 162 / 0.3)",
                boxShadow:
                  "0 0 40px oklch(0.72 0.17 162 / 0.15), 0 20px 60px rgba(0,0,0,0.5)",
              }}
              initial={{ opacity: 0, scale: 0.88, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 16 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow orb */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                style={{
                  background: "oklch(0.72 0.17 162 / 0.12)",
                  filter: "blur(24px)",
                }}
              />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-foreground text-lg">
                    Study History
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Last 5 days
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors text-sm"
                  data-ocid="dashboard.history.close_button"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3.5">
                {fiveDayData.map((day, i) => (
                  <motion.div
                    key={day.key}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.08 + i * 0.06,
                      duration: 0.35,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}
                    className="flex items-center gap-3"
                    data-ocid={`dashboard.history.item.${i + 1}`}
                  >
                    <div className="w-20 flex-shrink-0">
                      <span
                        className={`text-xs font-medium ${i === 0 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {day.label}
                      </span>
                    </div>
                    <div className="flex-1 relative h-5 flex items-center">
                      <div
                        className="absolute inset-0 rounded-full overflow-hidden"
                        style={{ background: "oklch(0.72 0.17 162 / 0.08)" }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background:
                              i === 0
                                ? "linear-gradient(90deg, oklch(0.72 0.17 162), oklch(0.75 0.2 200))"
                                : "linear-gradient(90deg, oklch(0.72 0.17 162 / 0.6), oklch(0.75 0.2 200 / 0.6))",
                            boxShadow:
                              i === 0
                                ? "0 0 10px oklch(0.72 0.17 162 / 0.5)"
                                : "none",
                          }}
                          initial={{ width: "0%" }}
                          animate={{
                            width: `${day.mins === 0 ? 0 : Math.max(4, (day.mins / maxDayMins) * 100)}%`,
                          }}
                          transition={{
                            delay: 0.15 + i * 0.06,
                            duration: 0.6,
                            ease: [0.34, 1.56, 0.64, 1],
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-14 flex-shrink-0 text-right">
                      <span
                        className={`text-xs font-mono ${day.mins > 0 ? "text-foreground" : "text-muted-foreground/40"}`}
                      >
                        {formatStudyTime(day.mins)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-border/30">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5-day total</span>
                  <span className="text-foreground font-semibold font-mono">
                    {formatStudyTime(
                      fiveDayData.reduce((s, d) => s + d.mins, 0),
                    )}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
