import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export interface Track {
  id: number;
  name: string;
  subtitle: string;
  url: string;
  color: string;
  accentColor: string;
  accentOklch: string;
  emoji: string;
  procedural?: "whitenoise" | "rain" | "nature" | "focus";
}

export const TRACKS: Track[] = [
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
    url: "",
    procedural: "rain",
    color: "from-cyan-900/40 via-blue-900/30 to-transparent",
    accentColor: "oklch(0.7 0.15 210)",
    accentOklch: "0.7 0.15 210",
    emoji: "🌧️",
  },
  {
    id: 3,
    name: "Nature Vibes",
    subtitle: "Relaxing & Fresh",
    url: "",
    procedural: "nature",
    color: "from-emerald-900/40 via-teal-900/30 to-transparent",
    accentColor: "oklch(0.7 0.18 155)",
    accentOklch: "0.7 0.18 155",
    emoji: "🌿",
  },
  {
    id: 4,
    name: "Deep Focus",
    subtitle: "Concentration Mode",
    url: "",
    procedural: "focus",
    color: "from-purple-900/40 via-indigo-900/30 to-transparent",
    accentColor: "oklch(0.62 0.24 270)",
    accentOklch: "0.62 0.24 270",
    emoji: "🧠",
  },
  {
    id: 5,
    name: "White Noise",
    subtitle: "Block Distractions",
    url: "",
    procedural: "whitenoise",
    color: "from-slate-800/40 via-slate-900/30 to-transparent",
    accentColor: "oklch(0.6 0.04 265)",
    accentOklch: "0.6 0.04 265",
    emoji: "🌬️",
  },
];

// --- Procedural Audio Generators ---

function createRainNode(ctx: AudioContext): AudioNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const low = ctx.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = 1200;
  low.Q.value = 0.5;

  const mid = ctx.createBiquadFilter();
  mid.type = "bandpass";
  mid.frequency.value = 600;
  mid.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.value = 0.55;

  source.connect(low);
  low.connect(mid);
  mid.connect(gain);
  source.start();
  return gain;
}

function createNatureNode(ctx: AudioContext): AudioNode {
  const master = ctx.createGain();
  master.gain.value = 0.4;

  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    data[i] = (b0 + b1 + b2 + white * 0.0556) / 4;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 800;
  noiseFilter.Q.value = 0.4;

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.6;

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noiseSource.start();

  function chirp() {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const freq = 1800 + Math.random() * 1400;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freq * 1.15, ctx.currentTime + 0.05);
    osc.frequency.linearRampToValueAtTime(freq * 0.9, ctx.currentTime + 0.12);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(g);
    g.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    const delay = 1500 + Math.random() * 3000;
    setTimeout(chirp, delay);
  }
  setTimeout(chirp, 500);

  return master;
}

function createFocusNode(ctx: AudioContext): AudioNode {
  const master = ctx.createGain();
  master.gain.value = 0.35;

  const freqBase = 200;
  const beat = 40;

  const oscL = ctx.createOscillator();
  const oscR = ctx.createOscillator();
  oscL.type = "sine";
  oscR.type = "sine";
  oscL.frequency.value = freqBase;
  oscR.frequency.value = freqBase + beat;

  const gainL = ctx.createGain();
  const gainR = ctx.createGain();
  gainL.gain.value = 0.3;
  gainR.gain.value = 0.3;

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.12;
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain);
  lfoGain.connect(gainL.gain);
  lfoGain.connect(gainR.gain);
  lfo.start();

  oscL.connect(gainL);
  oscR.connect(gainR);
  gainL.connect(master);
  gainR.connect(master);
  oscL.start();
  oscR.start();

  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = "sine";
  drone.frequency.value = 80;
  droneGain.gain.value = 0.18;
  drone.connect(droneGain);
  droneGain.connect(master);
  drone.start();

  return master;
}

function createWhiteNoiseNode(ctx: AudioContext): AudioNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = 0.45;

  source.connect(gain);
  source.start();
  return gain;
}

function startProceduralAudio(
  type: Track["procedural"],
  vol: number,
): { ctx: AudioContext; stop: () => void } {
  const ctx = new AudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.value = vol / 100;
  masterGain.connect(ctx.destination);

  let node: AudioNode;
  if (type === "rain") node = createRainNode(ctx);
  else if (type === "nature") node = createNatureNode(ctx);
  else if (type === "focus") node = createFocusNode(ctx);
  else node = createWhiteNoiseNode(ctx);

  node.connect(masterGain);

  return { ctx, stop: () => ctx.close() };
}

export interface MusicContextValue {
  currentTrack: Track;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isLooping: boolean;
  setVolume: (v: number) => void;
  setIsMuted: (v: boolean | ((prev: boolean) => boolean)) => void;
  setIsLooping: (v: boolean | ((prev: boolean) => boolean)) => void;
  togglePlay: () => void;
  selectTrack: (track: Track) => void;
  skipNext: () => void;
  skipPrev: () => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const proceduralRef = useRef<{ ctx: AudioContext; stop: () => void } | null>(
    null,
  );
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const isLoopingRef = useRef(isLooping);
  const isPlayingRef = useRef(isPlaying);

  volumeRef.current = volume;
  isMutedRef.current = isMuted;
  isLoopingRef.current = isLooping;
  isPlayingRef.current = isPlaying;

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on track change
  useEffect(() => {
    if (currentTrack.procedural) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    if (proceduralRef.current) {
      proceduralRef.current.stop();
      proceduralRef.current = null;
    }
    audio.pause();
    audio.crossOrigin = "anonymous";
    audio.src = currentTrack.url;
    audio.volume = (isMutedRef.current ? 0 : volumeRef.current) / 100;
    audio.loop = isLoopingRef.current;
    audio.load();
    if (isPlayingRef.current) {
      const p = audio.play();
      if (p !== undefined) p.catch(() => setIsPlaying(false));
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
    if (isPlaying) {
      if (currentTrack.procedural) {
        if (proceduralRef.current) {
          proceduralRef.current.stop();
          proceduralRef.current = null;
        }
      } else {
        audioRef.current?.pause();
      }
      setIsPlaying(false);
    } else {
      if (currentTrack.procedural) {
        proceduralRef.current = startProceduralAudio(
          currentTrack.procedural,
          isMuted ? 0 : volume,
        );
        setIsPlaying(true);
      } else {
        if (!audioRef.current) audioRef.current = new Audio();
        if (
          !audioRef.current.src ||
          audioRef.current.src === window.location.href
        ) {
          audioRef.current.crossOrigin = "anonymous";
          audioRef.current.src = currentTrack.url;
          audioRef.current.loop = isLooping;
          audioRef.current.volume = (isMuted ? 0 : volume) / 100;
          audioRef.current.load();
        }
        const p = audioRef.current.play();
        if (p !== undefined) {
          p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          setIsPlaying(true);
        }
      }
    }
  }

  function selectTrack(track: Track) {
    const wasPlaying = isPlayingRef.current;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (proceduralRef.current) {
      proceduralRef.current.stop();
      proceduralRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTrack(track);

    if (wasPlaying) {
      setTimeout(() => {
        if (track.procedural) {
          proceduralRef.current = startProceduralAudio(
            track.procedural,
            isMutedRef.current ? 0 : volumeRef.current,
          );
          setIsPlaying(true);
        } else {
          if (!audioRef.current) audioRef.current = new Audio();
          audioRef.current.crossOrigin = "anonymous";
          audioRef.current.src = track.url;
          audioRef.current.loop = isLoopingRef.current;
          audioRef.current.volume =
            (isMutedRef.current ? 0 : volumeRef.current) / 100;
          audioRef.current.load();
          const p = audioRef.current.play();
          if (p !== undefined) {
            p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          } else {
            setIsPlaying(true);
          }
        }
      }, 80);
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
    <MusicContext.Provider
      value={{
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
