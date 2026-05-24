# AgenticRetrievalLoop

Teaches: `react-loop`, `query-decomposition`, `multi-step-retrieval`, `agent-cost-explosion`

## What it shows

A side-by-side visualization of Vanilla RAG (single retrieval + synthesis) vs Agentic RAG
(ReAct-style think→act→observe loop). Three pre-loaded queries illustrate distinct failure modes:

| Query | Vanilla | Agentic | Steps | Cost multiplier |
|-------|---------|---------|-------|-----------------|
| Decomposition (Anthropic vs OpenAI funding diff) | Fails | Succeeds | 4 | 4× |
| Refinement (v2.1 auth release blockers) | Fails | Succeeds | 8 | ~26× |
| Simple (CEO of Anthropic) | **Succeeds** | Succeeds | 3 | 3× |

The third query deliberately demonstrates the planning tax: agentic systems don't know in
advance whether looping is needed, so they always pay overhead even on trivially simple queries.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialQueryIndex` | `0 \| 1 \| 2` | `0` | Which query is pre-selected on mount |

## reportState payload

```ts
{
  activeQuery: number,        // index of selected query
  vanillaSuccess: boolean,    // did vanilla RAG answer correctly?
  agentSteps: number,         // total agent steps for this query
  agentRetrievals: number,    // total retrievals in the agent loop
  agenticCostUSD: number,     // estimated cost at $0.003/LLM + $0.0001/retrieval
  vanillaCostUSD: number,     // always $0.003 (1 LLM call)
}
```

## Cost model

- LLM call: $0.003 (Claude Sonnet pricing, approximate)
- Retrieval: $0.0001
- Vanilla RAG baseline: $0.003 (1 LLM call + 1 retrieval)

## Files

- `index.tsx` — component
- `index.module.css` — scoped styles
- `index.test.tsx` — 3 Vitest tests
