import { useSessionHistory } from "@/hooks/useSessionHistory";
import { Award, Flame, Star, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const FIRST_USE_KEY = "focustree_first_use";
const LAST_SHOWN_KEY = "focustree_weekly_report_last_shown";
const MS_IN_WEEK = 7 * 24 * 60 * 60 * 1000;

function getWeeklyStats(
  sessions: ReturnType<typeof useSessionHistory>["sessions"],
) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - MS_IN_WEEK);
  const weeklySessions = sessions.filter(
    (s) => new Date(s.completedAt) >= weekAgo,
  );
  const totalMinutes = weeklySessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { totalMinutes, hours, minutes, sessionCount: weeklySessions.length };
}

function getAppreciationMessage(totalMinutes: number): string {
  if (totalMinutes >= 600)
    return "You're an absolute study legend! 🏆 Incredible dedication!";
  if (totalMinutes >= 300)
    return "Outstanding work! You're crushing your goals! 🌟";
  if (totalMinutes >= 120)
    return "Great effort this week! You're building real momentum! 💪";
  if (totalMinutes >= 30)
    return "Nice start! Every minute of focus counts! Keep going! ✨";
  return "You opened FocusTree — that's the first step! Let's make next week count! 🚀";
}

function getMotivationalPush(totalMinutes: number): string {
  if (totalMinutes === 0) {
    return "Set a small goal for next week — even 30 minutes a day adds up to 3+ hours! You can do this!";
  }
  const targetMinutes = Math.round(totalMinutes * 1.2);
  const targetHours = Math.floor(targetMinutes / 60);
  const targetMins = targetMinutes % 60;
  const targetStr =
    targetHours > 0
      ? `${targetHours}h ${targetMins > 0 ? `${targetMins}m` : ""}`
      : `${targetMins}m`;
  return `Next week, aim for ${targetStr} of focused study — just 20% more. Compounded effort creates unstoppable progress!`;
}

export function WeeklyReportModal() {
  const { sessions } = useSessionHistory();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Set first use date if not set
    if (!localStorage.getItem(FIRST_USE_KEY)) {
      localStorage.setItem(FIRST_USE_KEY, new Date().toISOString());
    }

    const firstUse = new Date(localStorage.getItem(FIRST_USE_KEY)!);
    const lastShownRaw = localStorage.getItem(LAST_SHOWN_KEY);
    const lastShown = lastShownRaw ? new Date(lastShownRaw) : null;
    const now = new Date();

    const referenceDate = lastShown ?? firstUse;
    const elapsed = now.getTime() - referenceDate.getTime();

    if (elapsed >= MS_IN_WEEK) {
      // Small delay so it doesn't pop up before the app fully loads
      const timer = setTimeout(() => setVisible(true), 1800);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(LAST_SHOWN_KEY, new Date().toISOString());
    setVisible(false);
  }

  const stats = getWeeklyStats(sessions);
  const appreciation = getAppreciationMessage(stats.totalMinutes);
  const motivational = getMotivationalPush(stats.totalMinutes);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            data-ocid="weekly-report.modal"
            className="relative w-full max-w-md overflow-hidden rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.14 0.04 162 / 0.95) 0%, oklch(0.11 0.03 200 / 0.98) 100%)",
              border: "1px solid oklch(0.72 0.17 162 / 0.25)",
              boxShadow:
                "0 0 60px oklch(0.72 0.17 162 / 0.20), 0 25px 50px oklch(0 0 0 / 0.60), inset 0 1px 0 oklch(1 0 0 / 0.06)",
              backdropFilter: "blur(32px)",
            }}
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 26,
              mass: 0.8,
            }}
          >
            {/* Ambient glow top */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.72 0.17 162 / 0.6), transparent)",
              }}
            />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse, oklch(0.72 0.17 162 / 0.12) 0%, transparent 70%)",
                filter: "blur(16px)",
              }}
            />

            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.22 0.10 162), oklch(0.18 0.08 180))",
                      boxShadow: "0 0 20px oklch(0.72 0.17 162 / 0.45)",
                      border: "1px solid oklch(0.72 0.17 162 / 0.30)",
                    }}
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{
                      duration: 1.2,
                      delay: 0.6,
                      ease: "easeInOut",
                    }}
                  >
                    <Award className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2
                      className="text-lg font-bold text-white leading-tight"
                      style={{
                        fontFamily:
                          "'Bricolage Grotesque', 'Sora', system-ui, sans-serif",
                      }}
                    >
                      Weekly Report
                    </h2>
                    <p className="text-xs text-emerald-400/70 tracking-wide mt-0.5">
                      Your 7-day summary
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  data-ocid="weekly-report.close_button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Stats */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Total time */}
                <motion.div
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(0.72 0.17 162 / 0.07)",
                    border: "1px solid oklch(0.72 0.17 162 / 0.15)",
                  }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-white/50 tracking-wide">
                      Total Time
                    </span>
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{
                      fontFamily:
                        "'Bricolage Grotesque', 'Sora', system-ui, sans-serif",
                      background:
                        "linear-gradient(135deg, oklch(0.92 0.12 162), oklch(0.85 0.14 180))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {stats.hours > 0
                      ? `${stats.hours}h ${stats.minutes}m`
                      : `${stats.minutes}m`}
                  </div>
                  <div className="text-xs text-white/35 mt-0.5">
                    {stats.totalMinutes === 0 ? "No sessions yet" : "focused"}
                  </div>
                </motion.div>

                {/* Sessions */}
                <motion.div
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(0.78 0.16 75 / 0.07)",
                    border: "1px solid oklch(0.78 0.16 75 / 0.15)",
                  }}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.22 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-white/50 tracking-wide">
                      Sessions
                    </span>
                  </div>
                  <div
                    className="text-2xl font-bold"
                    style={{
                      fontFamily:
                        "'Bricolage Grotesque', 'Sora', system-ui, sans-serif",
                      background:
                        "linear-gradient(135deg, oklch(0.92 0.14 75), oklch(0.85 0.16 60))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {stats.sessionCount}
                  </div>
                  <div className="text-xs text-white/35 mt-0.5">completed</div>
                </motion.div>
              </div>
            </div>

            {/* Progress bar */}
            {stats.totalMinutes > 0 && (
              <motion.div
                className="px-6 pb-4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">
                    Weekly goal (10h)
                  </span>
                  <span className="text-xs text-emerald-400">
                    {Math.min(
                      100,
                      Math.round((stats.totalMinutes / 600) * 100),
                    )}
                    %
                  </span>
                </div>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: "oklch(1 0 0 / 0.06)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, oklch(0.72 0.17 162), oklch(0.65 0.20 180))",
                      boxShadow: "0 0 8px oklch(0.72 0.17 162 / 0.6)",
                    }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (stats.totalMinutes / 600) * 100)}%`,
                    }}
                    transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}

            {/* Appreciation */}
            <motion.div
              className="mx-6 mb-4 rounded-xl px-4 py-3"
              style={{
                background: "oklch(0.72 0.17 162 / 0.08)",
                border: "1px solid oklch(0.72 0.17 162 / 0.12)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38 }}
            >
              <p className="text-sm text-white/85 leading-relaxed">
                {appreciation}
              </p>
            </motion.div>

            {/* Motivational push */}
            <motion.div
              className="mx-6 mb-5 rounded-xl px-4 py-3"
              style={{
                background: "oklch(0.78 0.16 75 / 0.07)",
                border: "1px solid oklch(0.78 0.16 75 / 0.12)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
            >
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/70 leading-relaxed">
                  {motivational}
                </p>
              </div>
            </motion.div>

            {/* Close button */}
            <div className="px-6 pb-6">
              <motion.button
                type="button"
                data-ocid="weekly-report.primary_button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white tracking-wide relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.55 0.20 162), oklch(0.48 0.22 180))",
                  boxShadow:
                    "0 0 20px oklch(0.72 0.17 162 / 0.35), inset 0 1px 0 oklch(1 0 0 / 0.18)",
                }}
                whileHover={{
                  scale: 1.02,
                  boxShadow:
                    "0 0 30px oklch(0.72 0.17 162 / 0.50), inset 0 1px 0 oklch(1 0 0 / 0.18)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
              >
                Let's crush next week! 🚀
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
