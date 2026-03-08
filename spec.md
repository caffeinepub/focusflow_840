# FocusFlow

## Current State
- StudyTimer component tracks completed sessions count (local state) and calls `completeSession` when a timer finishes.
- Session history is NOT stored anywhere — only a count is displayed with check-circle icons.
- No dedicated "Session History" view or panel exists.
- App.tsx has 6 nav tabs: dashboard, timer, music, tasks, meditation, ai.

## Requested Changes (Diff)

### Add
- `SessionHistory` type: `{ id: string; durationMinutes: number; completedAt: Date; label?: string }`
- Local storage persistence for session history (localStorage key: `focusflow_sessions`)
- Session history list rendered inside the StudyTimer page, below the existing custom duration card, showing each completed session with time, date, and duration.
- When a session completes (`handleComplete`), push a new entry to the history list.
- A "Clear History" button to wipe all stored sessions.
- Empty state when no sessions exist.
- Session count badge on the Trophy icon should reflect total sessions from history (not just current-tab count).

### Modify
- `StudyTimer.tsx`: Read/write session history from localStorage; show history panel below existing UI.
- Completed sessions count shown in Trophy badge and check dots should come from history length.

### Remove
- Nothing removed.

## Implementation Plan
1. Create a `useSessionHistory` hook that reads/writes to localStorage (`focusflow_sessions`).
2. In `StudyTimer.tsx`, replace local `completed` state with history array from the hook.
3. On `handleComplete`, push `{ id: crypto.randomUUID(), durationMinutes, completedAt: new Date() }` to history.
4. Add a "Session History" card below the custom duration card:
   - Header with title + "Clear" button (only shown when sessions exist)
   - Scrollable list (max-height ~280px) of session rows sorted newest-first
   - Each row: formatted time+date, duration badge, subtle divider
   - Empty state when no history
5. Apply smooth enter animations for new history items.
6. Wire deterministic `data-ocid` markers: `session_history.clear_button`, `session_history.item.1`, `session_history.empty_state`.
