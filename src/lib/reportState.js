const ENDPOINT = 'http://localhost:5174/state';
const DEBOUNCE_MS = 250;
let pendingTimer = null;
let pendingPayload = null;
export function reportState(simId, state) {
    pendingPayload = { currentSim: simId, simState: state };
    if (pendingTimer)
        clearTimeout(pendingTimer);
    pendingTimer = setTimeout(flush, DEBOUNCE_MS);
}
async function flush() {
    if (!pendingPayload)
        return;
    const body = JSON.stringify({ ...pendingPayload, ts: new Date().toISOString() });
    pendingPayload = null;
    pendingTimer = null;
    try {
        await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
    }
    catch {
        // Silent: state-writer offline is non-fatal.
    }
}
/** Test-only: reset module state between tests. */
export function _resetForTests() {
    if (pendingTimer)
        clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingPayload = null;
}
