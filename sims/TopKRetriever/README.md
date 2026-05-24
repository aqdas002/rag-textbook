# TopKRetriever

**Teaches:** `top-k-retrieval`

Interactive simulation showing how top-K retrieval works over a fixed corpus. A K slider (1–6) controls how many documents are returned. Similarity is computed with a toy bag-of-words cosine score. Top-K documents are highlighted with rank badges; all scores are shown for comparison.

## State reported

```ts
reportState('TopKRetriever', {
  k: number,
  query: string,
  topK: Array<{ doc: string; score: number; rank: number }>,
  allScores: Array<{ doc: string; score: number }>,
});
```
