import { useCallback, useEffect, useState } from "react";

export interface Session {
  id: string;
  durationMinutes: number;
  completedAt: string; // ISO string
}

const STORAGE_KEY = "focusflow_sessions";

function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Session[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // silently fail
  }
}

export function useSessionHistory() {
  const [sessions, setSessions] = useState<Session[]>(() =>
    loadSessions().sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    ),
  );

  // Keep localStorage in sync whenever sessions change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const addSession = useCallback((durationMinutes: number) => {
    const newSession: Session = {
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

  return { sessions, addSession, clearSessions };
}
