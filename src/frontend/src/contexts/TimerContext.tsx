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

export type TimerMode = "timer" | "stopwatch";

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
  mode: TimerMode;
  setMode: (m: TimerMode) => void;
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
  swElapsed: number; // seconds elapsed
  swRunning: boolean;
  swHandleStart: () => void;
  swHandleStop: () => void;
  swHandleReset: () => void;
  // --- shared ---
  sessions: ReturnType<typeof useSessionHistory>["sessions"];
  clearSessions: () => void;
  // --- half-time signal ---
  halfTimeFired: boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<TimerMode>("timer");

  // --- Countdown timer state ---
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completePulse, setCompletePulse] = useState(false);
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("25");
  const [customSeconds, setCustomSeconds] = useState("0");
  const [halfTimeFired, setHalfTimeFired] = useState(false);

  // --- Stopwatch state ---
  const [swElapsed, setSwElapsed] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const swStartTimeRef = useRef<number | null>(null);
  const swBaseElapsedRef = useRef(0); // accumulated seconds before last resume

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
  const halfTimeFiredRef = useRef(false);
  const halfTimeFiredStateTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (waterTimerRef.current) clearInterval(waterTimerRef.current);
    intervalRef.current = null;
    waterTimerRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
    playCompletionSound();
    clearTimers();
    setRunning(false);
    setRemaining(0);
    startTimeRef.current = null;
    halfTimeFiredRef.current = false;
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
      const halfPoint = Math.floor(totalSecondsRef.current / 2);
      if (
        newRemaining <= halfPoint &&
        newRemaining > 0 &&
        !halfTimeFiredRef.current
      ) {
        halfTimeFiredRef.current = true;
        setHalfTimeFired(true);
        if (halfTimeFiredStateTimeoutRef.current)
          clearTimeout(halfTimeFiredStateTimeoutRef.current);
        halfTimeFiredStateTimeoutRef.current = setTimeout(
          () => setHalfTimeFired(false),
          9000,
        );
        toast("⚡ Halfway there!", {
          description:
            "You're doing amazing — push through the second half and finish strong! You've got this! 💪",
          duration: 6000,
        });
      }
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
  }, [running, swRunning, syncFromWallClock]);

  // --- Stopwatch sync ---
  function syncStopwatch() {
    if (swStartTimeRef.current === null) return;
    const elapsed =
      swBaseElapsedRef.current +
      Math.floor((Date.now() - swStartTimeRef.current) / 1000);
    setSwElapsed(elapsed);
  }

  function startWaterReminder() {
    waterTimerRef.current = setInterval(() => {
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
      halfTimeFiredRef.current = false;
      startWaterReminder();
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
    halfTimeFiredRef.current = false;
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
    halfTimeFiredRef.current = false;
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
    halfTimeFiredRef.current = false;
  }

  // --- Stopwatch handlers ---
  function swHandleStart() {
    if (swRunning) return;
    swStartTimeRef.current = Date.now();
    setSwRunning(true);
    startWaterReminder();
    swIntervalRef.current = setInterval(syncStopwatch, 500);
  }

  function swHandleStop() {
    if (!swRunning) return;
    // Accumulate elapsed before stopping
    if (swStartTimeRef.current !== null) {
      swBaseElapsedRef.current += Math.floor(
        (Date.now() - swStartTimeRef.current) / 1000,
      );
    }
    swStartTimeRef.current = null;
    setSwRunning(false);
    if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    if (waterTimerRef.current) clearInterval(waterTimerRef.current);

    const totalElapsed = swBaseElapsedRef.current;
    const durationMinutes = Math.round(totalElapsed / 60);
    if (durationMinutes >= 1) {
      playCompletionSound();
      completeSession(BigInt(durationMinutes));
      addSession(durationMinutes);
      toast.success("Stopwatch Stopped! 🎉", {
        description: `You studied for ${durationMinutes} minute${durationMinutes !== 1 ? "s" : ""}. Keep it up!`,
        duration: 5000,
      });
    }
    // Reset after saving
    swBaseElapsedRef.current = 0;
    setSwElapsed(0);
  }

  function swHandleReset() {
    if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    if (waterTimerRef.current) clearInterval(waterTimerRef.current);
    swStartTimeRef.current = null;
    swBaseElapsedRef.current = 0;
    setSwElapsed(0);
    setSwRunning(false);
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
        swHandleStart,
        swHandleStop,
        swHandleReset,
        sessions,
        clearSessions,
        halfTimeFired,
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
