const listeners = new Set();
const lastSeenByConcept = new Map();
let pollTimer = null;
let intervalMs = 2000;
async function poll() {
    try {
        const res = await fetch('/.sim-state.json', { cache: 'no-store' });
        if (!res.ok)
            return;
        const state = await res.json();
        const grades = state.pendingGrades;
        if (!grades || typeof grades !== 'object')
            return;
        for (const grade of Object.values(grades)) {
            if (!grade || typeof grade !== 'object')
                continue;
            const key = `${grade.concept}|${grade.rating}|${grade.comment}`;
            if (lastSeenByConcept.get(grade.concept) === key)
                continue;
            lastSeenByConcept.set(grade.concept, key);
            listeners.forEach(l => l(grade));
        }
    }
    catch {
        // offline / file missing — fine
    }
}
function start() {
    if (pollTimer)
        return;
    pollTimer = setInterval(poll, intervalMs);
}
export function subscribeToPendingGrade(listener) {
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
export function _stopForTests() {
    if (pollTimer)
        clearInterval(pollTimer);
    pollTimer = null;
    listeners.clear();
    lastSeenByConcept.clear();
}
/** Test-only. */
export function _setIntervalMs(ms) {
    intervalMs = ms;
}
