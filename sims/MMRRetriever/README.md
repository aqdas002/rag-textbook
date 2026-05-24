# MMRRetriever

**Teaches:** `mmr`, `relevance-diversity-tradeoff`

Interactive simulation demonstrating Maximal Marginal Relevance (MMR) retrieval. A lambda slider (0–1) controls the relevance-diversity trade-off. A side panel shows the vanilla top-3 for comparison, and a note counts how many MMR-selected docs differ from vanilla.

## MMR formula

```
score_i = λ * sim(d_i, q) - (1 - λ) * max_{d_j ∈ selected} sim(d_i, d_j)
```

- λ = 1 → pure relevance (identical to top-K)
- λ = 0 → pure diversity

## State reported

```ts
reportState('MMRRetriever', {
  lambda: number,
  query: string,
  mmrSelected: Array<{ doc: string; score: number }>,
  vanillaTopK: Array<{ doc: string; score: number }>,
  divergenceCount: number,
});
```
