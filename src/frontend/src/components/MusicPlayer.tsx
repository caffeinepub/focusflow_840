import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
import { useEffect, useRef, useState } from "react";

interface Track {
  id: number;
  name: string;
  subtitle: string;
  url: string;
  color: string;
  accentColor: string;
  accentOklch: string;
  emoji: string;
}

const TRACKS: Track[] = [
  {
    id: 1,
    name: "Lofi Beats",
    subtitle: "Chill & Creative",
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
    color: "from-violet-900/40 via-indigo-900/30 to-transparent",
    accentColor: "oklch(0.65 0.22 290)",
    accentOklch: "0.65 0.22 290",
    emoji: "🎵",
  },
  {
    id: 2,
    name: "Rain Sounds",
    subtitle: "Nature & Calm",
    url: "https://cdn.pixabay.com/audio/2022/03/10/audio_270f49e2df.mp3",
    color: "from-cyan-900/40 via-blue-900/30 to-transparent",
    accentColor: "oklch(0.7 0.15 210)",
    accentOklch: "0.7 0.15 210",
    emoji: "🌧️",
  },
  {
    id: 3,
    name: "Nature Vibes",
    subtitle: "Relaxing & Fresh",
    url: "https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c12.mp3",
    color: "from-emerald-900/40 via-teal-900/30 to-transparent",
    accentColor: "oklch(0.7 0.18 155)",
    accentOklch: "0.7 0.18 155",
    emoji: "🌿",
  },
  {
    id: 4,
    name: "Deep Focus",
    subtitle: "Concentration Mode",
    url: "https://cdn.pixabay.com/audio/2024/02/28/audio_736439f96a.mp3",
    color: "from-purple-900/40 via-indigo-900/30 to-transparent",
    accentColor: "oklch(0.62 0.24 270)",
    accentOklch: "0.62 0.24 270",
    emoji: "🧠",
  },
  {
    id: 5,
    name: "White Noise",
    subtitle: "Block Distractions",
    url: "https://cdn.pixabay.com/audio/2022/03/24/audio_9b1e1a3b82.mp3",
    color: "from-slate-800/40 via-slate-900/30 to-transparent",
    accentColor: "oklch(0.6 0.04 265)",
    accentOklch: "0.6 0.04 265",
    emoji: "🌬️",
  },
];

const BAR_COUNT = 12;

export function MusicPlayer() {
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const isLoopingRef = useRef(isLooping);
  const isPlayingRef = useRef(isPlaying);

  volumeRef.current = volume;
  isMutedRef.current = isMuted;
  isLoopingRef.current = isLooping;
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";
    audio.src = currentTrack.url;
    audio.volume = (isMutedRef.current ? 0 : volumeRef.current) / 100;
    audio.loop = isLoopingRef.current;
    audio.load();
    if (isPlayingRef.current) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    }
    return () => {
      audio.pause();
    };
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = (isMuted ? 0 : volume) / 100;
  }, [volume, isMuted]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.loop = isLooping;
  }, [isLooping]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(true);
      }
    }
  }

  function selectTrack(track: Track) {
    const wasPlaying = isPlaying;
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setCurrentTrack(track);
    if (wasPlaying) {
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.src = track.url;
          audioRef.current.crossOrigin = "anonymous";
          audioRef.current.load();
          const p = audioRef.current.play();
          if (p !== undefined) {
            p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          } else {
            setIsPlaying(true);
          }
        }
      }, 100);
    }
  }

  function skipNext() {
    const idx = TRACKS.findIndex((t) => t.id === currentTrack.id);
    selectTrack(TRACKS[(idx + 1) % TRACKS.length]);
  }

  function skipPrev() {
    const idx = TRACKS.findIndex((t) => t.id === currentTrack.id);
    selectTrack(TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length]);
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
        {TRACKS.map((track, idx) => (
          <motion.button
            key={track.id}
            type="button"
            onClick={() => selectTrack(track)}
            data-ocid={`music.track.item.${idx + 1}`}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left ${
              currentTrack.id === track.id
                ? "bg-white/8 border border-white/10"
                : "hover:bg-white/4 border border-transparent"
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.07, ease: "easeOut" }}
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
        ))}
      </motion.div>
    </div>
  );
}
