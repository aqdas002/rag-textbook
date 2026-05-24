# RerankerVisualizer

A two-column simulation showing how a cross-encoder reranker improves over a bi-encoder first stage in a two-stage retrieval pipeline.

The left column shows 10 documents ranked by a toy bag-of-words cosine similarity score (the bi-encoder Stage 1). The right column shows the top-K of those documents re-scored by a simulated cross-encoder that weights document relevance more heavily (Stage 2). The corpus is constructed so the most relevant document ("To remove permissions...") lacks the literal query word "revoke", causing the bi-encoder to under-rank it — the cross-encoder corrects this by promoting it into the top-3. A K slider (1–10, default 5) controls how many bi-encoder results are sent to the reranker. Each reranked row shows a rank-change arrow (↑/↓/→). A stats panel reports how many documents were promoted into the top-3 by the reranker.

## Reported state shape

```ts
reportState('RerankerVisualizer', {
  k: number,                          // current K slider value
  query: string,                      // fixed query string
  biEncoderTop: Array<{               // all 10 bi-encoder results
    text: string,
    score: number,
    rank: number,
  }>,
  reranked: Array<{                   // top-K cross-encoder results
    text: string,
    oldRank: number,                  // rank in bi-encoder
    newRank: number,                  // rank after reranking
    score: number,                    // cross-encoder score
  }>,
  promotedToTop3: number,             // docs with newRank <= 3 and oldRank > 3
})
```
