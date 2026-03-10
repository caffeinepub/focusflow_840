import { Button } from "@/components/ui/button";
import { useMusic } from "@/contexts/MusicContext";
import { useTimer } from "@/contexts/TimerContext";
import { Pause, Play, SkipForward, Timer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface MiniStatusBarProps {
  onGoToTimer: () => void;
  onGoToMusic: () => void;
}

export function MiniStatusBar({
  onGoToTimer,
  onGoToMusic,
}: MiniStatusBarProps) {
  const { remaining, running, totalSeconds } = useTimer();
  const { currentTrack, isPlaying, togglePlay, skipNext } = useMusic();

  const showTimer = running || (remaining > 0 && remaining < totalSeconds);
  const showMusic = isPlaying;
  const show = showTimer || showMusic;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const pct =
    totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="mini-bar"
          data-ocid="mini_status_bar.panel"
          className="fixed bottom-0 left-0 right-0 z-50 lg:left-0"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Progress bar at very top of bar */}
          {showTimer && (
            <div
              className="h-0.5 w-full"
              style={{ background: "oklch(0.15 0.03 265)" }}
            >
              <motion.div
                className="h-full"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.62 0.24 270), oklch(0.7 0.15 210))",
                  boxShadow: "0 0 8px oklch(0.62 0.24 270 / 0.6)",
                }}
                animate={{ width: `${100 - pct}%` }}
                transition={{ duration: 0.5, ease: "linear" }}
              />
            </div>
          )}

          <div
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              background: "oklch(0.11 0.025 265 / 0.97)",
              backdropFilter: "blur(20px)",
              borderTop: "1px solid oklch(0.25 0.04 265 / 0.6)",
            }}
          >
            {/* Timer pill */}
            {showTimer && (
              <motion.button
                type="button"
                onClick={onGoToTimer}
                data-ocid="mini_status_bar.timer_button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors hover:bg-white/8 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Timer
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "oklch(0.62 0.24 270)" }}
                />
                <span
                  className="font-display font-bold tabular-nums text-sm tracking-wider"
                  style={{
                    color: running
                      ? "oklch(0.92 0.015 260)"
                      : "oklch(0.6 0.05 265)",
                    filter: running
                      ? "drop-shadow(0 0 6px oklch(0.62 0.24 270 / 0.5))"
                      : "none",
                  }}
                >
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </span>
                <span
                  className="text-[10px] tracking-widest uppercase font-medium"
                  style={{
                    color: running
                      ? "oklch(0.62 0.24 270)"
                      : "oklch(0.45 0.04 265)",
                  }}
                >
                  {running ? "Focusing" : "Paused"}
                </span>
              </motion.button>
            )}

            {/* Divider */}
            {showTimer && showMusic && (
              <div
                className="w-px h-6 flex-shrink-0"
                style={{ background: "oklch(0.25 0.04 265 / 0.5)" }}
              />
            )}

            {/* Music pill */}
            {showMusic && (
              <motion.div
                className="flex items-center gap-2 flex-1 min-w-0"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Animated mini bars */}
                <button
                  type="button"
                  onClick={onGoToMusic}
                  data-ocid="mini_status_bar.music_button"
                  className="flex items-center gap-2 min-w-0 flex-1 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
                >
                  <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
                    {[1, 2, 3].map((b) => (
                      <motion.div
                        key={b}
                        className="w-1 rounded-full"
                        style={{ background: currentTrack.accentColor }}
                        animate={{ height: ["4px", "14px", "4px"] }}
                        transition={{
                          duration: 0.7,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: b * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-foreground/80 truncate">
                    {currentTrack.emoji} {currentTrack.name}
                  </span>
                </button>

                {/* Mini controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    data-ocid="mini_status_bar.play_pause_button"
                    className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
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
                    className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground"
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
