# TwoStageRecallCurve

A D3 line chart simulation illustrating the recall@K tradeoff between dense-only retrieval and a two-stage pipeline (dense retrieval + cross-encoder reranking).

Two curves are plotted against K (1–20): a gray "Dense only" curve that asymptotes around 0.87, and an indigo "Bi-encoder + Rerank" curve that reaches recall much faster (notably at K=3–5, the production sweet spot marked with a dashed line). A latency budget slider (50–500ms, default 250ms) controls whether the two-stage pipeline (200ms total: 80ms dense + 120ms rerank) fits within budget. A latency table summarises the per-stage costs, and a status message tells the user whether reranking is feasible at their chosen budget.

## Reported state shape

```ts
reportState('TwoStageRecallCurve', {
  latencyBudget: number,   // current slider value in ms
  fits: boolean,           // latencyBudget >= 200ms
  denseOnlyAtK5: number,   // DENSE_ONLY_RECALL[4] — recall of dense-only at K=5
  withRerankAtK5: number,  // WITH_RERANK_RECALL[4] — recall with reranking at K=5
  recallLiftAtK5: number,  // withRerankAtK5 - denseOnlyAtK5 (>= 0.10)
})
```
