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

export interface TimerContextValue {
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
  sessions: ReturnType<typeof useSessionHistory>["sessions"];
  clearSessions: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completePulse, setCompletePulse] = useState(false);
  const { sessions, addSession, clearSessions } = useSessionHistory();
  const [customHours, setCustomHours] = useState("0");
  const [customMinutes, setCustomMinutes] = useState("25");
  const [customSeconds, setCustomSeconds] = useState("0");

  // Always-current refs — safe to read inside effects without adding to dep arrays
  const remainingRef = useRef(remaining);
  remainingRef.current = remaining;
  const totalSecondsRef = useRef(totalSeconds);
  totalSecondsRef.current = totalSeconds;

  // Timestamp-based tracking so background-tab throttling has no effect
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null); // wall-clock ms when timer last (re)started
  const startRemainingRef = useRef<number>(remaining); // remaining seconds at that moment

  const { mutate: completeSession } = useCompleteStudySession();

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (waterTimerRef.current) clearInterval(waterTimerRef.current);
    intervalRef.current = null;
    waterTimerRef.current = null;
  }, []);

  const handleComplete = useCallback(() => {
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

  // Recompute remaining from wall clock — used both in interval and visibility handler
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

    // Snapshot baseline from the always-current ref — no stale closure issue
    startTimeRef.current = Date.now();
    startRemainingRef.current = remainingRef.current;

    // Poll every 500 ms; actual elapsed time comes from the wall clock
    intervalRef.current = setInterval(syncFromWallClock, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, syncFromWallClock]);

  // When paused/reset, keep startRemainingRef in sync so next resume is correct
  useEffect(() => {
    if (!running) {
      startRemainingRef.current = remainingRef.current;
      startTimeRef.current = null;
    }
  }, [running]);

  // Immediately recalculate when the tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && running) {
        syncFromWallClock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [running, syncFromWallClock]);

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

  function handleStart() {
    if (!running) {
      if (remainingRef.current === 0) {
        setRemaining(totalSeconds);
        remainingRef.current = totalSeconds;
      }
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

  return (
    <TimerContext.Provider
      value={{
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
        sessions,
        clearSessions,
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
