const ENDPOINT = 'http://localhost:5174/state';
const DEBOUNCE_MS = 250;

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPayload: { currentSim: string; simState: Record<string, unknown> } | null = null;

export function reportState(simId: string, state: Record<string, unknown>): void {
  pendingPayload = { currentSim: simId, simState: state };
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(flush, DEBOUNCE_MS);
}

async function flush(): Promise<void> {
  if (!pendingPayload) return;
  const body = JSON.stringify({ ...pendingPayload, ts: new Date().toISOString() });
  pendingPayload = null;
  pendingTimer = null;
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch {
    // Silent: state-writer offline is non-fatal.
  }
}

/** Test-only: reset module state between tests. */
export function _resetForTests(): void {
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = null;
  pendingPayload = null;
}
