# CoTvsReAct

**Chapter 13 — ReAct (General)**

Teaches: `react-general`, `cot-vs-react`, `agent-stop-conditions`

## What it shows

Side-by-side comparison of Chain-of-Thought (CoT) prompting vs the ReAct pattern on three problems where CoT silently propagates errors that ReAct catches via external tool calls.

## Core pedagogical point

CoT asks the LLM to "think step by step" but all reasoning stays in the model's head — no external grounding. ReAct interleaves Thought → Action → Observation, letting the model verify intermediate state against real tools at each step. For problems with verifiable intermediate state (math, dates, lookups), ReAct catches errors that CoT silently propagates.

## Problems

| # | Label | CoT error | ReAct approach |
|---|-------|-----------|----------------|
| 1 | Jacket pricing | Adds percentages (35+15=50%) instead of applying sequentially | `calculator` verifies each multiplication step |
| 2 | 90-day trial | Off-by-one in manual day counting | `date_calculator` gives exact date |
| 3 | FIFA World Cup density | Hallucinated population density | `search` verifies each intermediate fact |

## Files

- `index.tsx` — main component
- `index.module.css` — styles
- `index.test.tsx` — 3 tests

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialProblemIndex` | `number` | `0` | Which of the 3 problems is shown on mount |

## State reported

```ts
reportState('CoTvsReAct', {
  activeProblem: number,       // 0–2
  cotCorrect: boolean,
  reactCorrect: boolean,
  cotSteps: number,
  reactSteps: number,
  reactToolCalls: number,
})
```
