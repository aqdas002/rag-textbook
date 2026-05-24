import { fsrs, generatorParameters, createEmptyCard, Rating, type Card as FsrsCard } from 'ts-fsrs';

export interface SrsCard {
  concept: string;
  prompt: string;
  dueAt: string;
  fsrs: FsrsCard;
}

interface Store {
  version: 1;
  cards: Record<string, SrsCard>;
}

const STORAGE_KEY = 'srs.v1';
const scheduler = fsrs(generatorParameters({ enable_fuzz: true, maximum_interval: 36500 }));

let cache: Store | null = null;

function load(): Store {
  if (cache) return cache;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    cache = { version: 1, cards: {} };
    return cache;
  }
  try {
    cache = JSON.parse(raw) as Store;
  } catch {
    cache = { version: 1, cards: {} };
  }
  return cache!;
}

function persist(): void {
  if (!cache) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

export function createCard(concept: string, prompt: string): void {
  const store = load();
  if (store.cards[concept]) return; // idempotent — don't reset progress
  const empty = createEmptyCard(new Date());
  store.cards[concept] = {
    concept,
    prompt,
    dueAt: empty.due.toISOString(),
    fsrs: empty,
  };
  persist();
}

export function gradeCard(concept: string, rating: 1 | 2 | 3 | 4): void {
  const store = load();
  const card = store.cards[concept];
  if (!card) throw new Error(`No card for concept "${concept}"`);
  const now = new Date();
  const result = scheduler.next(card.fsrs, now, rating as Rating);
  card.fsrs = result.card;
  card.dueAt = result.card.due.toISOString();
  persist();
}

export function getDueCards(now: Date = new Date()): SrsCard[] {
  const store = load();
  return Object.values(store.cards).filter(c => new Date(c.dueAt) <= now);
}

export function getAllCards(): SrsCard[] {
  return Object.values(load().cards);
}

/** Test-only: clears in-memory cache and removes localStorage entry. */
export function _clearAll(): void {
  cache = null;
  localStorage.removeItem(STORAGE_KEY);
}
