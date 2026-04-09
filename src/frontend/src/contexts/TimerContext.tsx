import { useCompleteStudySession } from "@/hooks/useQueries";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { Droplets } from "lucide-react";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

const WATER_INTERVAL_MS = 30 * 60 * 1000;

function playCompletionSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
      gain.gain.linearRampToValueAtTime(
        0.35,
        ctx.currentTime + i * 0.18 + 0.05,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.18 + 0.5,
      );
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.55);
    });
    setTimeout(() => ctx.close(), 2500);
  } catch (_) {}
}

export interface TimerContextValue {
  // --- mode ---
  mode: "timer" | "stopwatch";
  setMode: (m: "timer" | "stopwatch") => void;
  // --- countdown timer ---
  totalSeconds: number;
  remaining: number;
  running: boolean;
  completePulse: boolean;
  customHours: string;
  customMinutes: string;
  customSeconds: string;
  setCustomHours: (v: string) => void;
  setCustomMinutes: (v: string) => void;
  setCustomSeconds: (v: string) => void;
  handleStart: () => void;
  handleReset: () => void;
  handleCustomTime: () => void;
  applyPreset: (min: number) => void;
  // --- stopwatch ---
  swElapsed: number;
  swRunning: boolean;
  swStart: () => void;
  swPauseResume: () => void;
  swReset: () => void;
  swStop: () => void;
  // --- shared ---
  sessions: ReturnType<typeof useSessionHistory>["sessions"];
  clearSessions: () => void;
  /** Force-pauses whichever mode is currently running (used by hardcore mode) */
  forcePause: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  // --- Mode ---
  const [mode, setModeState] = useState<"timer" | "stopwatch">("timer");

  // --- Countdown timer state ---
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completePulse, setCompletePulse] = useState(false);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("25");
  const [customSeconds, setCustomSeconds] = useState("0");

  // --- Stopwatch state ---
  const [swElapsed, setSwElapsed] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const swStartTimeRef = useRef<number | null>(null);
  const swBaseElapsedRef = useRef<number>(0);
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swWaterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { sessions, addSession, clearSessions } = useSessionHistory();
  const { mutate: completeSession } = useCompleteStudySession();

  // Countdown timer refs
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  const totalSecondsRef = useRef(totalSeconds);
  totalSecondsRef.current = totalSeconds;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startRemainingRef = useRef<number>(remaining);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (waterTimerRef.current) clearInterval(waterTimerRef.current);
    intervalRef.current = null;
    waterTimerRef.current = null;
  }, []);

  const clearSwTimers = useCallback(() => {
    if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    if (swWaterTimerRef.current) clearInterval(swWaterTimerRef.current);
    swIntervalRef.current = null;
    swWaterTimerRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
    playCompletionSound();
    clearTimers();
    setRunning(false);
    setRemaining(0);
    startTimeRef.current = null;
    const duration = Math.round(totalSecondsRef.current / 60);
    completeSession(BigInt(duration));
    addSession(duration);
    setCompletePulse(true);
    setTimeout(() => setCompletePulse(false), 2000);
    toast.success("Session Complete! 🎉", {
      description: `You focused for ${duration} minutes. Amazing work!`,
      duration: 5000,
    });
  }, [clearTimers, completeSession, addSession]);

  const syncFromWallClock = useCallback(() => {
    if (startTimeRef.current === null) return;
    const elapsedSeconds = Math.floor(
      (Date.now() - startTimeRef.current) / 1000,
    );
    const newRemaining = startRemainingRef.current - elapsedSeconds;
    if (newRemaining <= 0) {
      handleComplete();
    } else {
      setRemaining(newRemaining);
    }
  }, [handleComplete]);

  useEffect(() => {
    if (!running) return;
    startTimeRef.current = Date.now();
    startRemainingRef.current = remainingRef.current;
    intervalRef.current = setInterval(syncFromWallClock, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, syncFromWallClock]);

  useEffect(() => {
    if (!running) {
      startRemainingRef.current = remainingRef.current;
      startTimeRef.current = null;
    }
  }, [running]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && running) syncFromWallClock();
      if (!document.hidden && swRunning) syncStopwatch();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [running, syncFromWallClock, swRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  function startWaterReminder(
    ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  ) {
    ref.current = setInterval(() => {
      toast("💧 Hydration Reminder!", {
        description:
          "You've been studying for 30 minutes. Time to drink some water!",
        duration: 8000,
        icon: <Droplets className="w-4 h-4 text-cyan-400" />,
      });
    }, WATER_INTERVAL_MS);
  }

  // --- Countdown handlers ---
  function handleStart() {
    if (!running) {
      if (remainingRef.current === 0) {
        setRemaining(totalSeconds);
        remainingRef.current = totalSeconds;
      }
      startWaterReminder(waterTimerRef);
    } else {
      if (waterTimerRef.current) clearInterval(waterTimerRef.current);
    }
    setRunning((prev) => !prev);
  }

  function handleReset() {
    clearTimers();
    setRunning(false);
    setRemaining(totalSeconds);
    remainingRef.current = totalSeconds;
    startRemainingRef.current = totalSeconds;
    startTimeRef.current = null;
  }

  function handleCustomTime() {
    const hrs = Math.max(0, Number.parseInt(customHours, 10) || 0);
    const mins = Math.max(0, Number.parseInt(customMinutes, 10) || 0);
    const secs = Math.max(0, Number.parseInt(customSeconds, 10) || 0);
    const total = hrs * 3600 + mins * 60 + secs;
    if (total < 1 || total > 12 * 3600) return;
    setTotalSeconds(total);
    setRemaining(total);
    remainingRef.current = total;
    startRemainingRef.current = total;
    startTimeRef.current = null;
    setRunning(false);
    clearTimers();
  }

  function applyPreset(min: number) {
    setCustomHours("0");
    setCustomMinutes(String(min));
    setCustomSeconds("0");
    const secs = min * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
    remainingRef.current = secs;
    startRemainingRef.current = secs;
    startTimeRef.current = null;
    setRunning(false);
    clearTimers();
  }

  // --- Stopwatch sync ---
  function syncStopwatch() {
    if (swStartTimeRef.current === null) return;
    const elapsed =
      swBaseElapsedRef.current +
      Math.floor((Date.now() - swStartTimeRef.current) / 1000);
    setSwElapsed(elapsed);
  }

  function swStart() {
    swStartTimeRef.current = Date.now();
    swBaseElapsedRef.current = 0;
    setSwElapsed(0);
    setSwRunning(true);
    swIntervalRef.current = setInterval(syncStopwatch, 500);
    startWaterReminder(swWaterTimerRef);
  }

  function swPauseResume() {
    if (swRunning) {
      // pause
      clearSwTimers();
      if (swStartTimeRef.current !== null) {
        swBaseElapsedRef.current += Math.floor(
          (Date.now() - swStartTimeRef.current) / 1000,
        );
      }
      swStartTimeRef.current = null;
      setSwRunning(false);
    } else {
      // resume
      swStartTimeRef.current = Date.now();
      setSwRunning(true);
      swIntervalRef.current = setInterval(syncStopwatch, 500);
      startWaterReminder(swWaterTimerRef);
    }
  }

  function swReset() {
    clearSwTimers();
    setSwRunning(false);
    setSwElapsed(0);
    swStartTimeRef.current = null;
    swBaseElapsedRef.current = 0;
  }

  function swStop() {
    clearSwTimers();
    // compute final elapsed
    let finalElapsed = swBaseElapsedRef.current;
    if (swStartTimeRef.current !== null) {
      finalElapsed += Math.floor((Date.now() - swStartTimeRef.current) / 1000);
    }
    setSwRunning(false);
    swStartTimeRef.current = null;
    swBaseElapsedRef.current = 0;
    const durationMinutes = Math.max(1, Math.round(finalElapsed / 60));
    completeSession(BigInt(durationMinutes));
    addSession(durationMinutes);
    setSwElapsed(0);
    playCompletionSound();
    toast.success("Stopwatch Session Saved! ⏱️", {
      description: `You studied for ${durationMinutes} minute${durationMinutes !== 1 ? "s" : ""}. Keep it up!`,
      duration: 5000,
    });
  }

  // --- Mode switch ---
  function setMode(m: "timer" | "stopwatch") {
    // Stop everything when switching
    clearTimers();
    clearSwTimers();
    setRunning(false);
    setRemaining(totalSeconds);
    remainingRef.current = totalSeconds;
    startRemainingRef.current = totalSeconds;
    startTimeRef.current = null;
    setSwRunning(false);
    setSwElapsed(0);
    swStartTimeRef.current = null;
    swBaseElapsedRef.current = 0;
    setModeState(m);
  }

  /** Force-pause whichever mode is active — used by hardcore mode */
  function forcePause() {
    if (mode === "timer" && running) {
      if (waterTimerRef.current) clearInterval(waterTimerRef.current);
      setRunning(false);
    }
    if (mode === "stopwatch" && swRunning) {
      clearSwTimers();
      if (swStartTimeRef.current !== null) {
        swBaseElapsedRef.current += Math.floor(
          (Date.now() - swStartTimeRef.current) / 1000,
        );
      }
      swStartTimeRef.current = null;
      setSwRunning(false);
    }
  }

  return (
    <TimerContext.Provider
      value={{
        mode,
        setMode,
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
        swElapsed,
        swRunning,
        swStart,
        swPauseResume,
        swReset,
        swStop,
        sessions,
        clearSessions,
        forcePause,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}
