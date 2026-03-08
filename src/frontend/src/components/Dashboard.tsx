import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  Droplets,
  Flame,
  History,
  Quote,
  RefreshCw,
  User,
} from "lucide-react";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCurrentStreak,
  useGetRandomQuote,
  useGetSessionHistory,
} from "../hooks/useQueries";

interface DashboardProps {
  onStartTimer: () => void;
  nextWaterReminder: number | null;
}

// Animated counter component
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

export function Dashboard({ onStartTimer, nextWaterReminder }: DashboardProps) {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: quote, isLoading: quoteLoading } = useGetRandomQuote();
  const { data: streak, isLoading: streakLoading } = useGetCurrentStreak();
  const { data: sessions, isLoading: sessionsLoading } = useGetSessionHistory();

  const principal = identity?.getPrincipal().toString();
  const shortPrincipal = principal
    ? `${principal.slice(0, 8)}...${principal.slice(-6)}`
    : null;

  const quotes = [
    "The secret of getting ahead is getting started.",
    "It always seems impossible until it's done. — Nelson Mandela",
    "Don't watch the clock; do what it does. Keep going. — Sam Levenson",
    "The future belongs to those who believe in the beauty of their dreams. — Eleanor Roosevelt",
    "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
    "Believe you can and you're halfway there. — Theodore Roosevelt",
    "You don't have to be great to start, but you have to start to be great. — Zig Ziglar",
    "Hard work beats talent when talent doesn't work hard. — Tim Notke",
    "The only way to do great work is to love what you do. — Steve Jobs",
    "In the middle of difficulty lies opportunity. — Albert Einstein",
    "Education is the most powerful weapon you can use to change the world. — Nelson Mandela",
    "An investment in knowledge pays the best interest. — Benjamin Franklin",
    "The more that you read, the more things you will know. — Dr. Seuss",
    "Learning never exhausts the mind. — Leonardo da Vinci",
    "Success is the sum of small efforts repeated day in and day out. — Robert Collier",
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

  function formatDate(ns: bigint): string {
    const ms = Number(ns / BigInt(1_000_000));
    return new Date(ms).toLocaleDateString("en-US", {
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

  const recentSessions = sessions?.slice(-5).reverse() ?? [];
  const streakVal = Number(streak?.toString() ?? "0");
  const sessionsVal = sessions?.length ?? 0;

  // Stagger variants for stat cards
  const cardVariants = {
    hidden: { opacity: 0, y: 28, scale: 0.96 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 0.08 + i * 0.09,
        duration: 0.45,
        ease: "easeOut" as const,
      },
    }),
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="page-heading text-foreground leading-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm tracking-wide">
            Good to see you. Let's make today count.
          </p>
        </div>
        {shortPrincipal && (
          <motion.div
            className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0 mt-1"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs text-muted-foreground font-mono">
              {shortPrincipal}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Stat cards — shimmer on hover, animated counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak */}
        <motion.div
          className="glass-stat rounded-2xl p-5 flex items-center gap-4 cursor-default"
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -3,
            transition: {
              type: "spring",
              stiffness: 350,
              damping: 22,
              mass: 0.6,
            },
          }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-orange-500/10 border border-orange-500/25 flex-shrink-0"
            style={{
              boxShadow:
                "0 0 28px oklch(0.75 0.18 45 / 0.25), 0 0 60px oklch(0.75 0.18 45 / 0.08)",
            }}
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Flame className="w-7 h-7 text-orange-400" />
          </motion.div>
          <div>
            <div className="section-label text-muted-foreground mb-1.5">
              Study Streak
            </div>
            {streakLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={streakVal}
                  className="text-4xl font-display font-bold text-gradient-orange tabular-nums"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sessions */}
        <motion.div
          className="glass-stat rounded-2xl p-5 flex items-center gap-4 cursor-default"
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -3,
            transition: {
              type: "spring",
              stiffness: 350,
              damping: 22,
              mass: 0.6,
            },
          }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 border border-primary/25 flex-shrink-0"
            style={{
              boxShadow:
                "0 0 28px oklch(0.62 0.24 270 / 0.25), 0 0 60px oklch(0.62 0.24 270 / 0.08)",
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <BookOpen className="w-7 h-7 text-primary" />
          </motion.div>
          <div>
            <div className="section-label text-muted-foreground mb-1.5">
              Total Sessions
            </div>
            {sessionsLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="flex items-baseline gap-1.5">
                <AnimatedNumber
                  value={sessionsVal}
                  className="text-4xl font-display font-bold text-gradient-primary tabular-nums"
                />
                <span className="text-sm text-muted-foreground">done</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Water reminder */}
        <motion.div
          className="glass-stat rounded-2xl p-5 flex items-center gap-4 cursor-default"
          custom={2}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -3,
            transition: {
              type: "spring",
              stiffness: 350,
              damping: 22,
              mass: 0.6,
            },
          }}
        >
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/25 flex-shrink-0"
            style={{
              boxShadow:
                "0 0 28px oklch(0.7 0.15 210 / 0.25), 0 0 60px oklch(0.7 0.15 210 / 0.08)",
            }}
            whileHover={{ scale: 1.1, rotate: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Droplets className="w-7 h-7 text-cyan-400" />
          </motion.div>
          <div>
            <div className="section-label text-muted-foreground mb-1.5">
              Water Reminder
            </div>
            <div className="text-xl font-display font-bold text-gradient-cyan">
              {formatWaterReminder()}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quote + Quick Start */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Motivational quote */}
        <motion.div
          className="glass-elevated rounded-2xl p-6 relative overflow-hidden"
          initial={{ opacity: 0, x: -24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.28,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          }}
        >
          {/* Subtle decorative bg */}
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.62 0.24 270 / 0.3) 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div className="flex items-center justify-between mb-4 relative">
            <div className="flex items-center gap-2.5">
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20"
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
                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
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
            <motion.p
              key={quote}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-foreground/90 text-base leading-relaxed relative"
              style={{ fontStyle: "italic" }}
            >
              "{quote ?? "The secret of getting ahead is getting started."}"
            </motion.p>
          )}
        </motion.div>

        {/* Quick start */}
        <motion.div
          className="glass-elevated rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden"
          initial={{ opacity: 0, x: 24, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{
            delay: 0.34,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          }}
        >
          {/* Decorative gradient bg */}
          <div
            className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-15 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, oklch(0.62 0.24 270 / 0.5) 0%, transparent 70%)",
              transform: "translate(20%, 20%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2.5 mb-3">
              <motion.div
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20"
                whileHover={{ rotate: -10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Clock className="w-3.5 h-3.5 text-primary" />
              </motion.div>
              <span className="section-label text-muted-foreground">
                Quick Start
              </span>
            </div>
            <p className="text-foreground/75 text-sm mb-5 leading-relaxed">
              Begin a 25-minute Pomodoro focus session. Enter flow state.
            </p>
          </div>
          <motion.div whileTap={{ scale: 0.97 }} className="relative">
            <Button
              onClick={onStartTimer}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl glow-primary transition-all duration-200 text-sm tracking-wide relative overflow-hidden group"
            >
              <span className="relative z-10">Start Focus Session →</span>
              {/* Shimmer on hover */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-15deg]" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Session history */}
      <motion.div
        className="glass-card rounded-2xl p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.38,
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/20">
            <History className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="section-label text-muted-foreground">
            Recent Sessions
          </span>
        </div>
        {sessionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : recentSessions.length === 0 ? (
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
              className="w-14 h-14 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-4"
            >
              <BookOpen className="w-7 h-7 text-muted-foreground/25" />
            </motion.div>
            <p className="text-muted-foreground text-sm">
              No sessions yet. Start your first study session!
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recentSessions.map((session, idx) => (
              <motion.div
                key={`${session.date.toString()}-${idx}`}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/4 transition-colors group"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                whileHover={{ x: 2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(session.date)}
                  </span>
                </div>
                <span className="text-sm font-semibold font-display text-primary/80 group-hover:text-primary transition-colors">
                  {session.durationMinutes.toString()} min
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
