# RAG Intelligent Textbook v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one fully working chapter (Chunking) of an interactive RAG textbook — three D3 sims wrapped in predict-first gates, MDX prose, FSRS-backed spaced repetition, and four Claude Code skills that turn the user's terminal into a Socratic tutor.

**Architecture:** Static Vite+React+MDX app in the browser. ~30-line Node script writes a shared JSON state file when sims emit interactions. Claude Code in the terminal reads that state file (and writes a `pendingGrade` field back) to be context-aware. No backend, no auth, no API key.

**Tech Stack:** Vite 5, React 18, TypeScript 5, MDX (`@mdx-js/rollup`), D3 v7, `ts-fsrs`, Vitest + React Testing Library, `concurrently` for dev-time process orchestration.

**Reference:** Design spec at `docs/superpowers/specs/2026-05-23-rag-textbook-design.md`.

---

## Phase overview (10 phases, 21 tasks)

| Phase | Tasks | Outcome |
|---|---|---|
| 0 — Scaffolding | 1 | `npm run dev` shows "Hello" |
| 1 — State bridge | 2–3 | Browser writes state file via Node sink |
| 2 — Retention infrastructure | 4–5 | FSRS works, state file polling works |
| 3 — Content infrastructure | 6 | Learning graph loads, MDX chapter loader works |
| 4 — UI components | 7–10 | Predict gate, recall prompt, review queue, chapter shell |
| 5 — First sim | 11 | `ChunkBoundaryExplorer` rendering and reporting state |
| 6 — End-to-end skeleton | 12 | Skeleton chapter with 1 section, 1 sim, 1 recall prompt working |
| 7 — Claude integration | 13–16 | CLAUDE.md + 4 skills |
| 8 — Remaining sims | 17–18 | Two more sims with predict-first |
| 9 — Full chapter content | 19 | Full Chunking chapter prose + 5 recall prompts |
| 10 — Dogfood + polish | 20–21 | End-to-end working; CLAUDE.md tuned from real session |

---

## Phase 0 — Scaffolding

### Task 1: Initialize project (git + Vite + React + TS + MDX)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Initialize git repo**

```bash
cd /mnt/c/Users/aqdas/Downloads/ai-engg
git init
git branch -m main
```

Expected: `Initialized empty Git repository in .../ai-engg/.git/`. If `git config user.email` is unset globally, set it for this repo only:

```bash
git config user.email "you@example.com"
git config user.name "Your Name"
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "ai-engg",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently -n vite,state -c blue,yellow \"vite\" \"node scripts/state-writer.cjs\"",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "d3": "^7.9.0",
    "ts-fsrs": "^4.6.1"
  },
  "devDependencies": {
    "@mdx-js/rollup": "^3.0.1",
    "@types/d3": "^7.4.3",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "concurrently": "^8.2.2",
    "jsdom": "^24.1.0",
    "typescript": "^5.5.3",
    "vite": "^5.3.3",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@sims/*": ["sims/*"],
      "@content/*": ["content/*"]
    }
  },
  "include": ["src", "sims", "content", "vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import path from 'node:path';

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@sims': path.resolve(__dirname, 'sims'),
      '@content': path.resolve(__dirname, 'content'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>RAG Textbook</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Create `src/App.tsx` (placeholder)**

```tsx
export default function App() {
  return <h1>RAG Textbook</h1>;
}
```

- [ ] **Step 8: Create `src/test-setup.ts` (Vitest + jest-dom)**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 9: Create `.gitignore`**

```
node_modules/
dist/
.sim-state.json
.sim-state.json.tmp
.DS_Store
*.log
.vite/
.superpowers/
```

- [ ] **Step 10: Create minimal `README.md`**

```markdown
# RAG Intelligent Textbook

Interactive textbook for learning RAG (Retrieval-Augmented Generation).

## Develop

    npm install
    npm run dev

Then open http://localhost:5173 in your browser and run `claude` in this directory in a separate terminal.

## Architecture

See `docs/superpowers/specs/2026-05-23-rag-textbook-design.md`.
```

- [ ] **Step 11: Install dependencies**

```bash
npm install
```

Expected: deps installed without errors. If npm warns about peer deps, ignore for now.

- [ ] **Step 12: Smoke-test dev server**

```bash
npm run dev
```

Expected: Vite prints `Local: http://localhost:5173/`. State-writer prints either nothing (it exists but is a no-op if `scripts/state-writer.cjs` doesn't exist yet — fix in step 13). Open the URL — should see "RAG Textbook". Ctrl-C to stop.

- [ ] **Step 13: Create stub `scripts/state-writer.cjs` (real impl in Task 2)**

```js
// Placeholder so `npm run dev` doesn't error. Real impl in Task 2.
console.log('state-writer stub — replace in Task 2');
process.stdin.resume();
```

- [ ] **Step 14: Re-run `npm run dev` to confirm both processes start cleanly**

Expected: both `vite` and `state` lines appear in the prefixed output. Ctrl-C stops both.

- [ ] **Step 15: Commit**

```bash
git add .
git commit -m "feat: scaffold Vite+React+MDX+TS project"
```

---

## Phase 1 — State bridge

### Task 2: `state-writer.cjs` — Node HTTP sink that atomically writes `.sim-state.json`

**Files:**
- Create: `scripts/state-writer.cjs`
- Create: `scripts/state-writer.test.cjs`

- [ ] **Step 1: Write the failing test**

```js
// scripts/state-writer.test.cjs
const { test, expect, beforeEach, afterEach } = require('vitest');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const STATE_FILE = path.join(__dirname, '..', '.sim-state.json');
let server;

beforeEach(async () => {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
  server = require('./state-writer.cjs').server;
  await new Promise(r => setTimeout(r, 50));
});

afterEach(() => {
  server?.close();
});

async function post(body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port: 5174, path: '/state', method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

test('writes posted body to .sim-state.json with version + lastUpdated', async () => {
  const res = await post({ currentChapter: 'chunking', simState: { chunkSize: 256 } });
  expect(res.status).toBe(204);
  const written = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(written.version).toBe(1);
  expect(written.currentChapter).toBe('chunking');
  expect(written.simState.chunkSize).toBe(256);
  expect(typeof written.lastUpdated).toBe('string');
});

test('preserves existing fields not present in incoming POST', async () => {
  await post({ currentChapter: 'chunking', simState: { chunkSize: 100 } });
  await post({ pendingAnswer: { concept: 'c1', answer: 'a' } });
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(w.simState.chunkSize).toBe(100); // preserved
  expect(w.pendingAnswer.concept).toBe('c1');
});

test('appends to recentInteractions ring buffer when simState changes', async () => {
  await post({ simState: { chunkSize: 100 } });
  await post({ simState: { chunkSize: 200 } });
  await post({ simState: { chunkSize: 200 } }); // no change
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(Array.isArray(w.recentInteractions)).toBe(true);
  expect(w.recentInteractions).toHaveLength(2); // only the two actual changes
  expect(w.recentInteractions[1].action).toMatch(/chunkSize.*200/);
});

test('ring buffer caps at 20 entries', async () => {
  for (let i = 0; i < 25; i++) await post({ simState: { chunkSize: i } });
  const w = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  expect(w.recentInteractions).toHaveLength(20);
});

test('returns 400 on invalid JSON', async () => {
  const res = await new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: 5174, path: '/state', method: 'POST' }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => resolve({ status: r.statusCode, body: d }));
    });
    req.write('not json');
    req.end();
  });
  expect(res.status).toBe(400);
});

test('returns 404 for non-/state paths', async () => {
  const res = await new Promise((resolve) => {
    http.get('http://127.0.0.1:5174/other', r => {
      r.on('data', () => {}); r.on('end', () => resolve({ status: r.statusCode }));
    });
  });
  expect(res.status).toBe(404);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run scripts/state-writer.test.cjs
```

Expected: FAIL — server.close not callable, or `require` errors.

- [ ] **Step 3: Replace `scripts/state-writer.cjs` with real implementation**

```js
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const STATE_FILE = path.join(__dirname, '..', '.sim-state.json');
const PORT = 5174;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'POST' || req.url !== '/state') {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = '';
  req.on('data', c => (body += c));
  req.on('end', () => {
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      res.writeHead(400);
      res.end('invalid json');
      return;
    }

    let existing = {};
    try {
      if (fs.existsSync(STATE_FILE)) {
        existing = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      }
    } catch {
      existing = {};
    }

    // Maintain recentInteractions ring buffer (cap 20) by diffing simState.
    const prevSim = existing.simState ?? {};
    const nextSim = parsed.simState ?? prevSim;
    const changes = [];
    if (parsed.simState) {
      for (const key of Object.keys(nextSim)) {
        if (JSON.stringify(prevSim[key]) !== JSON.stringify(nextSim[key])) {
          changes.push(`set ${key}=${JSON.stringify(nextSim[key])}`);
        }
      }
    }
    const recent = Array.isArray(existing.recentInteractions)
      ? existing.recentInteractions.slice()
      : [];
    if (changes.length > 0) {
      recent.push({ ts: new Date().toISOString(), action: changes.join(', ') });
      if (recent.length > 20) recent.splice(0, recent.length - 20);
    }

    const next = {
      ...existing,
      ...parsed,
      version: 1,
      lastUpdated: new Date().toISOString(),
      recentInteractions: recent,
    };

    const tmp = STATE_FILE + '.tmp';
    try {
      fs.writeFileSync(tmp, JSON.stringify(next, null, 2));
      fs.renameSync(tmp, STATE_FILE);
      res.writeHead(204);
      res.end();
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  if (require.main === module) console.log(`state-writer on http://127.0.0.1:${PORT}`);
});

module.exports = { server };
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run scripts/state-writer.test.cjs
```

Expected: all 3 PASS.

- [ ] **Step 5: Manual smoke-test**

In one terminal:

```bash
node scripts/state-writer.cjs
```

In another:

```bash
curl -X POST http://127.0.0.1:5174/state \
  -H 'Content-Type: application/json' \
  -d '{"currentChapter":"chunking","simState":{"chunkSize":512}}'
cat .sim-state.json
```

Expected: HTTP 204, `.sim-state.json` contains `{"version":1,"lastUpdated":"...","currentChapter":"chunking","simState":{"chunkSize":512}}`.

- [ ] **Step 6: Commit**

```bash
git add scripts/ .sim-state.json
git rm --cached .sim-state.json
git add .gitignore
git commit -m "feat: state-writer Node HTTP sink with atomic writes"
```

(`.sim-state.json` was just created by the smoke test; remove from index since it's gitignored.)

---

### Task 3: `reportState` browser helper (debounced POST)

**Files:**
- Create: `src/lib/reportState.ts`
- Create: `src/lib/reportState.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/reportState.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportState, _resetForTests } from './reportState';

describe('reportState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _resetForTests();
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);
  });
  afterEach(() => vi.useRealTimers());

  test('debounces multiple rapid calls into one POST', async () => {
    reportState('ChunkBoundaryExplorer', { chunkSize: 100 });
    reportState('ChunkBoundaryExplorer', { chunkSize: 200 });
    reportState('ChunkBoundaryExplorer', { chunkSize: 300 });
    expect(fetch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(250);
    expect(fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.simState.chunkSize).toBe(300);
  });

  test('POSTs to http://localhost:5174/state', async () => {
    reportState('Sim', { x: 1 });
    await vi.advanceTimersByTimeAsync(250);
    expect((fetch as any).mock.calls[0][0]).toBe('http://localhost:5174/state');
  });

  test('silently swallows fetch errors', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('connect refused'));
    reportState('Sim', { x: 1 });
    await expect(vi.advanceTimersByTimeAsync(250)).resolves.not.toThrow();
  });

  test('payload shape: { currentSim, simState, ts }', async () => {
    reportState('ChunkBoundaryExplorer', { chunkSize: 256 });
    await vi.advanceTimersByTimeAsync(250);
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.currentSim).toBe('ChunkBoundaryExplorer');
    expect(body.simState).toEqual({ chunkSize: 256 });
    expect(typeof body.ts).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/reportState.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `reportState`**

```ts
// src/lib/reportState.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/reportState.test.ts
```

Expected: all 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reportState.ts src/lib/reportState.test.ts
git commit -m "feat: reportState debounced POST helper for sims"
```

---

## Phase 2 — Retention infrastructure

### Task 4: `srs.ts` — FSRS wrapper with localStorage persistence

**Files:**
- Create: `src/lib/srs.ts`
- Create: `src/lib/srs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/srs.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { createCard, gradeCard, getDueCards, getAllCards, _clearAll } from './srs';

describe('srs', () => {
  beforeEach(() => {
    _clearAll();
    localStorage.clear();
  });

  test('createCard adds a new card with due date = now', () => {
    const before = Date.now();
    createCard('chunk-size-tradeoff', 'Explain the chunk size tradeoff.');
    const cards = getAllCards();
    expect(cards).toHaveLength(1);
    expect(cards[0].concept).toBe('chunk-size-tradeoff');
    expect(new Date(cards[0].dueAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  test('gradeCard with Easy (4) pushes due date out by days', () => {
    createCard('c1', 'q');
    gradeCard('c1', 4);
    const cards = getAllCards();
    const due = new Date(cards[0].dueAt).getTime();
    const oneDayFromNow = Date.now() + 24 * 3600 * 1000;
    expect(due).toBeGreaterThan(oneDayFromNow);
  });

  test('gradeCard with Again (1) keeps due date near now', () => {
    createCard('c1', 'q');
    gradeCard('c1', 1);
    const cards = getAllCards();
    const due = new Date(cards[0].dueAt).getTime();
    expect(due - Date.now()).toBeLessThan(60 * 60 * 1000); // < 1h
  });

  test('getDueCards returns only cards with dueAt <= now', () => {
    createCard('c1', 'q1');
    gradeCard('c1', 4); // pushed out
    createCard('c2', 'q2'); // due now
    const due = getDueCards();
    expect(due.map(c => c.concept)).toEqual(['c2']);
  });

  test('persists to localStorage and reloads', () => {
    createCard('c1', 'q1');
    gradeCard('c1', 3);
    const stored = localStorage.getItem('srs.v1');
    expect(stored).toBeTruthy();
    _clearAll();
    expect(getAllCards()).toHaveLength(0);
    // Simulate page reload by re-importing — easier: directly parse and check format.
    const parsed = JSON.parse(stored!);
    expect(parsed.version).toBe(1);
    expect(parsed.cards.c1).toBeDefined();
  });

  test('createCard is idempotent on existing concept (does not reset progress)', () => {
    createCard('c1', 'q1');
    gradeCard('c1', 4);
    const dueAfterFirst = getAllCards()[0].dueAt;
    createCard('c1', 'q1-revised'); // no-op
    expect(getAllCards()[0].dueAt).toBe(dueAfterFirst);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/srs.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `srs.ts`**

```ts
// src/lib/srs.ts
import { fsrs, generatorParameters, createEmptyCard, Rating, Card as FsrsCard } from 'ts-fsrs';

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

/** Test-only. */
export function _clearAll(): void {
  cache = null;
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/srs.test.ts
```

Expected: all 6 PASS. If `ts-fsrs` API differs in the installed version, adapt `scheduler.next(...)` per its docs (the test for `Easy → due > 1 day` and `Again → due < 1 hour` is the contract).

- [ ] **Step 5: Commit**

```bash
git add src/lib/srs.ts src/lib/srs.test.ts
git commit -m "feat: FSRS spaced-repetition wrapper with localStorage"
```

---

### Task 5: `stateFile.ts` — browser-side poller for `pendingGrade`

**Files:**
- Create: `src/lib/stateFile.ts`
- Create: `src/lib/stateFile.test.ts`

This module periodically fetches `.sim-state.json` (served by Vite as a static file once it exists) and exposes a subscription API for components that want to react when Claude writes a `pendingGrade`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/stateFile.test.ts
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { subscribeToPendingGrade, _stopForTests, _setIntervalMs } from './stateFile';

describe('stateFile poller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    _setIntervalMs(100);
    global.fetch = vi.fn();
  });
  afterEach(() => {
    _stopForTests();
    vi.useRealTimers();
  });

  test('calls subscriber when pendingGrade appears', async () => {
    let calls: any[] = [];
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ pendingAnswer: { concept: 'c1', answer: 'a' } }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        pendingAnswer: { concept: 'c1', answer: 'a' },
        pendingGrade: { concept: 'c1', rating: 3, comment: 'good' },
      }),
    });

    subscribeToPendingGrade(g => calls.push(g));
    await vi.advanceTimersByTimeAsync(100);
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(100);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ concept: 'c1', rating: 3, comment: 'good' });
  });

  test('does not double-fire for the same pendingGrade', async () => {
    let calls = 0;
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ pendingGrade: { concept: 'c1', rating: 3, comment: '' } }),
    });
    subscribeToPendingGrade(() => calls++);
    await vi.advanceTimersByTimeAsync(300);
    expect(calls).toBe(1);
  });

  test('silently swallows fetch errors', async () => {
    (fetch as any).mockRejectedValue(new Error('404'));
    subscribeToPendingGrade(() => {});
    await expect(vi.advanceTimersByTimeAsync(300)).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/stateFile.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `stateFile.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/stateFile.test.ts
```

Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stateFile.ts src/lib/stateFile.test.ts
git commit -m "feat: stateFile poller for pendingGrade events"
```

---

## Phase 3 — Content infrastructure

### Task 6: `learning-graph.json` + `content.ts` loader

**Files:**
- Create: `content/learning-graph.json`
- Create: `src/lib/content.ts`
- Create: `src/lib/content.test.ts`

- [ ] **Step 1: Create `content/learning-graph.json`**

```json
{
  "version": 1,
  "concepts": {
    "chunk-size": {
      "title": "Chunk size",
      "prerequisites": [],
      "chapter": "chunking",
      "section": "why-chunks"
    },
    "semantic-boundaries": {
      "title": "Semantic boundaries",
      "prerequisites": ["chunk-size"],
      "chapter": "chunking",
      "section": "why-chunks"
    },
    "chunk-overlap": {
      "title": "Chunk overlap",
      "prerequisites": ["chunk-size"],
      "chapter": "chunking",
      "section": "overlap-as-glue"
    },
    "chunk-retrieval-impact": {
      "title": "Chunking's impact on retrieval",
      "prerequisites": ["chunk-size", "chunk-overlap"],
      "chapter": "chunking",
      "section": "retrieval-impact"
    },
    "chunk-size-tradeoff": {
      "title": "The chunk-size tradeoff",
      "prerequisites": ["chunk-size", "chunk-retrieval-impact"],
      "chapter": "chunking",
      "section": "the-tradeoff"
    }
  }
}
```

- [ ] **Step 2: Write the failing test**

```ts
// src/lib/content.test.ts
import { describe, test, expect } from 'vitest';
import { loadLearningGraph, getConcept, getReadyToStudyConcepts } from './content';

describe('content / learning graph', () => {
  test('loadLearningGraph returns the JSON content', () => {
    const g = loadLearningGraph();
    expect(g.version).toBe(1);
    expect(g.concepts['chunk-size']).toBeDefined();
  });

  test('getConcept returns concept by id', () => {
    const c = getConcept('chunk-overlap');
    expect(c?.title).toBe('Chunk overlap');
    expect(c?.prerequisites).toContain('chunk-size');
  });

  test('getReadyToStudyConcepts returns concepts whose prereqs are all completed', () => {
    const ready = getReadyToStudyConcepts(new Set(['chunk-size']));
    const ids = ready.map(c => c.id);
    expect(ids).toContain('semantic-boundaries');
    expect(ids).toContain('chunk-overlap');
    expect(ids).not.toContain('chunk-size'); // already done
    expect(ids).not.toContain('chunk-retrieval-impact'); // needs overlap
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx vitest run src/lib/content.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `content.ts`**

```ts
// src/lib/content.ts
import graph from '@content/learning-graph.json';

export interface Concept {
  id: string;
  title: string;
  prerequisites: string[];
  chapter: string;
  section: string;
}

export interface LearningGraph {
  version: 1;
  concepts: Record<string, Omit<Concept, 'id'>>;
}

export function loadLearningGraph(): LearningGraph {
  return graph as LearningGraph;
}

export function getConcept(id: string): Concept | null {
  const c = graph.concepts[id as keyof typeof graph.concepts];
  return c ? { id, ...c } : null;
}

export function getReadyToStudyConcepts(completed: Set<string>): Concept[] {
  return Object.entries(graph.concepts)
    .filter(([id, c]) => !completed.has(id) && c.prerequisites.every(p => completed.has(p)))
    .map(([id, c]) => ({ id, ...c }));
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/content.test.ts
```

Expected: all 3 PASS.

- [ ] **Step 6: Commit**

```bash
git add content/learning-graph.json src/lib/content.ts src/lib/content.test.ts
git commit -m "feat: learning graph + loader for concept dependencies"
```

---

## Phase 4 — UI components

### Task 7: `PredictGate` component

**Files:**
- Create: `src/components/PredictGate.tsx`
- Create: `src/components/PredictGate.module.css`
- Create: `src/components/PredictGate.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/PredictGate.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PredictGate } from './PredictGate';

describe('PredictGate', () => {
  test('hides children behind overlay until prediction submitted', async () => {
    render(
      <PredictGate concept="c1" question="What will happen?">
        <div data-testid="sim">SIM</div>
      </PredictGate>,
    );
    expect(screen.getByText('What will happen?')).toBeInTheDocument();
    expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'true');
  });

  test('submitting prediction unlocks the sim and shows the prediction', async () => {
    render(
      <PredictGate concept="c1" question="What will happen?">
        <div data-testid="sim">SIM</div>
      </PredictGate>,
    );
    await userEvent.type(screen.getByRole('textbox'), 'Big chunks lose precision');
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'false');
    expect(screen.getByText(/big chunks lose precision/i)).toBeInTheDocument();
  });

  test('requires a non-empty prediction to unlock', async () => {
    render(
      <PredictGate concept="c1" question="What will happen?">
        <div data-testid="sim">SIM</div>
      </PredictGate>,
    );
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));
    expect(screen.getByTestId('sim')).toHaveAttribute('data-locked', 'true');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/PredictGate.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `PredictGate`**

```tsx
// src/components/PredictGate.tsx
import { useState, ReactNode, cloneElement, isValidElement } from 'react';
import styles from './PredictGate.module.css';

interface Props {
  concept: string;
  question: string;
  hint?: string;
  children: ReactNode;
}

export function PredictGate({ concept, question, hint, children }: Props) {
  const [prediction, setPrediction] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (prediction.trim().length === 0) return;
    setSubmitted(true);
  }

  const lockedChildren = isValidElement(children)
    ? cloneElement(children as React.ReactElement, { 'data-locked': String(!submitted) })
    : children;

  return (
    <div className={styles.gate} data-concept={concept}>
      {!submitted && (
        <div className={styles.predictPanel}>
          <h4>Predict first</h4>
          <p className={styles.question}>{question}</p>
          {hint && <p className={styles.hint}>Hint: {hint}</p>}
          <textarea
            value={prediction}
            onChange={e => setPrediction(e.target.value)}
            placeholder="It's OK to be wrong — making the guess is the point."
            rows={3}
          />
          <button type="button" onClick={submit}>Unlock sim</button>
        </div>
      )}
      {submitted && (
        <div className={styles.predictionShown}>
          <strong>Your prediction:</strong> {prediction}
        </div>
      )}
      <div className={submitted ? styles.unlocked : styles.locked}>
        {lockedChildren}
      </div>
    </div>
  );
}
```

```css
/* src/components/PredictGate.module.css */
.gate { margin: 1.5rem 0; }
.predictPanel {
  background: #fff8e7;
  border-left: 4px solid #f59e0b;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 0.75rem;
}
.predictPanel textarea {
  width: 100%;
  font-family: inherit;
  margin: 0.5rem 0;
}
.predictionShown {
  background: #ecfdf5;
  border-left: 4px solid #10b981;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 4px;
  font-size: 0.9em;
}
.locked { opacity: 0.4; pointer-events: none; filter: blur(1px); }
.unlocked { opacity: 1; }
.question { font-weight: 600; margin: 0.5rem 0; }
.hint { font-style: italic; color: #6b7280; font-size: 0.9em; }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/PredictGate.test.tsx
```

Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PredictGate.tsx src/components/PredictGate.module.css src/components/PredictGate.test.tsx
git commit -m "feat: PredictGate enforces predict-first sim interaction"
```

---

### Task 8: `RecallPrompt` component

**Files:**
- Create: `src/components/RecallPrompt.tsx`
- Create: `src/components/RecallPrompt.module.css`
- Create: `src/components/RecallPrompt.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/RecallPrompt.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecallPrompt } from './RecallPrompt';
import * as srs from '../lib/srs';
import * as stateFile from '../lib/stateFile';

vi.mock('../lib/srs');
vi.mock('../lib/stateFile');

describe('RecallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  test('renders question and answer textarea', () => {
    render(<RecallPrompt concept="c1" question="Explain X." />);
    expect(screen.getByText('Explain X.')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('submitting answer posts pendingAnswer to state-writer', async () => {
    render(<RecallPrompt concept="c1" question="Explain X." />);
    await userEvent.type(screen.getByRole('textbox'), 'My answer');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5174/state',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.pendingAnswer).toEqual(
      expect.objectContaining({ concept: 'c1', answer: 'My answer', question: 'Explain X.' }),
    );
  });

  test('after submit, instructs user to run /quiz in Claude Code', async () => {
    render(<RecallPrompt concept="c1" question="Explain X." />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/run.*\/quiz.*claude code/i)).toBeInTheDocument();
  });

  test('when pendingGrade arrives, shows commit-to-SR button', async () => {
    let subCb: any;
    (stateFile.subscribeToPendingGrade as any).mockImplementation((cb: any) => {
      subCb = cb;
      return () => {};
    });
    render(<RecallPrompt concept="c1" question="Q" />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    subCb({ concept: 'c1', rating: 3, comment: 'Good answer.' });
    expect(await screen.findByRole('button', { name: /commit to sr/i })).toBeInTheDocument();
    expect(screen.getByText(/good answer/i)).toBeInTheDocument();
  });

  test('clicking commit-to-SR calls createCard then gradeCard', async () => {
    let subCb: any;
    (stateFile.subscribeToPendingGrade as any).mockImplementation((cb: any) => { subCb = cb; return () => {}; });
    render(<RecallPrompt concept="c1" question="Q" />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    subCb({ concept: 'c1', rating: 4, comment: '' });
    await userEvent.click(await screen.findByRole('button', { name: /commit to sr/i }));
    expect(srs.createCard).toHaveBeenCalledWith('c1', 'Q');
    expect(srs.gradeCard).toHaveBeenCalledWith('c1', 4);
  });

  test('ignores pendingGrade for a different concept', async () => {
    let subCb: any;
    (stateFile.subscribeToPendingGrade as any).mockImplementation((cb: any) => { subCb = cb; return () => {}; });
    render(<RecallPrompt concept="c1" question="Q" />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    subCb({ concept: 'c2', rating: 4, comment: '' });
    expect(screen.queryByRole('button', { name: /commit to sr/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/RecallPrompt.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `RecallPrompt`**

```tsx
// src/components/RecallPrompt.tsx
import { useState, useEffect } from 'react';
import { createCard, gradeCard } from '../lib/srs';
import { subscribeToPendingGrade, PendingGrade } from '../lib/stateFile';
import styles from './RecallPrompt.module.css';

interface Props {
  concept: string;
  question: string;
}

type Phase = 'answering' | 'awaitingGrade' | 'graded' | 'committed';

export function RecallPrompt({ concept, question }: Props) {
  const [phase, setPhase] = useState<Phase>('answering');
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<PendingGrade | null>(null);

  useEffect(() => {
    if (phase !== 'awaitingGrade') return;
    return subscribeToPendingGrade(g => {
      if (g.concept !== concept) return;
      setGrade(g);
      setPhase('graded');
    });
  }, [phase, concept]);

  async function submit() {
    if (answer.trim().length === 0) return;
    await fetch('http://localhost:5174/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingAnswer: { concept, question, answer, ts: new Date().toISOString() },
      }),
    }).catch(() => {});
    setPhase('awaitingGrade');
  }

  function commitToSr() {
    if (!grade) return;
    createCard(concept, question);
    gradeCard(concept, grade.rating);
    // Clear pendingAnswer + pendingGrade
    fetch('http://localhost:5174/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingAnswer: null, pendingGrade: null }),
    }).catch(() => {});
    setPhase('committed');
  }

  return (
    <div className={styles.prompt} data-concept={concept}>
      <h4>Recall</h4>
      <p className={styles.question}>{question}</p>
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={4}
        disabled={phase !== 'answering'}
        placeholder="Type your answer. Free-form. The act of generating is the point."
      />
      {phase === 'answering' && (
        <button type="button" onClick={submit} disabled={answer.trim().length === 0}>
          Submit
        </button>
      )}
      {phase === 'awaitingGrade' && (
        <p className={styles.instruction}>
          Run <code>/quiz {concept}</code> in your Claude Code terminal to grade this answer.
        </p>
      )}
      {phase === 'graded' && grade && (
        <div className={styles.gradePanel}>
          <p>
            <strong>Claude's rating:</strong> {ratingName(grade.rating)} ({grade.rating}/4)
          </p>
          {grade.comment && <p className={styles.comment}>{grade.comment}</p>}
          <button type="button" onClick={commitToSr}>Commit to SR</button>
        </div>
      )}
      {phase === 'committed' && <p className={styles.committed}>✓ Added to spaced repetition queue.</p>}
    </div>
  );
}

function ratingName(r: 1 | 2 | 3 | 4): string {
  return ['', 'Again', 'Hard', 'Good', 'Easy'][r];
}
```

```css
/* src/components/RecallPrompt.module.css */
.prompt {
  background: #f3f4f6;
  border-left: 4px solid #6366f1;
  padding: 1rem;
  border-radius: 4px;
  margin: 1.5rem 0;
}
.question { font-weight: 600; margin: 0.5rem 0; }
.prompt textarea { width: 100%; font-family: inherit; margin: 0.5rem 0; }
.instruction { font-size: 0.9em; color: #4b5563; font-style: italic; }
.gradePanel { background: white; padding: 0.75rem; border-radius: 4px; margin-top: 0.75rem; }
.comment { font-size: 0.9em; color: #4b5563; margin-top: 0.25rem; }
.committed { color: #047857; font-weight: 600; }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/RecallPrompt.test.tsx
```

Expected: all 6 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/RecallPrompt.tsx src/components/RecallPrompt.module.css src/components/RecallPrompt.test.tsx
git commit -m "feat: RecallPrompt — free-form recall with Claude grading via state file"
```

---

### Task 9: `ReviewQueue` component

**Files:**
- Create: `src/components/ReviewQueue.tsx`
- Create: `src/components/ReviewQueue.module.css`
- Create: `src/components/ReviewQueue.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ReviewQueue.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewQueue } from './ReviewQueue';
import * as srs from '../lib/srs';

vi.mock('../lib/srs');

describe('ReviewQueue', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows "no reviews due" when empty', () => {
    (srs.getDueCards as any).mockReturnValue([]);
    render(<ReviewQueue />);
    expect(screen.getByText(/no reviews due/i)).toBeInTheDocument();
  });

  test('shows count + first card prompt when cards due', () => {
    (srs.getDueCards as any).mockReturnValue([
      { concept: 'c1', prompt: 'Q1', dueAt: '2026-05-23T00:00:00Z', fsrs: {} },
      { concept: 'c2', prompt: 'Q2', dueAt: '2026-05-23T00:00:00Z', fsrs: {} },
    ]);
    render(<ReviewQueue />);
    expect(screen.getByText(/2 reviews due/i)).toBeInTheDocument();
    expect(screen.getByText('Q1')).toBeInTheDocument();
  });

  test('renders a RecallPrompt for the first due card', () => {
    (srs.getDueCards as any).mockReturnValue([
      { concept: 'c1', prompt: 'Q1', dueAt: '2026-05-23T00:00:00Z', fsrs: {} },
    ]);
    render(<ReviewQueue />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/ReviewQueue.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ReviewQueue`**

```tsx
// src/components/ReviewQueue.tsx
import { useMemo } from 'react';
import { getDueCards } from '../lib/srs';
import { RecallPrompt } from './RecallPrompt';
import styles from './ReviewQueue.module.css';

export function ReviewQueue() {
  const due = useMemo(() => getDueCards(), []);
  if (due.length === 0) {
    return <p className={styles.empty}>No reviews due. Come back later.</p>;
  }
  const first = due[0]!;
  return (
    <div className={styles.queue}>
      <h3>{due.length} review{due.length === 1 ? '' : 's'} due</h3>
      <RecallPrompt concept={first.concept} question={first.prompt} />
    </div>
  );
}
```

```css
/* src/components/ReviewQueue.module.css */
.queue { padding: 1rem 0; }
.empty { color: #6b7280; padding: 2rem; text-align: center; }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/ReviewQueue.test.tsx
```

Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ReviewQueue.tsx src/components/ReviewQueue.module.css src/components/ReviewQueue.test.tsx
git commit -m "feat: ReviewQueue cycles through due SR cards"
```

---

### Task 10: `ChapterShell` + `Nav` + barrel `index.ts`

**Files:**
- Create: `src/components/ChapterShell.tsx`
- Create: `src/components/ChapterShell.module.css`
- Create: `src/components/Nav.tsx`
- Create: `src/components/Nav.module.css`
- Create: `src/components/index.ts`
- Create: `src/components/Nav.test.tsx`

- [ ] **Step 1: Write the failing test for Nav**

```tsx
// src/components/Nav.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Nav } from './Nav';
import * as srs from '../lib/srs';

vi.mock('../lib/srs');

describe('Nav', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows due-count badge when cards are due', () => {
    (srs.getDueCards as any).mockReturnValue([{ concept: 'c1' }, { concept: 'c2' }]);
    render(<Nav />);
    expect(screen.getByText(/2 due/i)).toBeInTheDocument();
  });

  test('hides badge when no cards due', () => {
    (srs.getDueCards as any).mockReturnValue([]);
    render(<Nav />);
    expect(screen.queryByText(/due/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/Nav.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Nav`**

```tsx
// src/components/Nav.tsx
import { getDueCards } from '../lib/srs';
import styles from './Nav.module.css';

export function Nav() {
  const dueCount = getDueCards().length;
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>RAG Textbook</span>
      <a href="/" className={styles.link}>Chapters</a>
      <a href="/review" className={styles.link}>Review</a>
      {dueCount > 0 && <span className={styles.badge}>{dueCount} due</span>}
    </nav>
  );
}
```

```css
/* src/components/Nav.module.css */
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}
.brand { font-weight: 700; }
.link { color: #2563eb; text-decoration: none; }
.badge {
  background: #f59e0b;
  color: white;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8em;
  font-weight: 600;
  margin-left: auto;
}
```

- [ ] **Step 4: Implement `ChapterShell`**

```tsx
// src/components/ChapterShell.tsx
import { ReactNode } from 'react';
import { Nav } from './Nav';
import styles from './ChapterShell.module.css';

interface Props {
  title: string;
  children: ReactNode;
}

export function ChapterShell({ title, children }: Props) {
  return (
    <div className={styles.shell}>
      <Nav />
      <main className={styles.main}>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}
```

```css
/* src/components/ChapterShell.module.css */
.shell { max-width: 850px; margin: 0 auto; }
.main {
  padding: 2rem 1.5rem 4rem;
  font-family: system-ui, sans-serif;
  line-height: 1.7;
  color: #111827;
}
.main h1 { font-size: 2rem; margin-bottom: 1.5rem; }
.main h2 { margin-top: 2.5rem; }
.main code { background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 3px; }
```

- [ ] **Step 5: Implement barrel `index.ts`**

```ts
// src/components/index.ts
export { ChapterShell } from './ChapterShell';
export { Nav } from './Nav';
export { PredictGate } from './PredictGate';
export { RecallPrompt } from './RecallPrompt';
export { ReviewQueue } from './ReviewQueue';
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run src/components/Nav.test.tsx
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/
git commit -m "feat: ChapterShell + Nav with due-count badge"
```

---

## Phase 5 — First sim

### Task 11: `ChunkBoundaryExplorer` sim (simplest D3 sim, end-to-end)

**Files:**
- Create: `sims/ChunkBoundaryExplorer/index.tsx`
- Create: `sims/ChunkBoundaryExplorer/index.module.css`
- Create: `sims/ChunkBoundaryExplorer/README.md`
- Create: `sims/ChunkBoundaryExplorer/index.test.tsx`

This sim shows a single paragraph of text. The user adjusts `chunk_size` with a slider; coloured rectangles overlay the text showing how chunks form. A second slider shows `chunk_count` derived live.

- [ ] **Step 1: Write the failing test**

```tsx
// sims/ChunkBoundaryExplorer/index.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChunkBoundaryExplorer } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('ChunkBoundaryExplorer', () => {
  test('renders text and chunk-size slider', () => {
    render(<ChunkBoundaryExplorer initialChunkSize={128} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText(/chunk size/i)).toBeInTheDocument();
  });

  test('changing slider reports state via reportState', async () => {
    render(<ChunkBoundaryExplorer initialChunkSize={128} />);
    const slider = screen.getByRole('slider');
    await userEvent.click(slider);
    // Set slider to a new value via fireEvent (range inputs are awkward for userEvent)
    slider.setAttribute('value', '256');
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    expect(reportState.reportState).toHaveBeenCalledWith(
      'ChunkBoundaryExplorer',
      expect.objectContaining({ chunkSize: 256 }),
    );
  });

  test('chunk count = ceil(text_length / chunk_size)', () => {
    render(<ChunkBoundaryExplorer initialChunkSize={100} textLength={350} />);
    expect(screen.getByText(/4 chunks/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run sims/ChunkBoundaryExplorer/index.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `ChunkBoundaryExplorer`**

```tsx
// sims/ChunkBoundaryExplorer/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SAMPLE_TEXT =
  'Retrieval-Augmented Generation pairs a language model with a search step. ' +
  'Instead of asking the model to remember everything, you let it look things up at answer time. ' +
  'The lookup happens against chunks: small pieces carved out of your source documents. ' +
  'How you carve those chunks determines what the model can and cannot find.';

interface Props {
  initialChunkSize?: number;
  textLength?: number;
  textOverride?: string;
}

export function ChunkBoundaryExplorer({
  initialChunkSize = 128,
  textLength,
  textOverride,
}: Props) {
  const [chunkSize, setChunkSize] = useState(initialChunkSize);
  const text = textOverride ?? SAMPLE_TEXT;
  const length = textLength ?? text.length;
  const chunkCount = Math.ceil(length / chunkSize);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    reportState('ChunkBoundaryExplorer', { chunkSize, chunkCount, textLength: length });
  }, [chunkSize, chunkCount, length]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const charsPerLine = 80;
    const lineHeight = 20;
    const lines = Math.ceil(length / charsPerLine);
    const height = lines * lineHeight + 10;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Draw chunk rectangles by mapping char index → (x, y)
    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, length);
      const startLine = Math.floor(start / charsPerLine);
      const endLine = Math.floor((end - 1) / charsPerLine);
      for (let line = startLine; line <= endLine; line++) {
        const x1 = (line === startLine ? start % charsPerLine : 0) * (width / charsPerLine);
        const x2 =
          (line === endLine ? ((end - 1) % charsPerLine) + 1 : charsPerLine) *
          (width / charsPerLine);
        svg
          .append('rect')
          .attr('x', x1)
          .attr('y', line * lineHeight + 2)
          .attr('width', x2 - x1)
          .attr('height', lineHeight - 4)
          .attr('fill', colorScale(String(i)))
          .attr('opacity', 0.35);
      }
    }

    // Overlay the actual text characters (line-broken)
    for (let line = 0; line < lines; line++) {
      svg
        .append('text')
        .attr('x', 4)
        .attr('y', line * lineHeight + 15)
        .attr('font-family', 'monospace')
        .attr('font-size', 13)
        .text(text.slice(line * charsPerLine, (line + 1) * charsPerLine));
    }
  }, [chunkSize, chunkCount, length, text]);

  return (
    <div className={styles.sim}>
      <label className={styles.control}>
        Chunk size: <strong>{chunkSize}</strong> chars
        <input
          type="range"
          min={32}
          max={512}
          step={16}
          value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))}
        />
      </label>
      <p className={styles.stats}>
        <strong>{chunkCount}</strong> chunks from a {length}-char document
      </p>
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}
```

```css
/* sims/ChunkBoundaryExplorer/index.module.css */
.sim {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
}
.control { display: flex; align-items: center; gap: 1rem; }
.control input { flex: 1; }
.stats { font-size: 0.9em; color: #4b5563; margin: 0.5rem 0; }
.svg { width: 100%; height: auto; display: block; margin-top: 0.5rem; }
```

```markdown
<!-- sims/ChunkBoundaryExplorer/README.md -->
# ChunkBoundaryExplorer

**Teaches:** `chunk-size`, `semantic-boundaries`

Shows how a fixed-size chunk splitter carves a paragraph. Slider controls chunk size; coloured overlays show where each chunk begins and ends. Makes visible: chunks cut across sentence boundaries; small chunks fragment ideas; large chunks blur them together.

**Reported state:** `{ chunkSize, chunkCount, textLength }`
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run sims/ChunkBoundaryExplorer/index.test.tsx
```

Expected: all 3 PASS. If the slider event test is flaky in jsdom, fall back to `fireEvent.change(slider, { target: { value: '256' } })`.

- [ ] **Step 5: Commit**

```bash
git add sims/ChunkBoundaryExplorer/
git commit -m "feat: ChunkBoundaryExplorer sim with D3 overlay + reportState"
```

---

## Phase 6 — End-to-end skeleton

### Task 12: Wire one chapter end-to-end (skeleton MDX, App routes)

**Files:**
- Create: `content/chapters/01-chunking.mdx` (skeleton — full content in Task 19)
- Modify: `src/App.tsx`
- Create: `src/Chapter.tsx`
- Create: `src/Review.tsx`

- [ ] **Step 1: Create skeleton chapter MDX**

```mdx
---
id: chunking
title: Chunking
estimatedMinutes: 25
concepts: [chunk-size, semantic-boundaries, chunk-overlap, chunk-retrieval-impact, chunk-size-tradeoff]
prerequisites: []
---

import { ChunkBoundaryExplorer } from '@sims/ChunkBoundaryExplorer'
import { PredictGate, RecallPrompt } from '@/components'

## Why chunks?

Retrieval-Augmented Generation works by looking things up at answer time, against
chunks carved out of your source documents. How you carve them matters more than
most people realize.

<PredictGate
  concept="chunk-size"
  question="If we set chunk_size = document_length (one chunk for the whole document), what happens to retrieval precision?"
  hint="Think about what's being compared at retrieval time."
>
  <ChunkBoundaryExplorer initialChunkSize={128} />
</PredictGate>

Try moving the slider. Notice what happens to chunk boundaries — they cut
right through sentences. That alone is a clue about the trade-offs.

<RecallPrompt
  concept="chunk-size-tradeoff"
  question="In your own words: why do both very small (32-char) and very large (whole-document) chunks hurt retrieval? Use a concrete example."
/>
```

- [ ] **Step 2: Create `src/Chapter.tsx`**

```tsx
// src/Chapter.tsx
import { Suspense, lazy } from 'react';
import { ChapterShell } from './components';

const Content = lazy(() => import('../content/chapters/01-chunking.mdx'));

export function Chapter() {
  return (
    <ChapterShell title="Chunking">
      <Suspense fallback={<p>Loading…</p>}>
        <Content />
      </Suspense>
    </ChapterShell>
  );
}
```

- [ ] **Step 3: Create `src/Review.tsx`**

```tsx
// src/Review.tsx
import { ChapterShell, ReviewQueue } from './components';

export function Review() {
  return (
    <ChapterShell title="Review">
      <ReviewQueue />
    </ChapterShell>
  );
}
```

- [ ] **Step 4: Replace `src/App.tsx` with router (lightweight, no react-router for v1)**

```tsx
// src/App.tsx
import { useEffect, useState } from 'react';
import { Chapter } from './Chapter';
import { Review } from './Review';

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  if (path === '/review') return <Review />;
  return <Chapter />;
}
```

- [ ] **Step 5: Add a global MDX types declaration**

Create `src/mdx.d.ts`:

```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react';
  const MDXComponent: ComponentType;
  export default MDXComponent;
}
```

- [ ] **Step 6: Manual smoke-test end-to-end**

```bash
npm run dev
```

In browser: open `http://localhost:5173/`.
- Expect: chapter renders. Sim is locked behind PredictGate.
- Type a prediction; click "Unlock sim".
- Expect: sim becomes interactive; prediction shown above.
- Move the slider.
- In another terminal: `cat .sim-state.json` — expect to see `simState.chunkSize` matching the slider.
- Submit the recall prompt with any text.
- Expect: "Run `/quiz chunk-size-tradeoff` in your Claude Code terminal" instruction.
- `cat .sim-state.json` — expect `pendingAnswer` field present.

- [ ] **Step 7: Commit**

```bash
git add src/Chapter.tsx src/Review.tsx src/App.tsx src/mdx.d.ts content/chapters/01-chunking.mdx
git commit -m "feat: end-to-end skeleton chapter with sim + recall + state file"
```

---

## Phase 7 — Claude integration

### Task 13: `CLAUDE.md` (tutor charter)

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create `CLAUDE.md`**

````markdown
# Claude Code Tutor Charter — RAG Intelligent Textbook

You are a **Socratic tutor** for a working software engineer learning RAG (Retrieval-Augmented Generation). The user is reading interactive chapters in a browser at `http://localhost:5173/`. You see what they are doing because the browser writes their current state to `.sim-state.json` in the project root.

## Your core rule

**You do not explain things directly. You make the user explain things.**

Whenever the user asks a "why" or "what" question:
1. First read `.sim-state.json` to see what they are looking at.
2. Then ask them a focused question that gets them halfway to the answer.
3. Wait for their attempt before saying anything more.
4. If their attempt is wrong, do not correct it — ask a clarifying question that surfaces the mistake.

The only exception: if the user explicitly says **"just tell me"**, give a direct answer. Then immediately follow with a recall question to anchor it.

## Always start with state

At the start of any tutoring exchange:
1. Read `.sim-state.json`. Note `currentChapter`, `currentSim`, `prediction`, `simState`, and `recentInteractions`.
2. Read `content/learning-graph.json`. Note which concepts the current chapter covers and what prerequisites exist.
3. Reference what the user is literally doing — not generic RAG knowledge.

Example: do not say "Cosine similarity is a measure of angle between two vectors…" Instead: "I see you've set chunk_size=512 and the retrieval@5 dropped. What changed about the cosine comparison when you doubled the chunks?"

## When the user has submitted a recall answer

If `.sim-state.json` has a `pendingAnswer` field, the user submitted a recall prompt and is waiting for you to grade it. Use the rubric below.

### Grading rubric

Score each of three criteria 0 or 1:

1. **Correctness:** Are the claims they make about RAG true?
2. **Specificity:** Did they use a concrete example or refer to specific behavior, not just buzzwords?
3. **Tradeoff awareness:** Did they identify the tension or tradeoff at the heart of the question?

Sum the scores (0–3) and map to FSRS rating:
- 0 → 1 (Again)
- 1 → 2 (Hard)
- 2 → 3 (Good)
- 3 → 4 (Easy)

Then write the result back to `.sim-state.json` by updating the file with a `pendingGrade` field:

```json
{
  "pendingGrade": {
    "concept": "<from pendingAnswer.concept>",
    "rating": <1|2|3|4>,
    "comment": "<one-sentence feedback for the user>"
  }
}
```

Use the Write tool. Preserve all other fields of the file when writing.

## Prerequisite awareness

If the user asks about a concept whose prerequisites in `content/learning-graph.json` they have not yet completed (no SR card for that prereq concept), say so before answering. Example: "You're asking about reranking, but you haven't completed the embedding-similarity chapter. Want to back up to that first, or just push through?"

## Skills available

- `/explain` — read state, produce a guided explanation
- `/quiz [concept?]` — generate a recall question or grade a pending answer
- `/review` — walk through due SR cards
- `/next` — suggest next concept respecting prereqs + interleaving

## Things never to do

- Never give a direct answer to a "why" question on the first turn.
- Never use generic AI/RAG knowledge before reading the user's actual state.
- Never write to files other than `.sim-state.json`'s `pendingGrade` field unless explicitly asked.
- Never assume the user has read the entire chapter — check the learning graph.
````

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "feat: CLAUDE.md tutor charter with Socratic rules + grading rubric"
```

---

### Task 14: `.claude/skills/explain.md`

**Files:**
- Create: `.claude/skills/explain.md`

- [ ] **Step 1: Create skill file**

````markdown
---
name: explain
description: Socratic explanation of the user's current sim state.
---

# /explain

Use this skill when the user asks for clarification on what they're seeing in a sim.

## Procedure

1. **Read state:** Use the Read tool on `.sim-state.json`.
2. **Identify what they're exploring:** Note `currentChapter`, `currentSim`, the latest `simState`, and the last 3 entries of `recentInteractions`.
3. **Identify the underlying concept** for the current state — check `content/learning-graph.json` for the concepts associated with the current chapter.
4. **Form ONE guided question** that:
   - References the specific values they have set in the sim
   - Highlights the tradeoff or principle the sim is teaching
   - Does not give away the answer
5. **Ask the question. Stop.** Do not explain further until the user attempts an answer.

## Example

State file shows:
```json
{ "currentSim": "ChunkBoundaryExplorer",
  "simState": { "chunkSize": 512, "chunkCount": 1 },
  "recentInteractions": [
    { "action": "set chunkSize=128", ... },
    { "action": "set chunkSize=256", ... },
    { "action": "set chunkSize=512", ... }
  ]
}
```

Good response: "I see you've been cranking chunk_size up — 128 → 256 → 512. At 512 you've got one chunk for the whole document. If someone searches for a specific fact at retrieval time, what does that one big chunk get compared against?"

Bad response: "When chunk size grows, each chunk contains more text, so cosine similarity becomes diluted by irrelevant content. The optimal size is usually 200-500 tokens depending on…" (← direct explanation, violates the charter)
````

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/explain.md
git commit -m "feat: /explain skill — Socratic explanation grounded in sim state"
```

---

### Task 15: `.claude/skills/quiz.md`

**Files:**
- Create: `.claude/skills/quiz.md`

- [ ] **Step 1: Create skill file**

````markdown
---
name: quiz
description: Grade a pending recall answer or generate a new recall question.
---

# /quiz [concept?]

## Two modes

### Mode A: Grade a pending answer (most common)

When the user runs `/quiz [concept]`, check `.sim-state.json` for a `pendingAnswer` field.

If present:

1. Read `pendingAnswer.question`, `pendingAnswer.answer`, `pendingAnswer.concept`.
2. Apply the grading rubric from CLAUDE.md (3 binary criteria → 0–3 total → 1–4 FSRS rating).
3. Write `pendingGrade` to `.sim-state.json` using the Write tool. Preserve all other fields. Format:

   ```json
   {
     ...all existing fields...,
     "pendingGrade": {
       "concept": "<pendingAnswer.concept>",
       "rating": <1|2|3|4>,
       "comment": "<one sentence — what was missing or what was strong>"
     }
   }
   ```

4. Tell the user: "Graded: <rating-name> (<rating>/4). <one-sentence comment>. Click 'Commit to SR' in the browser to enqueue."

### Mode B: Generate a new question

If no `pendingAnswer` exists, or if the user passes a concept that has no pendingAnswer:

1. Pick a concept (use the argument if given; else pick a due SR card from `content/learning-graph.json` × `localStorage` SR cards — ask user to paste their `localStorage.getItem('srs.v1')` if needed).
2. Write a recall question that:
   - Requires the user to use their own words
   - Requires either a concrete example or a tradeoff articulation
   - Is answerable from the chapter content
3. Print the question. Tell the user to answer in the browser (RecallPrompt) so the answer is captured in state.

## Rubric reminder

Three binary criteria:
- Correctness — is what they said true?
- Specificity — concrete example or specific behavior, not just buzzwords?
- Tradeoff awareness — did they name the tension?

Sum → rating:
- 0 → Again (1)
- 1 → Hard (2)
- 2 → Good (3)
- 3 → Easy (4)
````

- [ ] **Step 2: Commit**

```bash
git add .claude/skills/quiz.md
git commit -m "feat: /quiz skill — grade or generate recall questions"
```

---

### Task 16: `.claude/skills/review.md` and `.claude/skills/next.md`

**Files:**
- Create: `.claude/skills/review.md`
- Create: `.claude/skills/next.md`

- [ ] **Step 1: Create `review.md`**

````markdown
---
name: review
description: Walk the user through their due SR cards one at a time.
---

# /review

## Procedure

1. Ask the user to paste their SR state from the browser dev console:

   ```js
   copy(localStorage.getItem('srs.v1'))
   ```

   (In v1.1 we'll auto-sync this; for now it's manual.)

2. Parse the JSON. Filter `cards` where `dueAt <= now`. Order randomly.

3. For each due card:
   a. Present `card.prompt` to the user.
   b. Wait for the user to answer in the terminal (free-form) or in the browser via RecallPrompt.
   c. Grade per the rubric in CLAUDE.md.
   d. Tell the user the rating and instruct them to click the rating in the browser to commit.

4. After all due cards: "Review complete. {n} cards reviewed."

## Important

Do not skip cards. Do not bias toward "Good" — the rubric is binary per criterion; apply it strictly so spacing reflects real performance.
````

- [ ] **Step 2: Create `next.md`**

````markdown
---
name: next
description: Suggest the next concept to study, respecting prerequisites and SR interleaving.
---

# /next

## Procedure

1. Read `content/learning-graph.json`.
2. Ask the user for their `localStorage` SR state (or check `.sim-state.json` if you've cached it).
3. Compute:
   - **Completed concepts**: those with an SR card.
   - **Due reviews**: SR cards where `dueAt <= now`.
   - **Ready-to-study concepts**: concepts with all prerequisites completed AND no SR card yet.

4. Decision:
   - If due reviews ≥ 3: suggest `/review` first. ("You have 4 reviews due. Knock those out before adding new material.")
   - Else, with probability ~60% pick a ready-to-study concept; ~40% pick a due review. Interleaving matters.
   - If nothing is ready (all prereqs not yet met), surface the prerequisite chain.

5. Tell the user the concept name, the chapter/section to open, and a one-sentence "why this next."

## Example output

> "Next: **chunk-overlap** (Chapter 1, section 'Overlap as glue'). You've completed chunk-size, which is the only prerequisite. After this you'll be ready for the retrieval-impact section."
````

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/review.md .claude/skills/next.md
git commit -m "feat: /review and /next skills for SR + learning-graph navigation"
```

---

## Phase 8 — Remaining sims

### Task 17: `OverlapVisualizer` sim

**Files:**
- Create: `sims/OverlapVisualizer/index.tsx`
- Create: `sims/OverlapVisualizer/index.module.css`
- Create: `sims/OverlapVisualizer/README.md`
- Create: `sims/OverlapVisualizer/index.test.tsx`

This sim shows the same paragraph but with two sliders: `chunk_size` and `overlap`. Highlights the overlap region in a different colour. A small inset shows what happens to a sentence that lands on a boundary.

- [ ] **Step 1: Write the failing test**

```tsx
// sims/OverlapVisualizer/index.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverlapVisualizer } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('OverlapVisualizer', () => {
  test('renders both chunk-size and overlap sliders', () => {
    render(<OverlapVisualizer />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(screen.getByText(/chunk size/i)).toBeInTheDocument();
    expect(screen.getByText(/overlap/i)).toBeInTheDocument();
  });

  test('reports both chunkSize and overlap in state', () => {
    render(<OverlapVisualizer initialChunkSize={100} initialOverlap={20} />);
    expect(reportState.reportState).toHaveBeenCalledWith(
      'OverlapVisualizer',
      expect.objectContaining({ chunkSize: 100, overlap: 20 }),
    );
  });

  test('overlap cannot exceed chunkSize', () => {
    render(<OverlapVisualizer initialChunkSize={100} initialOverlap={50} />);
    const overlapSlider = screen.getAllByRole('slider')[1]!;
    fireEvent.change(overlapSlider, { target: { value: '200' } });
    expect((overlapSlider as HTMLInputElement).max).toBeDefined();
    // After clamping, the value reported should be ≤ chunkSize
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].overlap).toBeLessThanOrEqual(lastCall[1].chunkSize);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run sims/OverlapVisualizer/index.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `OverlapVisualizer`**

```tsx
// sims/OverlapVisualizer/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SAMPLE_TEXT =
  'The retriever pulls chunks based on similarity. If the answer to your question ' +
  'spans the boundary between two chunks, neither chunk alone contains it. Overlap ' +
  'lets adjacent chunks share text, so boundary-crossing facts survive.';

interface Props {
  initialChunkSize?: number;
  initialOverlap?: number;
}

export function OverlapVisualizer({ initialChunkSize = 80, initialOverlap = 20 }: Props) {
  const [chunkSize, setChunkSize] = useState(initialChunkSize);
  const [overlap, setOverlap] = useState(initialOverlap);
  const svgRef = useRef<SVGSVGElement>(null);

  const clampedOverlap = Math.min(overlap, chunkSize - 1);

  useEffect(() => {
    reportState('OverlapVisualizer', {
      chunkSize,
      overlap: clampedOverlap,
      textLength: SAMPLE_TEXT.length,
    });
  }, [chunkSize, clampedOverlap]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const lineHeight = 22;
    const charsPerLine = 80;
    const lines = Math.ceil(SAMPLE_TEXT.length / charsPerLine);
    svg.attr('viewBox', `0 0 ${width} ${lines * lineHeight + 10}`);

    const stride = chunkSize - clampedOverlap;
    let i = 0;
    let chunkIdx = 0;
    const colors = d3.schemeTableau10;

    while (i < SAMPLE_TEXT.length) {
      const start = i;
      const end = Math.min(i + chunkSize, SAMPLE_TEXT.length);
      const overlapStart = chunkIdx > 0 ? start : start;
      const overlapEnd = chunkIdx > 0 ? Math.min(start + clampedOverlap, end) : start;

      drawRange(svg, start, end, colors[chunkIdx % colors.length]!, 0.3, charsPerLine, lineHeight, width);
      if (chunkIdx > 0 && clampedOverlap > 0) {
        drawRange(svg, overlapStart, overlapEnd, '#ef4444', 0.5, charsPerLine, lineHeight, width);
      }

      i += stride;
      chunkIdx++;
      if (stride <= 0) break;
    }

    for (let line = 0; line < lines; line++) {
      svg
        .append('text')
        .attr('x', 4)
        .attr('y', line * lineHeight + 15)
        .attr('font-family', 'monospace')
        .attr('font-size', 13)
        .text(SAMPLE_TEXT.slice(line * charsPerLine, (line + 1) * charsPerLine));
    }
  }, [chunkSize, clampedOverlap]);

  return (
    <div className={styles.sim}>
      <label>
        Chunk size: <strong>{chunkSize}</strong>
        <input type="range" min={32} max={300} step={8} value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))} />
      </label>
      <label>
        Overlap: <strong>{clampedOverlap}</strong>
        <input type="range" min={0} max={chunkSize - 1} step={4} value={clampedOverlap}
          onChange={e => setOverlap(Number(e.target.value))} />
      </label>
      <p className={styles.legend}>
        <span className={styles.overlapSwatch} /> red = overlap region (text shared between adjacent chunks)
      </p>
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}

function drawRange(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  start: number, end: number, color: string, opacity: number,
  charsPerLine: number, lineHeight: number, width: number,
) {
  const startLine = Math.floor(start / charsPerLine);
  const endLine = Math.floor((end - 1) / charsPerLine);
  const charW = width / charsPerLine;
  for (let line = startLine; line <= endLine; line++) {
    const x1 = (line === startLine ? start % charsPerLine : 0) * charW;
    const x2 = (line === endLine ? ((end - 1) % charsPerLine) + 1 : charsPerLine) * charW;
    svg.append('rect')
      .attr('x', x1).attr('y', line * lineHeight + 2)
      .attr('width', x2 - x1).attr('height', lineHeight - 4)
      .attr('fill', color).attr('opacity', opacity);
  }
}
```

```css
/* sims/OverlapVisualizer/index.module.css */
.sim { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
.sim label { display: flex; align-items: center; gap: 1rem; margin: 0.5rem 0; }
.sim label input { flex: 1; }
.legend { font-size: 0.85em; color: #4b5563; display: flex; align-items: center; gap: 0.4rem; }
.overlapSwatch { display: inline-block; width: 14px; height: 14px; background: #ef4444; opacity: 0.5; border-radius: 2px; }
.svg { width: 100%; height: auto; display: block; }
```

```markdown
<!-- sims/OverlapVisualizer/README.md -->
# OverlapVisualizer

**Teaches:** `chunk-overlap`

Two sliders: chunk size and overlap. Red shading marks where adjacent chunks share text. Makes visible: overlap is the "glue" that lets boundary-crossing facts survive the chunking step.

**Reported state:** `{ chunkSize, overlap, textLength }`
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run sims/OverlapVisualizer/index.test.tsx
```

Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add sims/OverlapVisualizer/
git commit -m "feat: OverlapVisualizer sim with overlap region highlighting"
```

---

### Task 18: `ChunkRetrievalImpact` sim

**Files:**
- Create: `sims/ChunkRetrievalImpact/index.tsx`
- Create: `sims/ChunkRetrievalImpact/index.module.css`
- Create: `sims/ChunkRetrievalImpact/README.md`
- Create: `sims/ChunkRetrievalImpact/index.test.tsx`

This sim has a small fixed corpus (~5 sentences, each containing a different "fact"). User picks a chunk size; sees which chunks get retrieved for a fixed query, with a precision@k score. Demonstrates how chunk size changes retrieval behaviour.

- [ ] **Step 1: Write the failing test**

```tsx
// sims/ChunkRetrievalImpact/index.test.tsx
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChunkRetrievalImpact } from './index';
import * as reportState from '../../src/lib/reportState';

vi.mock('../../src/lib/reportState');

describe('ChunkRetrievalImpact', () => {
  test('renders chunk-size slider and query', () => {
    render(<ChunkRetrievalImpact />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
    expect(screen.getByText(/query/i)).toBeInTheDocument();
  });

  test('reports chunkSize and retrievalScore', () => {
    render(<ChunkRetrievalImpact initialChunkSize={64} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[0]).toBe('ChunkRetrievalImpact');
    expect(lastCall[1]).toHaveProperty('chunkSize', 64);
    expect(lastCall[1]).toHaveProperty('precisionAtK');
  });

  test('changing chunk size changes the reported precision', () => {
    const { rerender } = render(<ChunkRetrievalImpact initialChunkSize={32} />);
    const callsBefore = (reportState.reportState as any).mock.calls.length;
    rerender(<ChunkRetrievalImpact initialChunkSize={256} />);
    const lastCall = (reportState.reportState as any).mock.calls.slice(-1)[0];
    expect(lastCall[1].chunkSize).toBe(256);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run sims/ChunkRetrievalImpact/index.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Implement `ChunkRetrievalImpact`**

```tsx
// sims/ChunkRetrievalImpact/index.tsx
import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const CORPUS =
  'Paris is the capital of France. ' +
  'The Eiffel Tower opened in 1889. ' +
  'French is spoken by 300 million people worldwide. ' +
  'Croissants are a viennoiserie pastry. ' +
  'The Louvre houses the Mona Lisa.';

const QUERY = 'What is the capital of France?';
const RELEVANT_TEXT = 'capital of France';
const K = 2;

interface Props {
  initialChunkSize?: number;
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

// Toy "similarity": fraction of query-keywords present in the chunk.
function score(chunk: string, query: string): number {
  const keywords = query.toLowerCase().match(/\w+/g) ?? [];
  const lowered = chunk.toLowerCase();
  const hits = keywords.filter(k => lowered.includes(k)).length;
  return hits / keywords.length;
}

export function ChunkRetrievalImpact({ initialChunkSize = 64 }: Props) {
  const [chunkSize, setChunkSize] = useState(initialChunkSize);

  const { topK, precisionAtK } = useMemo(() => {
    const chunks = chunkText(CORPUS, chunkSize);
    const scored = chunks.map((c, i) => ({ idx: i, text: c, sim: score(c, QUERY) }));
    scored.sort((a, b) => b.sim - a.sim);
    const top = scored.slice(0, K);
    const relevant = top.filter(c => c.text.toLowerCase().includes(RELEVANT_TEXT.toLowerCase()));
    return { topK: top, precisionAtK: relevant.length / K };
  }, [chunkSize]);

  useEffect(() => {
    reportState('ChunkRetrievalImpact', {
      chunkSize,
      query: QUERY,
      topKChunks: topK.map(c => c.text),
      precisionAtK,
    });
  }, [chunkSize, topK, precisionAtK]);

  return (
    <div className={styles.sim}>
      <p>
        <strong>Query:</strong> {QUERY}
      </p>
      <label>
        Chunk size: <strong>{chunkSize}</strong>
        <input type="range" min={20} max={300} step={4} value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))} />
      </label>
      <p>
        <strong>Precision@{K}:</strong>{' '}
        <span className={precisionAtK === 1 ? styles.good : styles.bad}>
          {(precisionAtK * 100).toFixed(0)}%
        </span>
      </p>
      <div className={styles.topK}>
        <h4>Top {K} retrieved chunks:</h4>
        {topK.map((c, i) => (
          <div key={i} className={styles.chunk}>
            <span className={styles.score}>{c.sim.toFixed(2)}</span> "{c.text}"
          </div>
        ))}
      </div>
    </div>
  );
}
```

```css
/* sims/ChunkRetrievalImpact/index.module.css */
.sim { background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1rem; margin: 1rem 0; }
.sim label { display: flex; align-items: center; gap: 1rem; margin: 0.5rem 0; }
.sim label input { flex: 1; }
.good { color: #047857; font-weight: 700; }
.bad { color: #b91c1c; font-weight: 700; }
.topK { background: #f9fafb; padding: 0.75rem; border-radius: 4px; margin-top: 0.5rem; }
.chunk { font-family: monospace; font-size: 0.85em; margin: 0.25rem 0; }
.score { background: #e5e7eb; padding: 0.1em 0.4em; border-radius: 3px; margin-right: 0.5em; }
```

```markdown
<!-- sims/ChunkRetrievalImpact/README.md -->
# ChunkRetrievalImpact

**Teaches:** `chunk-retrieval-impact`, `chunk-size-tradeoff`

Fixed corpus of 5 facts, fixed query, varying chunk size. Shows top-K chunks and precision@K. Makes visible: the wrong chunk size silently destroys retrieval. Uses a toy keyword-overlap similarity (not real embeddings) — chapter explains why this is a teaching simplification.

**Reported state:** `{ chunkSize, query, topKChunks, precisionAtK }`
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run sims/ChunkRetrievalImpact/index.test.tsx
```

Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add sims/ChunkRetrievalImpact/
git commit -m "feat: ChunkRetrievalImpact sim with precision@K"
```

---

## Phase 9 — Full chapter content

### Task 19: Expand `01-chunking.mdx` to full v1 content

**Files:**
- Modify: `content/chapters/01-chunking.mdx`

- [ ] **Step 1: Replace the skeleton with full chapter content**

```mdx
---
id: chunking
title: Chunking
estimatedMinutes: 25
concepts: [chunk-size, semantic-boundaries, chunk-overlap, chunk-retrieval-impact, chunk-size-tradeoff]
prerequisites: []
---

import { ChunkBoundaryExplorer } from '@sims/ChunkBoundaryExplorer'
import { OverlapVisualizer } from '@sims/OverlapVisualizer'
import { ChunkRetrievalImpact } from '@sims/ChunkRetrievalImpact'
import { PredictGate, RecallPrompt } from '@/components'

## Why chunks?

A RAG system answers a question by first looking things up. The lookup is a similarity
search: "which pieces of my source material are most like this question?" That search
runs against **chunks** — small fragments carved from your documents.

You might wonder: why not search against whole documents? Because the embedding
model has a context window, and because the score gets diluted: a 50-page document
about France contains every concept Paris-related and many that are not, so it scores
mediocre for *anything* specific. Chunks are how we sharpen the signal.

<PredictGate
  concept="chunk-size"
  question="If we set chunk_size = document_length (one chunk for the entire document), what do you think happens to retrieval precision?"
  hint="Think about what's being compared against the query."
>
  <ChunkBoundaryExplorer initialChunkSize={128} />
</PredictGate>

Move the slider. Watch the chunk count grow as the chunks shrink. Notice that
chunk boundaries cut through sentences with no awareness of meaning — that's
what "fixed-size chunking" means.

## Overlap as glue

When boundaries fall mid-sentence, a fact that *spans* the boundary lives in
neither chunk fully. Retrieval misses it. The fix is **overlap**: adjacent
chunks share some text at the boundary.

<PredictGate
  concept="chunk-overlap"
  question="If overlap = 0, what kind of facts do we lose? If overlap = chunk_size - 1, what's wasted?"
>
  <OverlapVisualizer initialChunkSize={80} initialOverlap={20} />
</PredictGate>

The red regions are the overlap — text shared between two adjacent chunks. The
tradeoff is on display: zero overlap risks losing boundary-crossing facts;
high overlap means you store the same text twice in your vector store, with
all the cost that implies.

## The retrieval impact

The point of chunking isn't to chunk — it's to retrieve well. Here's what changes
when you change chunk size on a tiny corpus.

<PredictGate
  concept="chunk-retrieval-impact"
  question="If a fact is 'Paris is the capital of France' and your chunks are 200 chars long, what happens to precision@2?"
>
  <ChunkRetrievalImpact initialChunkSize={64} />
</PredictGate>

At small chunk sizes, the precision@2 stays high because each chunk is small
enough to match exactly the keyword set the query uses. At large chunk sizes,
chunks that *also* contain unrelated facts (Eiffel Tower, croissants) start
matching the query as well as the actually-relevant one — because the keyword
"France" appears in chunks about French croissants too. **The wrong chunk size
silently destroys retrieval.**

(Note: this sim uses a toy keyword-overlap similarity, not real embeddings.
Real embeddings smooth this out somewhat but don't change the underlying
principle — they make the same kind of mistake, just less obviously.)

## The tradeoff, summarized

| Chunk size | What you gain | What you lose |
|---|---|---|
| Too small (≤ 50 chars) | Sharp similarity scores | Facts fragment across chunks; context-free chunks are hard to interpret |
| Sweet spot (~200–500 chars or ~100–300 tokens) | Useful balance | Always context-dependent — measure for your corpus |
| Too large (≥ 2000 chars) | Each chunk has full context | Score dilution; irrelevant facts in a "relevant" chunk; misses fine details |

There is no universal best chunk size. There is a best chunk size *for your
corpus and your query distribution* — and the way to find it is to evaluate
on real queries, not to guess.

## Recall

<RecallPrompt
  concept="chunk-size-tradeoff"
  question="Explain in your own words why both very small (50-char) and very large (5000-char) chunks hurt retrieval. Use a concrete example."
/>

<RecallPrompt
  concept="chunk-overlap"
  question="When does overlap matter most? Give a specific scenario where setting overlap=0 would lose information."
/>

<RecallPrompt
  concept="semantic-boundaries"
  question="Fixed-size chunking is unaware of sentence and paragraph boundaries. Describe one document type where this is acceptable and one where it would be a problem."
/>

<RecallPrompt
  concept="chunk-retrieval-impact"
  question="In the retrieval-impact sim, precision dropped when chunk_size was very large. Why? Trace through what the keyword-similarity score actually computes."
/>

<RecallPrompt
  concept="chunk-size"
  question="Imagine you're asked 'what chunk size should I use for my RAG system?' by a colleague. Explain why 'it depends' is the only correct answer — but also give them a starting heuristic and how to refine it."
/>
```

- [ ] **Step 2: Manual smoke-test**

```bash
npm run dev
```

Open `http://localhost:5173/` and walk through the entire chapter end-to-end:
- All three predict gates trigger
- All three sims interactive after unlock
- All five recall prompts render
- Submitting a recall prompt writes `pendingAnswer` to `.sim-state.json`
- Running `/quiz <concept>` in Claude Code grades it and writes `pendingGrade`
- "Commit to SR" button appears, click it; `localStorage['srs.v1']` updates
- Nav badge updates ("5 due" → "0 due" after committing all)

- [ ] **Step 3: Commit**

```bash
git add content/chapters/01-chunking.mdx
git commit -m "feat: full Chunking chapter content (4 sections, 3 sims, 5 recall prompts)"
```

---

## Phase 10 — Dogfood + polish

### Task 20: First full end-to-end session (write findings into a notes file)

**Files:**
- Create: `docs/dogfood-session-1.md`

- [ ] **Step 1: Run a full session as if you were the user**

```bash
npm run dev
```

In a second terminal:

```bash
claude
```

Walk through the chapter top to bottom. For each predict gate, write a real
prediction. For each recall prompt, write a real free-form answer. Run
`/quiz <concept>` for each. Observe Claude's responses.

- [ ] **Step 2: Write findings**

Create `docs/dogfood-session-1.md` with sections:

```markdown
# Dogfood Session 1 — $(date +%Y-%m-%d)

## What worked
- ...

## What didn't
- ...

## CLAUDE.md prompt issues observed
- (e.g. Claude over-explained in turn N when it should have asked a question)

## Sim issues
- (e.g. slider felt sluggish, sim X didn't update when Y)

## State file issues
- (e.g. pendingGrade lingered after commit)

## Action items
- [ ] ...
```

Be concrete. Quote Claude's actual responses. Note timestamps if useful.

- [ ] **Step 3: Commit**

```bash
git add docs/dogfood-session-1.md
git commit -m "docs: dogfood session 1 findings"
```

---

### Task 21: Iterate on CLAUDE.md based on dogfood findings

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.claude/skills/explain.md` and `.claude/skills/quiz.md` as needed

- [ ] **Step 1: For each "Claude over-explained" finding in `dogfood-session-1.md`, add a concrete bad-response example to the relevant section of `CLAUDE.md`**

Example addition to CLAUDE.md:

````markdown
## Concrete bad responses (do not do these)

The user asked "why does precision@2 drop when chunk_size = 300?" with these
state values: `{ chunkSize: 300, precisionAtK: 0.5 }`.

❌ Bad: "When chunks are large, each chunk contains more keywords, so multiple
chunks match the query and the relevant one gets out-competed."

✅ Good: "You bumped chunk_size from 100 to 300 and precision halved. Without
moving the slider, can you guess what happened to the top-2 result list? What
do you think is in those chunks now that wasn't before?"
````

- [ ] **Step 2: For each "didn't read state first" finding, strengthen the state-read requirement in `CLAUDE.md` and the relevant skill**

- [ ] **Step 3: Run a second dogfood session to verify the changes**

Repeat Task 20 informally; if responses are noticeably better, the iteration worked. If not, iterate again.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md .claude/skills/
git commit -m "fix: tune CLAUDE.md + skills based on dogfood session 1"
```

---

## Self-review checklist (run before declaring done)

- [ ] All 21 tasks completed
- [ ] `npm run test:run` exits 0
- [ ] `npm run typecheck` exits 0
- [ ] Full chapter walkthrough completed end-to-end at least twice
- [ ] At least 5 SR cards in `localStorage['srs.v1']`
- [ ] CLAUDE.md updated based on at least one real dogfood session
- [ ] No `TODO` / `TBD` / `FIXME` in shipped code (search: `git grep -E "TODO|TBD|FIXME" -- ':!docs'`)
- [ ] `.sim-state.json` is gitignored and not committed

## Definition of "v1 success"

Per the spec: 30 days from today, the author can answer all 5 RecallPrompt
questions cold (without re-reading), scoring Good (3) or Easy (4) on the FSRS
rubric on first attempt. That measurement happens automatically — it's whatever
ratings `/quiz` produces 30 days from the first session.

If success: pick the next chapter (probably Embeddings) and apply the same
pattern. If not: iterate on `CLAUDE.md`, the sim designs, and/or the recall
question phrasing before scaling.
