// src/lib/stateFile.ts
export interface PendingGrade {
  concept: string;
  rating: 1 | 2 | 3 | 4;
  comment: string;
}

type Listener = (grade: PendingGrade) => void;

const listeners = new Set<Listener>();
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastSeenKey: string | null = null;
let intervalMs = 2000;

async function poll(): Promise<void> {
  try {
    const res = await fetch('/.sim-state.json', { cache: 'no-store' });
    if (!res.ok) return;
    const state = await res.json();
    const grade = state.pendingGrade as PendingGrade | undefined;
    if (!grade) return;
    const key = `${grade.concept}|${grade.rating}|${grade.comment}`;
    if (key === lastSeenKey) return;
    lastSeenKey = key;
    listeners.forEach(l => l(grade));
  } catch {
    // offline / file missing — fine
  }
}

function start(): void {
  if (pollTimer) return;
  pollTimer = setInterval(poll, intervalMs);
}

export function subscribeToPendingGrade(listener: Listener): () => void {
  listeners.add(listener);
  start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

/** Test-only. */
export function _stopForTests(): void {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  listeners.clear();
  lastSeenKey = null;
}

/** Test-only. */
export function _setIntervalMs(ms: number): void {
  intervalMs = ms;
}
