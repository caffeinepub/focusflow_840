import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LOFI_IDS, TRACKS, useMusic } from "@/contexts/MusicContext";
import {
  Music2,
  Pause,
  Play,
  Repeat,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const BAR_COUNT = 12;

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isLooping,
    setVolume,
    setIsMuted,
    setIsLooping,
    togglePlay,
    selectTrack,
    skipNext,
    skipPrev,
  } = useMusic();

  // Build track list with injected category label separators
  const trackListItems: Array<
    | { type: "label"; label: string }
    | { type: "track"; track: (typeof TRACKS)[0]; trackIdx: number }
  > = [];
  let lofiLabelAdded = false;
  let ambientLabelAdded = false;
  let trackCounter = 0;

  for (const track of TRACKS) {
    if (LOFI_IDS.has(track.id)) {
      if (!lofiLabelAdded) {
        trackListItems.push({ type: "label", label: "LOFI" });
        lofiLabelAdded = true;
      }
    } else {
      if (!ambientLabelAdded) {
        trackListItems.push({ type: "label", label: "AMBIENT" });
        ambientLabelAdded = true;
      }
    }
    trackCounter++;
    trackListItems.push({ type: "track", track, trackIdx: trackCounter });
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <h1 className="page-heading text-foreground">Music Player</h1>
        <p className="text-muted-foreground mt-1.5 text-sm tracking-wide">
          Ambient soundscapes for deep concentration
        </p>
      </motion.div>

      {/* Now playing — glass-elevated with color wash */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.id}
          className="glass-elevated rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
          }}
          exit={{
            opacity: 0,
            y: -10,
            scale: 0.98,
            transition: { duration: 0.18, ease: [0.55, 0, 1, 0.45] },
          }}
        >
          {/* Color wash header */}
          <div className={`bg-gradient-to-b ${currentTrack.color} p-8 pb-0`} />
          <div className="px-8 pb-8 pt-2 -mt-2">
            {/* Enhanced Visualizer with gradient bars + reflection */}
            <div className="mb-6">
              {/* Main bars */}
              <div className="flex items-end justify-center gap-1.5 h-20">
                {Array.from({ length: BAR_COUNT }, (_, i) => i).map((i) => (
                  <div
                    key={`bar-${i}`}
                    className={`music-bar ${isPlaying ? "music-bar-playing" : ""}`}
                    style={{
                      height: isPlaying ? undefined : 3,
                      background: `linear-gradient(to top, ${currentTrack.accentColor}, oklch(${currentTrack.accentOklch} / 0.2))`,
                      boxShadow: isPlaying
                        ? `0 0 6px ${currentTrack.accentColor}`
                        : "none",
                      opacity: 0.55 + (i / BAR_COUNT) * 0.45,
                    }}
                  />
                ))}
              </div>
              {/* Mirror reflection */}
              <div
                className="flex items-start justify-center gap-1.5 overflow-hidden"
                style={{ height: 24 }}
              >
                {Array.from({ length: BAR_COUNT }, (_, i) => i).map((i) => (
                  <div
                    key={`refl-${i}`}
                    className={`music-bar ${isPlaying ? "music-bar-playing" : ""}`}
                    style={{
                      height: isPlaying ? undefined : 3,
                      transform: "scaleY(-1)",
                      background: `linear-gradient(to top, ${currentTrack.accentColor}, oklch(${currentTrack.accentOklch} / 0.05))`,
                      opacity: 0.12 + (i / BAR_COUNT) * 0.1,
                    }}
                  />
                ))}
              </div>
              {/* Divider line for reflection */}
              <div
                className="mt-0.5 mx-auto"
                style={{
                  height: 1,
                  background: `linear-gradient(to right, transparent, ${currentTrack.accentColor}, transparent)`,
                  opacity: 0.2,
                }}
              />
            </div>

            {/* Track info */}
            <div className="text-center mb-7">
              <motion.div
                className="text-4xl mb-3"
                animate={
                  isPlaying
                    ? { rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                  ease: "easeInOut",
                }}
              >
                {currentTrack.emoji}
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-foreground tracking-tight mb-1">
                {currentTrack.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentTrack.subtitle}
              </p>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-5 mb-7">
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipPrev}
                  className="h-11 w-11 p-0 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
              </motion.div>

              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  onClick={togglePlay}
                  data-ocid="music.play_button"
                  className="h-16 w-16 rounded-full text-primary-foreground transition-all relative overflow-hidden"
                  style={{
                    background: currentTrack.accentColor,
                    boxShadow: isPlaying
                      ? `0 0 28px ${currentTrack.accentColor}, 0 0 56px oklch(${currentTrack.accentOklch} / 0.25)`
                      : `0 0 14px ${currentTrack.accentColor}`,
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Pause className="w-7 h-7" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0.5, opacity: 0, rotate: 10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.5, opacity: 0, rotate: -10 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Play className="w-7 h-7 ml-1" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.88 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipNext}
                  className="h-11 w-11 p-0 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </motion.div>
            </div>

            {/* Volume + loop */}
            <div className="flex items-center gap-4">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted((m) => !m)}
                  className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </motion.div>

              <Slider
                value={[volume]}
                onValueChange={([v]) => setVolume(v)}
                min={0}
                max={100}
                step={1}
                data-ocid="music.volume.input"
                className="flex-1"
              />

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLooping((l) => !l)}
                  className={`h-8 w-8 p-0 rounded-lg flex-shrink-0 transition-all ${
                    isLooping
                      ? "bg-primary/20 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Track list */}
      <motion.div
        className="glass-card rounded-2xl p-4 space-y-1"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.25,
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        }}
      >
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-primary/15 border border-primary/20">
            <Music2 className="w-3 h-3 text-primary" />
          </div>
          <span className="section-label text-muted-foreground">Playlist</span>
        </div>
        {trackListItems.map((item, listIdx) => {
          if (item.type === "label") {
            return (
              <div
                key={`label-${item.label}`}
                className="text-xs text-muted-foreground/60 uppercase tracking-widest px-3 py-1 mt-2"
              >
                {item.label}
              </div>
            );
          }
          const { track, trackIdx } = item;
          return (
            <motion.button
              key={track.id}
              type="button"
              onClick={() => selectTrack(track)}
              data-ocid={`music.track.item.${trackIdx}`}
              className={`shimmer-card w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left ${
                currentTrack.id === track.id
                  ? "bg-white/8 border border-white/10"
                  : "hover:bg-white/4 border border-transparent"
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + listIdx * 0.05, ease: "easeOut" }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.span
                className="text-xl leading-none"
                animate={
                  currentTrack.id === track.id && isPlaying
                    ? { scale: [1, 1.15, 1] }
                    : { scale: 1 }
                }
                transition={{
                  duration: 1.5,
                  repeat:
                    currentTrack.id === track.id && isPlaying
                      ? Number.POSITIVE_INFINITY
                      : 0,
                  ease: "easeInOut",
                }}
              >
                {track.emoji}
              </motion.span>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-semibold truncate transition-colors ${
                    currentTrack.id === track.id
                      ? "text-foreground"
                      : "text-foreground/70"
                  }`}
                >
                  {track.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {track.subtitle}
                </div>
              </div>
              {/* Active indicator */}
              {currentTrack.id === track.id && (
                <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
                  {isPlaying ? (
                    [1, 2, 3].map((b) => (
                      <motion.div
                        key={b}
                        className="w-1 rounded-full"
                        style={{ background: track.accentColor }}
                        animate={{ height: ["4px", "14px", "4px"] }}
                        transition={{
                          duration: 0.7,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: b * 0.15,
                          ease: "easeInOut",
                        }}
                      />
                    ))
                  ) : (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: track.accentColor }}
                    />
                  )}
                </div>
              )}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
