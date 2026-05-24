# HyDEvsRaw

**Chapter:** Query Transformation  
**Teaches:** `hyde`, `query-rewriting`

## What it shows

Side-by-side comparison of dense retrieval against a **raw query** vs. the same retrieval applied to an **LLM-generated hypothetical answer** (HyDE — Hypothetical Document Embeddings).

Dense retrieval embeds the query and finds chunks whose embeddings are nearest. But queries and answers often live in different parts of embedding space — questions and answers use different vocabulary. HyDE flips this: ask an LLM to write a *hypothetical answer* to the query, embed that answer, then retrieve. Documents matching the hypothetical answer are usually the real answer.

## Pre-loaded queries

| # | Query | HyDE outcome |
|---|-------|--------------|
| 0 | "Why is my Postgres query slow on a large join?" | Big win (rank 3 → 1) |
| 1 | "How do I reset my password?" | Modest win (rank 2 → 1) |
| 2 | "What is the warranty period for SKU XR-7700-B?" | No benefit (rank 1 → 1), but cost added |

Query 2 demonstrates that HyDE is not free: it always adds +400ms latency and +$0.001 per query for the extra LLM call, even when it provides no quality improvement.

## Files

- `index.tsx` — component
- `index.module.css` — styles
- `index.test.tsx` — 3 vitest tests

## reportState payload

```ts
reportState('HyDEvsRaw', {
  activeQuery: string,
  rawCorrectRank: number,
  hydeCorrectRank: number,
  qualityLift: number,        // rawCorrectRank - hydeCorrectRank; positive = HyDE helped
  hyDeAddedLatencyMs: 400,
  hyDeAddedCostUSD: 0.001,
});
```
