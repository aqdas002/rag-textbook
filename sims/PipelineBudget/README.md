# PipelineBudget

**Chapter:** Production  
**Teaches:** `latency-budgets`, `cost-management`, `rag-caching`

## Pedagogical goal

Every feature you add to a RAG pipeline costs both latency and money. This sim lets readers build a pipeline by toggling stages, then see the resulting p50 latency and per-query cost in real time, plus a daily cost projection at a configurable QPS.

## Layout

Two-pane layout:

- **Left — pipeline configurator.** Each stage has an on/off checkbox and per-stage stats (latency ms, cost per query). Always-on stages (query embedding, LLM generation) are disabled. RRF shows a warning tooltip if either BM25 or Dense is off, and is treated as a no-op silently.
- **Right — output panel.** Three big numbers: p50 latency (colour-coded green/amber/red), per-query cost (4 dp), estimated daily cost. A QPS slider (1–100, default 10) drives the daily projection. A pipeline summary string and three preset buttons round out the panel.

## Stages

| Stage | Always on | Latency (ms) | Cost ($/query) |
|---|---|---|---|
| Query embedding | yes | 40 | 0.00002 |
| BM25 retrieval | no | 30 | 0.00001 |
| Dense vector search | no | 60 | 0.00001 |
| RRF merge | no (needs BM25 + Dense) | 5 | 0 |
| Cross-encoder rerank | no | 120 | 0.00200 |
| Agent loop | no | 4500 | 0.01500 |
| LLM answer generation | yes | 800 | 0.00400 |
| Query-result cache | no | 5 (hit) | 0 |

## Presets

- **Minimal RAG** — Dense + LLM, no cache.
- **Production default** — BM25 + Dense + RRF + Rerank + 50% cache hit rate.
- **Agentic + everything** — All stages + Agent loop.

## Math

```
effective_latency = (H/100) * 5 + (1 - H/100) * sum(enabled_non_cache_latencies)
effective_cost    = (H/100) * 0 + (1 - H/100) * sum(enabled_non_cache_costs)
daily_cost        = effective_cost * qps * 86400
```

where H is the cache hit rate percentage (0 when cache is off).

## reportState shape

```ts
reportState('PipelineBudget', {
  stagesEnabled: Record<string, boolean>,
  p50LatencyMs: number,
  perQueryCostUSD: number,
  qps: number,
  dailyCostUSD: number,
  cacheHitRate: number,   // 0 when cache is off
})
```
