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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          initial={{ y: 80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 320,
            damping: 30,
            mass: 0.8,
          }}
        >
          <div
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{
              background: "oklch(0.11 0.020 255 / 0.92)",
              backdropFilter: "blur(28px) saturate(160%)",
              WebkitBackdropFilter: "blur(28px) saturate(160%)",
              border: "1px solid oklch(0.72 0.17 162 / 0.25)",
              boxShadow:
                "0 8px 40px oklch(0 0 0 / 0.55), 0 0 0 0.5px oklch(1 0 0 / 0.04), inset 0 1px 0 oklch(1 0 0 / 0.07), 0 0 20px oklch(0.72 0.17 162 / 0.12)",
            }}
          >
            {/* Gradient border top edge */}
            <div
              className="absolute top-0 left-8 right-8 h-px rounded-full pointer-events-none"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.72 0.17 162 / 0.5), oklch(0.78 0.16 75 / 0.3), transparent)",
              }}
            />

            {/* Progress arc — thin ring around the pill */}
            {showTimer && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
                style={{ opacity: 0.25 }}
              >
                <motion.div
                  className="absolute bottom-0 left-0 h-0.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, oklch(0.72 0.17 162), oklch(0.78 0.16 75))",
                    boxShadow: "0 0 6px oklch(0.72 0.17 162)",
                  }}
                  animate={{ width: `${100 - pct}%` }}
                  transition={{ duration: 0.5, ease: "linear" }}
                />
              </div>
            )}

            {/* Timer section */}
            {showTimer && (
              <motion.button
                type="button"
                onClick={onGoToTimer}
                data-ocid="mini_status_bar.timer_button"
                className="flex items-center gap-2 px-2 py-1 rounded-full transition-colors hover:bg-white/8 cursor-pointer"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                <Timer
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: "oklch(0.72 0.17 162)" }}
                />
                <span
                  className="font-mono font-bold tabular-nums text-sm tracking-wider"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Geist Mono', monospace",
                    color: running
                      ? "oklch(0.94 0.008 255)"
                      : "oklch(0.55 0.018 255)",
                    filter: running
                      ? "drop-shadow(0 0 6px oklch(0.72 0.17 162 / 0.6))"
                      : "none",
                  }}
                >
                  {String(minutes).padStart(2, "0")}:
                  {String(seconds).padStart(2, "0")}
                </span>
                <span
                  className="text-[10px] tracking-widest uppercase font-medium hidden sm:block"
                  style={{
                    color: running
                      ? "oklch(0.72 0.17 162)"
                      : "oklch(0.42 0.018 255)",
                  }}
                >
                  {running ? "Focus" : "Paused"}
                </span>
              </motion.button>
            )}

            {/* Divider */}
            {showTimer && showMusic && (
              <div
                className="w-px h-5 flex-shrink-0"
                style={{ background: "oklch(0.72 0.17 162 / 0.25)" }}
              />
            )}

            {/* Music section */}
            {showMusic && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button
                  type="button"
                  onClick={onGoToMusic}
                  data-ocid="mini_status_bar.music_button"
                  className="flex items-center gap-2 hover:bg-white/6 rounded-full px-2 py-1 transition-colors"
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
                  <span className="text-xs font-medium text-foreground/75 hidden sm:block truncate max-w-[100px]">
                    {currentTrack.emoji} {currentTrack.name}
                  </span>
                </button>

                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    data-ocid="mini_status_bar.play_pause_button"
                    className="h-7 w-7 p-0 rounded-full hover:bg-white/12 text-muted-foreground hover:text-foreground transition-all"
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
                    className="h-7 w-7 p-0 rounded-full hover:bg-white/12 text-muted-foreground hover:text-foreground transition-all"
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
