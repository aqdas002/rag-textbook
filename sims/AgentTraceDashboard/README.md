# AgentTraceDashboard

Chapter 15 — Agent Evals

## Pedagogical goal

Evaluating an agent is not the same as evaluating a single LLM response. The trace matters: did the agent pick the right tools? Did it loop unnecessarily? Was the cost in line with expectations? Did it hit the step limit? A summary dashboard over a set of traces surfaces these signals; per-trace drill-down lets you find the specific failures driving aggregate numbers.

## What it teaches

- `agent-trace-evals` — how to structure an evaluation dataset of agent traces
- `agent-success-rate` — success rate as a top-level signal
- `tool-use-diversity` — distinct tools called vs total available
- `cost-outlier-detection` — p99 cost as an outlier alarm (the step-limit trace costs ~7x the median)

## Dataset

8 hardcoded traces:

| ID | Query | Outcome | Steps | Cost |
|----|-------|---------|-------|------|
| trace-001 | Weather in Tokyo | success | 2 | $0.008 |
| trace-002 | Cheapest flight to Paris | success | 5 | $0.032 |
| trace-003 | Compare Anthropic/OpenAI funding | success | 4 | $0.028 |
| trace-004 | Book a team meeting | success | 3 | $0.018 |
| trace-005 | Summarize Q3 feedback | success | 6 | $0.045 |
| trace-006 | World Cup 2022 capital population | success | 4 | $0.025 |
| trace-007 | AUTH issues blocking v2.1 | step-limit | 12 | $0.18 |
| trace-008 | Compound interest calculation | wrong answer | 3 | $0.012 |

- Success rate: 75% (6/8)
- Median cost: ~$0.025
- p99 cost: $0.18 (the step-limit hit — ~7x median)
- Tool diversity: 7 distinct tools used

## UI regions

1. **Summary panel** — live-computed metrics over the filtered trace set
2. **Filter + sort controls** — outcome filter (All / Successes only / Failures only / Step-limit hits) and sort (cost, steps, trace ID)
3. **Trace list** — click any row to expand the full Thought–Action–Observation trace

## Files

- `index.tsx` — component
- `index.module.css` — styles
- `index.test.tsx` — 3 tests
