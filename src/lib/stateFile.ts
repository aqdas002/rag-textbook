export interface PendingGrade {
  concept: string;
  rating: 1 | 2 | 3 | 4;
  comment: string;
}

type Listener = (grade: PendingGrade) => void;

const listeners = new Set<Listener>();
const lastSeenByConcept = new Map<string, string>();
let pollTimer: ReturnType<typeof setInterval> | null = null;
let intervalMs = 2000;

async function poll(): Promise<void> {
  try {
    const res = await fetch('/.sim-state.json', { cache: 'no-store' });
    if (!res.ok) return;
    const state = await res.json();
    const grades = state.pendingGrades as Record<string, PendingGrade> | undefined;
    if (!grades || typeof grades !== 'object') return;
    for (const grade of Object.values(grades)) {
      if (!grade || typeof grade !== 'object') continue;
      const key = `${grade.concept}|${grade.rating}|${grade.comment}`;
      if (lastSeenByConcept.get(grade.concept) === key) continue;
      lastSeenByConcept.set(grade.concept, key);
      listeners.forEach(l => l(grade));
    }
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
  lastSeenByConcept.clear();
}

/** Test-only. */
export function _setIntervalMs(ms: number): void {
  intervalMs = ms;
}
