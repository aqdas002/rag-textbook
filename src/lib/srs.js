import { fsrs, generatorParameters, createEmptyCard } from 'ts-fsrs';
const STORAGE_KEY = 'srs.v1';
const scheduler = fsrs(generatorParameters({ enable_fuzz: true, maximum_interval: 36500 }));
let cache = null;
function load() {
    if (cache)
        return cache;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        cache = { version: 1, cards: {} };
        return cache;
    }
    try {
        cache = JSON.parse(raw);
    }
    catch {
        cache = { version: 1, cards: {} };
    }
    return cache;
}
function persist() {
    if (!cache)
        return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}
export function createCard(concept, prompt) {
    const store = load();
    if (store.cards[concept])
        return; // idempotent — don't reset progress
    const empty = createEmptyCard(new Date());
    store.cards[concept] = {
        concept,
        prompt,
        dueAt: empty.due.toISOString(),
        fsrs: empty,
    };
    persist();
}
export function gradeCard(concept, rating) {
    const store = load();
    const card = store.cards[concept];
    if (!card)
        throw new Error(`No card for concept "${concept}"`);
    const now = new Date();
    const result = scheduler.next(card.fsrs, now, rating);
    card.fsrs = result.card;
    card.dueAt = result.card.due.toISOString();
    persist();
}
export function getDueCards(now = new Date()) {
    const store = load();
    return Object.values(store.cards).filter(c => new Date(c.dueAt) <= now);
}
export function getAllCards() {
    return Object.values(load().cards);
}
/** Test-only: clears in-memory cache and removes localStorage entry. */
export function _clearAll() {
    cache = null;
    localStorage.removeItem(STORAGE_KEY);
}
