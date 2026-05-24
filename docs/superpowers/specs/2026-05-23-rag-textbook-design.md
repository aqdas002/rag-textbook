# Design — RAG Intelligent Textbook v1 (Chunking Chapter)

**Date:** 2026-05-23
**Status:** Approved (user delegated decision authority)
**Author:** Drafted with Claude Code, decisions taken under explicit delegation

## TL;DR

A locally-hosted interactive textbook that teaches RAG (Retrieval-Augmented Generation) by combining **D3-powered visual simulations** in the browser with **Claude Code in the terminal** as a Socratic tutor. The two halves communicate via a single JSON file on disk.

The product is optimized for one outcome: **retention**. Every interaction implements one or more of four learning-science principles (active recall, spaced repetition, prediction-first generation, Socratic elaboration). V1 ships one chapter — *Chunking* — end-to-end. If the format makes the author remember chunking 30+ days later, the design scales to the rest of the RAG curriculum.

## Goals

1. **Build a retention machine, not a textbook.** Every reading session reinforces long-term memory through active recall, spaced repetition, generation-before-revelation, and Socratic elaboration.
2. **Make abstract concepts visible.** Every RAG concept gets a manipulable D3 visualization. Intuition comes from playing, not reading.
3. **LLM-in-the-loop without API key friction.** Claude Code in the user's terminal is the LLM. The browser stays static.
4. **Prove the format before scaling.** One excellent chapter > five mediocre ones.

## Non-goals (v1)

- Public deployment. v1 is `npm run dev` + `claude` in terminal.
- User accounts, auth, multi-user. SR state lives in `localStorage`.
- More than one chapter of content.
- Live content refresh from arxiv/blogs. Curated, hand-written.
- Mobile / responsive polish. Desktop-first.
- Auto-grading without an LLM. If Claude Code is offline, quizzes fall back to self-grading.
- Real MCP server. The shared state file is sufficient.

## Audience & success criterion

**Primary user:** the author. Secondary: working software engineers willing to install Claude Code.

**Success criterion (outcome, not activity):**
> 30 days after **completing the Chunking chapter** (defined: read all 4 sections, made predictions for all 3 sims, submitted all 5 recall prompts at least once), the author can answer all 5 recall prompts cold (without re-reading), scoring **Good (3) or Easy (4)** on the FSRS rubric on first attempt.

**Activity metrics (necessary, not sufficient):**
- 1 chapter written
- 3 sims working
- 4 Claude Code skills working (`/explain`, `/quiz`, `/review`, `/next`)
- FSRS scheduling producing future-dated cards

If the activity ships but the 30-day recall fails, the *design* is wrong, not the *amount of content*.

## Architecture

Three components. One file is the bridge.

```
┌─────────────────┐         ┌────────────────┐         ┌─────────────────┐
│    Browser      │  POST   │ .sim-state.json│   Read  │  Claude Code    │
│  Vite + React   │ ──────► │ (project root) │ ◄────── │   (terminal)    │
│  MDX + D3 sims  │         │                │         │  CLAUDE.md +    │
└─────────────────┘         └────────────────┘         │  .claude/skills │
        ▲                          ▲                   └─────────────────┘
        │                          │                          │
        │              scripts/state-writer.cjs               │
        │              (localhost:5174, ~30 LOC)              │
        │                                                     │
        └─────────────────── reads ───────────────────────────┘
                       content/, sims/, learning-graph.json
                       (source files — browser reads, Claude reads,
                        author edits via Claude Code or editor)
```

### Why this shape

- **Browser owns visualization.** Humans build intuition by manipulating spatial things; browsers render spatial things well.
- **Terminal owns conversation.** Claude is best at adaptive dialogue; the terminal is its native habitat.
- **A JSON file is the bridge.** Simplest possible IPC. No protocol to learn. Both halves already speak JSON.

### Alternatives considered and rejected

- **Full MCP server:** more powerful (bidirectional, tool calls back into browser), but ~1 week of new tech for ~10% extra capability. v2 candidate if the state-file approach proves limiting.
- **In-browser LLM via API key:** violates user constraint, introduces cost/auth/abuse problems, forces a backend.
- **Pure terminal experience (text-only Claude):** loses dual-coding (Paivio); halves pedagogical effectiveness.

## Folder layout

```
ai-engg/
├── CLAUDE.md                    # Tutor persona + Socratic rules
├── README.md
├── package.json
├── vite.config.ts
├── index.html
├── .gitignore                   # ignores .sim-state.json
├── .sim-state.json              # written by browser, read by Claude
├── .claude/
│   └── skills/
│       ├── explain.md           # /explain — Socratic explanation of current state
│       ├── quiz.md              # /quiz   — free-form recall, Claude grades
│       ├── review.md            # /review — runs through due SR cards
│       └── next.md              # /next   — walks learning graph
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ChapterShell.tsx     # MDX layout, nav, due-count badge
│   │   ├── PredictGate.tsx      # wraps a sim; enforces predict-first
│   │   ├── RecallPrompt.tsx     # free-form quiz at chapter end
│   │   └── ReviewQueue.tsx      # SR review UI
│   └── lib/
│       ├── reportState.ts       # sims call this on every interaction
│       ├── srs.ts               # FSRS wrapper + localStorage
│       └── content.ts           # MDX loader + learning-graph walker
├── content/
│   ├── learning-graph.json
│   └── chapters/
│       └── 01-chunking.mdx
├── sims/
│   ├── ChunkBoundaryExplorer/
│   │   ├── index.tsx
│   │   └── README.md            # what this sim teaches
│   ├── OverlapVisualizer/
│   └── ChunkRetrievalImpact/
└── scripts/
    └── state-writer.cjs         # 30-line localhost POST sink
```

**Reasoning per directory:**

- `content/` vs `sims/` — separated because a sim is a *reusable* component; a chapter is the *narrative* using sims. `ChunkBoundaryExplorer` may be embedded in chapter 1 and revisited in chapter 4 for SR review.
- `.claude/skills/` at root — Claude Code's standard auto-discovery location.
- `scripts/state-writer.cjs` lives outside `src/` because it runs in Node, not the browser.

## Content model

### Chapter (MDX)

A chapter is one `.mdx` file. Frontmatter declares its place in the learning graph; the body interleaves prose and sims.

```mdx
---
id: chunking
title: Chunking
estimatedMinutes: 25
concepts: [chunk-size, chunk-overlap, semantic-boundaries, chunk-retrieval-impact]
prerequisites: []
---

import { ChunkBoundaryExplorer } from '@/sims/ChunkBoundaryExplorer'
import { PredictGate, RecallPrompt } from '@/components'

## Why chunks?

A short framing paragraph (100-200 words). Not a lecture — just enough to
make the sim meaningful.

<PredictGate
  concept="chunk-size"
  question="If we set chunk_size = document_length, what happens to retrieval precision?"
  hint="Think about what's being compared at retrieval time."
>
  <ChunkBoundaryExplorer initialSize={256} />
</PredictGate>

A short paragraph after the sim, weaving in what they observed.

[... more sections ...]

<RecallPrompt
  concept="chunk-size-tradeoff"
  question="Explain in your own words why both very small and very large chunks hurt retrieval. Use a concrete example."
/>
```

**Why MDX (not Markdown + sidecar React files):**

- Single source of truth per chapter; narrative and interactivity literally interleaved.
- Prose stays in friction-free Markdown.
- React is needed anyway for the sims; MDX is the standard way to embed it.

### Learning graph

`content/learning-graph.json`:

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
    "chunk-overlap": {
      "title": "Chunk overlap",
      "prerequisites": ["chunk-size"],
      "chapter": "chunking",
      "section": "overlap-strategies"
    }
  }
}
```

Drives:

- `/next` recommendations — what concept is ready to study (all prereqs complete + not recently studied).
- Prerequisite-aware Socratic prompting — Claude can say "you haven't studied X yet; let's back up."
- SR interleaving — `/review` mixes new-concept cards with prereq refresh cards.

## Sim contract

Every sim is a React component with this interface:

```ts
interface SimProps {
  initialState?: Record<string, unknown>
}

// Sim metadata lives in sims/<id>/README.md frontmatter (for docs)
// and is implicitly tied to the directory name as the sim id.
```

The sim:

1. Renders normally. Calls `reportState(simId, currentState)` on every meaningful state change.
2. Does **not** know about `PredictGate`, the learning graph, or Claude. It is a pure visualization with internal state.
3. State shape is sim-specific; we don't try to normalize. Claude reads it raw.

### `reportState` contract

```ts
// src/lib/reportState.ts
export function reportState(
  simId: string,
  state: Record<string, unknown>
): void
```

- Debounced 250ms.
- POSTs `{ simId, state, ts }` to `http://localhost:5174/state`.
- Silently no-ops on network error (state-writer not running is non-fatal).

### Predict-first wrapping

`<PredictGate>` is a **separate component** that *wraps* a sim. It is not part of the sim itself. Reasons:

- Reusable sims in non-predict contexts (e.g., SR review).
- Per-chapter prediction prompts without rebuilding the sim.
- A/B-testable later.

Behavior:

1. Renders the wrapped sim behind a translucent overlay; interactions disabled.
2. Shows `question` and a textarea labelled "Your prediction (it's OK to be wrong)."
3. On submit: stores prediction in component state + sends to state-writer; unlocks the sim.
4. After unlock, prediction stays visible above the sim alongside actual behavior.

### Why D3 (not three.js / canvas / p5)

- RAG visualizations are 2D data: intervals (chunks), scatter plots (embedding projections), top-k highlights (retrieval).
- D3 has the deepest community knowledge for these primitives.
- SVG is inspectable (DevTools), accessible (screen readers), scalable.
- three.js for 3D embedding views actively misleads — embedding spaces are >>3D, and a 3D projection suggests false structure.
- p5.js (the dmccreary stack) is procedural-animation-first; we want stateful-data-display-first.

## Shared state file

`.sim-state.json` schema:

```json
{
  "version": 1,
  "lastUpdated": "2026-05-23T14:32:11.000Z",
  "currentChapter": "chunking",
  "currentSim": "ChunkBoundaryExplorer",
  "prediction": "Big chunks will have lower precision because they contain irrelevant text.",
  "simState": {
    "chunkSize": 512,
    "overlap": 64,
    "lastQuery": "What is the capital of France?",
    "retrievedChunkIds": [3, 7, 12],
    "retrievalScores": [0.87, 0.82, 0.71]
  },
  "recentInteractions": [
    { "ts": "2026-05-23T14:31:45.000Z", "action": "set chunkSize=512", "previous": 256 }
  ]
}
```

**Conventions:**

- **Two writers, one reader at a time.** Browser writes most fields (via state-writer.cjs). Claude writes only `pendingGrade` (via the Write tool). The two never write the same field. Reads are unsynchronized; stale snapshots are acceptable.
- **Atomic writes** by `state-writer.cjs`: write to `.sim-state.json.tmp`, then `rename()`. Claude's writes via the Write tool are atomic at the filesystem level on POSIX.
- **`recentInteractions`** is a ring buffer (cap 20). Lets Claude detect patterns ("you've increased chunkSize 4 times — what are you trying to make happen?").
- **Gitignored.** Runtime state, not source.

### `state-writer.cjs` (sketch)

```js
// scripts/state-writer.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', '.sim-state.json');
const PORT = 5174;

http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/state') {
    res.writeHead(404); res.end(); return;
  }
  // CORS for localhost browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const incoming = JSON.parse(body);
      const tmp = STATE_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify({
        version: 1,
        lastUpdated: new Date().toISOString(),
        ...incoming
      }, null, 2));
      fs.renameSync(tmp, STATE_FILE);
      res.writeHead(204); res.end();
    } catch (e) {
      res.writeHead(400); res.end(String(e));
    }
  });
}).listen(PORT, '127.0.0.1');
```

Run alongside Vite via `concurrently`:

```json
// package.json scripts
"dev": "concurrently \"vite\" \"node scripts/state-writer.cjs\""
```

## Claude integration

### `CLAUDE.md` (the tutor charter)

The file Claude Code auto-loads. Defines:

1. **Persona.** "You are a Socratic tutor for a working software engineer learning RAG. Your job is not to explain things — it is to make the user explain things."

2. **Hard rules:**
   - Never give a direct explanation until the user has attempted to answer (or explicitly opted out with "just tell me").
   - When the user asks "why does X work?", respond with a guided question that gets them halfway, then ask what they think.
   - Reference what they're literally doing in the sim, not generic knowledge.

3. **State-awareness instruction.** At the start of any tutoring exchange, read `.sim-state.json` first to ground the response.

4. **Learning-graph awareness.** Read `content/learning-graph.json` to know what concepts the user has covered and what prerequisites apply. If a question depends on a concept not yet covered, propose the prereq path before answering.

5. **SR awareness.** If `localStorage` (exported via `srs-export.json` if present) shows cards due, suggest `/review` at natural pause points.

### Skills (slash commands)

- **`/explain`** — reads sim state + recent interactions; produces a *guided* explanation grounded in what the user just did. Pseudocode in skill body: "Read .sim-state.json. Identify what the user is exploring. Ask one question that highlights the underlying tradeoff. Wait for their answer before elaborating."

- **`/quiz [concept?]`** — generates a free-form recall question (uses learning graph if no concept given; picks a due card from SR if available). User answers in terminal *or* has already submitted via `<RecallPrompt>` (in which case the answer is in `.sim-state.json`). Claude grades using a 3-criteria rubric (see Retention §) and reports an FSRS rating (1-4). The browser polls `.sim-state.json` for a `pendingGrade` field; when present, surfaces a rating prompt the user clicks to commit to `localStorage`.

- **`/review`** — reads SR queue (user pastes a snippet that prints due cards from localStorage). Walks user through each due card. Grades and feeds back ratings via the same button-click flow as `/quiz`.

- **`/next`** — reads `learning-graph.json` and `srs-export.json`; suggests next concept respecting prerequisites and SR interleaving (60% new, 40% review by default).

## Retention mechanics

### 1. Active recall — `<RecallPrompt>` + `/quiz`

- Every chapter ends in 3-5 `<RecallPrompt>` components, each tied to one concept.
- Free-form text answer required (textarea + Submit).
- On submit:
  - Answer written to `.sim-state.json` under `pendingAnswer`: `{ concept, question, answer, ts }`.
  - UI shows: "Run `/quiz` in your Claude Code terminal to grade this."
  - Claude reads the state, grades on a 3-criteria binary rubric (0–3 total) which maps deterministically to FSRS rating 1–4 (0→Again, 1→Hard, 2→Good, 3→Easy).
  - Claude writes the rating back to `.sim-state.json` under `pendingGrade` (the only place Claude writes; uses Write tool).
  - The browser polls `.sim-state.json` every 2 seconds while a `pendingAnswer` is outstanding; when `pendingGrade` appears, displays a confirmation card and a "Commit to SR" button. Click → `srs.ts` updates `localStorage`, clears both fields from state file via state-writer.

### 2. Spaced repetition — FSRS + `localStorage`

- Library: `ts-fsrs`.
- Storage: `localStorage['srs.v1']`, schema:

```json
{
  "version": 1,
  "cards": {
    "chunk-size-tradeoff": {
      "concept": "chunk-size-tradeoff",
      "prompt": "Explain in your own words why...",
      "dueAt": "2026-05-30T00:00:00Z",
      "fsrs": { "stability": 4.2, "difficulty": 5.1, "lastReview": "2026-05-23T14:00:00Z" }
    }
  }
}
```

- New card created when user first completes a `<RecallPrompt>`.
- Nav shows "{n} reviews due" badge on every page.
- `<ReviewQueue>` UI cycles through due cards in random order.
- Export/import via a settings page (`srs-export.json`) for backups and machine moves.

### 3. Prediction-first — `<PredictGate>`

- Every sim wrapped in `<PredictGate>` with concept + question + hint.
- Prediction is required before the sim becomes interactive.
- After the sim is unlocked, prediction is shown alongside actual behavior.
- Predictions are saved into `.sim-state.json` so Claude can reference them.

### 4. Socratic Claude — `CLAUDE.md` + skill prompts

- Hard rules in `CLAUDE.md` (see above).
- Each skill prompt repeats the relevant rule ("you MUST ask before telling").
- Default failure mode is over-explaining; we iterate the prompts after the first session of real use.

## Chunking chapter — content outline (v1)

| Section | Sim | Concept(s) taught | Predict-prompt theme |
|---|---|---|---|
| Why chunks? | `ChunkBoundaryExplorer` | chunk-size, semantic-boundaries | "What happens if chunk_size = document length?" |
| The retrieval impact | `ChunkRetrievalImpact` | chunk-retrieval-impact | "Will doubling chunk size double precision?" |
| Overlap as glue | `OverlapVisualizer` | chunk-overlap | "What does overlap=0 lose?" |
| Recall prompts (5) | — | all of above | — |

Three sims, four sections, ~25 minutes estimated read time, 5 recall prompts that generate 5 SR cards.

## Tech stack (locked)

| Layer | Choice | Why over alternatives |
|---|---|---|
| Bundler | **Vite** | Fast HMR, first-class MDX, minimal config. Over Webpack (heavier) and Parcel (less mature MDX). |
| UI | **React 18 + TypeScript** | Locked by user. Pinned to 18 because MDX tooling is stablest there. |
| Content | **MDX (`@mdx-js/rollup`)** | Markdown + JSX in one file. Over remark-only (no JSX) and full React files (no Markdown friction-free authoring). |
| Visualization | **D3 v7 (SVG)** | See §Sim contract. Over three.js, canvas, p5.js. |
| State persistence | **`localStorage` + JSON export** | No backend, user owns data. Over IndexedDB (overkill) and a server DB (violates no-auth). |
| Spaced repetition | **`ts-fsrs`** | Modern successor to SM-2; Anki defaulted to FSRS in 2024. Over SM-2 (older) and homegrown (reinvents solved problem). |
| Bridge | **`.sim-state.json` + 30-line Node writer** | Smallest IPC that works. Over MCP server (overkill v1), HTTP polling (chatty), WebSocket (no upside here). |

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Sims take longer than expected to build | Build simplest first (1D chunk slider) to prove the whole pipeline. Add sims 2-3 incrementally. |
| Claude over-explains despite `CLAUDE.md` rules | Iterate after first real session. Add explicit "wrong response" examples in the prompt. |
| `localStorage` lost on browser data clear | Settings page exports/imports JSON. v1.1 syncs via state-writer if it becomes painful. |
| MDX + Vite tooling friction | Pin known-good versions of `@mdx-js/rollup` and `vite`. No exotic MDX plugins in v1. |
| Free-form quiz grading inconsistent | Skill rubric uses 3 hard criteria, each scored 0/1 → total 0–3 maps deterministically to FSRS rating 1–4 (0→Again, 1→Hard, 2→Good, 3→Easy). Acceptable if 80% consistent across re-runs of the same answer. |
| Author burnout writing one chapter | Hard cap: 4 weeks. If not done, ship as-is and analyze what was hard. |
| State file race condition (browser writes mid-Claude-read) | Atomic rename + version field. Stale reads are acceptable; last write wins. |

## Effort estimate

**2–4 weeks solo**, allocated roughly:

- Week 1: Scaffolding (Vite + MDX + state-writer + first sim + CLAUDE.md).
- Week 2: Three sims fully working, all with `<PredictGate>`.
- Week 3: Chapter prose written and polished; recall prompts + SR queue working.
- Week 4: Iteration on Claude prompts, end-to-end dogfooding, fix-it list.

If week 1 takes more than 7 days, the v1 scope is wrong — cut a sim before adding time.

## Out of scope (defer)

- Public deployment (Vercel / GitHub Pages)
- More chapters
- Live content refresh from arxiv/blogs
- Mobile responsiveness
- Sharing / collaboration features
- Analytics / telemetry
- Full MCP server
- In-browser LLM
- Images / video
- Code execution sandboxes (Python RAG)
- Multi-user SR sync

## Open questions (to resolve during implementation)

- Exact rubric wording for `/quiz` grading — needs to be calibrated against a few real answers.
- Optimal SR interleaving ratio for `/next` (60/40 is a guess).
- Whether `CLAUDE.md` rules should be different per skill or shared — iterate after first real-use session.
- Whether to add a "study session" mode that batches recall prompts at end of session vs. interleaved.

These are implementation-detail decisions; they don't change the architecture.
