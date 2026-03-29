import { Button } from "@/components/ui/button";
import { useMusic } from "@/contexts/MusicContext";
import { useTimer } from "@/contexts/TimerContext";
import { Pause, Play, SkipForward, Timer, TimerOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface MiniStatusBarProps {
  onGoToTimer: () => void;
  onGoToMusic: () => void;
}

export function MiniStatusBar({
  onGoToTimer,
  onGoToMusic,
}: MiniStatusBarProps) {
  const { remaining, running, totalSeconds, mode, swElapsed, swRunning } =
    useTimer();
  const { currentTrack, isPlaying, togglePlay, skipNext } = useMusic();

  const showCountdown =
    mode === "timer" &&
    (running || (remaining > 0 && remaining < totalSeconds));
  const showStopwatch = mode === "stopwatch" && (swRunning || swElapsed > 0);
  const showTimer = showCountdown || showStopwatch;
  const showMusic = isPlaying;
  const show = showTimer || showMusic;

  const cdMinutes = Math.floor(remaining / 60);
  const cdSeconds = remaining % 60;
  const pct =
    totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  const swHours = Math.floor(swElapsed / 3600);
  const swMins = Math.floor((swElapsed % 3600) / 60);
  const swSecs = swElapsed % 60;
  const swDisplay =
    swHours > 0
      ? `${String(swHours).padStart(2, "0")}:${String(swMins).padStart(2, "0")}:${String(swSecs).padStart(2, "0")}`
      : `${String(swMins).padStart(2, "0")}:${String(swSecs).padStart(2, "0")}`;

  const isActive = running || swRunning;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="mini-bar"
          data-ocid="mini_status_bar.panel"
          className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50"
          initial={{ y: 90, opacity: 0, scale: 0.88 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 90, opacity: 0, scale: 0.88 }}
          transition={{
            type: "spring",
            stiffness: 340,
            damping: 28,
            mass: 0.75,
          }}
        >
          {/* Outer glow ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: isActive
                ? "0 0 0 1px oklch(0.72 0.17 162 / 0.18), 0 0 30px oklch(0.72 0.17 162 / 0.22), 0 0 60px oklch(0.72 0.17 162 / 0.10)"
                : isPlaying
                  ? `0 0 0 1px ${currentTrack.accentColor}33, 0 0 30px ${currentTrack.accentColor}22`
                  : "none",
              borderRadius: 9999,
            }}
          />

          <div
            className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full"
            style={{
              background: "oklch(0.10 0.018 252 / 0.94)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              border: "1px solid oklch(0.72 0.17 162 / 0.22)",
              boxShadow:
                "0 12px 48px oklch(0 0 0 / 0.65), 0 0 0 0.5px oklch(1 0 0 / 0.05), inset 0 1.5px 0 oklch(1 0 0 / 0.09), inset 0 -1px 0 oklch(0 0 0 / 0.15)",
            }}
          >
            {/* Shimmer top edge */}
            <div
              className="absolute top-0 left-12 right-12 h-px rounded-full pointer-events-none"
              style={{
                background: isActive
                  ? "linear-gradient(90deg, transparent, oklch(0.80 0.18 162 / 0.7), oklch(0.78 0.16 75 / 0.4), transparent)"
                  : `linear-gradient(90deg, transparent, ${currentTrack.accentColor}aa, transparent)`,
              }}
            />

            {/* Countdown progress bar */}
            {showCountdown && (
              <div
                className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full overflow-hidden pointer-events-none"
                style={{ opacity: 0.45 }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.72 0.17 162), oklch(0.68 0.18 195))",
                    boxShadow: "0 0 8px oklch(0.72 0.17 162)",
                  }}
                  animate={{ width: `${100 - pct}%` }}
                  transition={{ duration: 0.6, ease: "linear" }}
                />
              </div>
            )}

            {/* Timer section */}
            {showTimer && (
              <motion.button
                type="button"
                onClick={onGoToTimer}
                data-ocid="mini_status_bar.timer_button"
                className="flex items-center gap-2 px-2.5 py-1 rounded-full cursor-pointer transition-all duration-200 hover:bg-white/8"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <motion.div
                  animate={isActive ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
                  transition={{
                    duration: 1.6,
                    repeat: isActive ? Number.POSITIVE_INFINITY : 0,
                    ease: "easeInOut",
                  }}
                >
                  {showStopwatch ? (
                    <TimerOff
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "oklch(0.72 0.17 162)" }}
                    />
                  ) : (
                    <Timer
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "oklch(0.72 0.17 162)" }}
                    />
                  )}
                </motion.div>
                <span
                  className="font-mono font-bold tabular-nums text-sm tracking-wider"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                    color: isActive
                      ? "oklch(0.95 0.008 255)"
                      : "oklch(0.50 0.018 255)",
                    filter: isActive
                      ? "drop-shadow(0 0 7px oklch(0.72 0.17 162 / 0.7))"
                      : "none",
                  }}
                >
                  {showStopwatch
                    ? swDisplay
                    : `${String(cdMinutes).padStart(2, "0")}:${String(cdSeconds).padStart(2, "0")}`}
                </span>
                <span
                  className="text-[10px] tracking-widest uppercase font-semibold hidden sm:block"
                  style={{
                    color: isActive
                      ? "oklch(0.72 0.17 162)"
                      : "oklch(0.38 0.018 255)",
                    letterSpacing: "0.10em",
                  }}
                >
                  {showStopwatch
                    ? swRunning
                      ? "Study"
                      : "Paused"
                    : running
                      ? "Focus"
                      : "Paused"}
                </span>
              </motion.button>
            )}

            {/* Divider */}
            {showTimer && showMusic && (
              <div
                className="w-px h-5 flex-shrink-0 mx-1"
                style={{ background: "oklch(0.72 0.17 162 / 0.20)" }}
              />
            )}

            {/* Music section */}
            {showMusic && (
              <motion.div
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <button
                  type="button"
                  onClick={onGoToMusic}
                  data-ocid="mini_status_bar.music_button"
                  className="flex items-center gap-2 hover:bg-white/6 rounded-full px-2.5 py-1 transition-all duration-200"
                >
                  <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
                    {[1, 2, 3].map((b) => (
                      <motion.div
                        key={b}
                        className="w-1 rounded-full"
                        style={{ background: currentTrack.accentColor }}
                        animate={{
                          height: ["3px", "14px", "6px", "14px", "3px"],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: b * 0.18,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-foreground/80 hidden sm:block truncate max-w-[110px]">
                    {currentTrack.emoji} {currentTrack.name}
                  </span>
                </button>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    data-ocid="mini_status_bar.play_pause_button"
                    className="h-7 w-7 p-0 rounded-full hover:bg-white/14 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipNext}
                    data-ocid="mini_status_bar.skip_button"
                    className="h-7 w-7 p-0 rounded-full hover:bg-white/14 text-muted-foreground hover:text-foreground transition-all duration-200"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
