# MetricsExplorer

**Chapter:** Evals  
**Teaches:** `precision-recall-at-k`, `mean-reciprocal-rank`, `ndcg`

## Pedagogical goal

Engineers routinely reach for the wrong retrieval metric. This sim makes the tradeoffs visceral: the user toggles relevance on individual ranked docs and watches Precision@K, Recall@K, MRR, AP@K, and nDCG@K update in real time.

## Default state

Docs at ranks 1, 3, 4, 8 are relevant (4 total). At K=5:

| Metric | Value |
|--------|-------|
| Precision@5 | 0.600 |
| Recall@5 | 0.750 |
| MRR | 1.000 |
| AP@5 | ~0.806 |
| nDCG@5 | ~0.754 |

## Metric definitions

- **Precision@K** = (relevant in top-K) / K
- **Recall@K** = (relevant in top-K) / (total relevant in full list)
- **MRR** = 1 / rank of first relevant doc (0 if none)
- **AP@K** = average of Precision@i for each position i ≤ K where doc i is relevant; denominator is number of relevant docs in top-K
- **nDCG@K** = DCG@K / IDCG@K using binary gain (1/0) and log₂(rank+1) discount

## Files

- `index.tsx` — component
- `index.module.css` — styles
- `index.test.tsx` — 4 Vitest tests
