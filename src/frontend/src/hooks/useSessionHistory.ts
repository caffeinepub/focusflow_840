import { useCallback, useEffect, useState } from "react";

export interface LocalSession {
  id: string;
  durationMinutes: number;
  completedAt: string; // ISO string
}

const STORAGE_KEY = "focusflow_sessions";

function loadSessions(): LocalSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: LocalSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {}
}

/** Returns a LOCAL date string YYYY-MM-DD — avoids UTC vs local mismatch */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Adds `days` calendar days to a YYYY-MM-DD string */
function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`); // noon avoids DST edge cases
  d.setDate(d.getDate() + days);
  return toLocalDateKey(d);
}

export function calculateStreak(sessions: LocalSession[]): number {
  if (sessions.length === 0) return 0;

  // Collect unique LOCAL date strings
  const uniqueDays = Array.from(
    new Set(sessions.map((s) => toLocalDateKey(new Date(s.completedAt)))),
  ).sort((a, b) => (a > b ? -1 : 1)); // descending

  const todayKey = toLocalDateKey(new Date());
  const yesterdayKey = addDays(todayKey, -1);

  // Streak only counts if there's activity today or yesterday
  if (uniqueDays[0] !== todayKey && uniqueDays[0] !== yesterdayKey) return 0;

  let streak = 0;
  let expected = uniqueDays[0];

  for (const day of uniqueDays) {
    if (day === expected) {
      streak++;
      expected = addDays(expected, -1);
    } else {
      break;
    }
  }

  return streak;
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<LocalSession[]>(() =>
    loadSessions().sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    ),
  );

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const addSession = useCallback((durationMinutes: number) => {
    const newSession: LocalSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      durationMinutes,
      completedAt: new Date().toISOString(),
    };
    setSessions((prev) =>
      [newSession, ...prev].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      ),
    );
  }, []);

  const clearSessions = useCallback(() => {
    setSessions([]);
  }, []);

  const streak = calculateStreak(sessions);

  const todayKey = toLocalDateKey(new Date());
  const todaySessions = sessions.filter(
    (s) => toLocalDateKey(new Date(s.completedAt)) === todayKey,
  );
  const todayMinutes = todaySessions.reduce(
    (sum, s) => sum + s.durationMinutes,
    0,
  );

  return {
    sessions,
    addSession,
    clearSessions,
    streak,
    todaySessions,
    todayMinutes,
  };
}
