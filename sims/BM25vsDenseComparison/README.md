# BM25vsDenseComparison

Interactive three-column simulation for the **Hybrid Search** chapter.

## What it teaches

- `bm25` — BM25 keyword scoring: rare/exact tokens win
- `lexical-vs-semantic-retrieval` — why each method fails on certain query types
- `reciprocal-rank-fusion` — how RRF merges rankings without score normalisation
- `hybrid-search` — hybrid recovers most queries where either method alone fails

## Pedagogical point

BM25 and dense retrieval fail on complementary query types:

| Query type | BM25 | Dense |
|---|---|---|
| Rare identifiers, error codes, SKUs | Wins — high IDF on unique tokens | Often also wins (shared token) |
| Pure paraphrase (no shared vocabulary) | Fails — scores 0 | Wins — synonym expansion bridges the gap |
| Control (shared vocabulary) | Wins | Wins |

**Hybrid via RRF recovers the paraphrase queries** where BM25 scores 0 and would otherwise rank the correct doc last.

## Queries and corpus design

Five pre-loaded queries exercise distinct failure modes:

| # | Query | Correct doc | Favored |
|---|---|---|---|
| 1 | What does E_AUTH_4096 mean? | 0 | BM25 (rare identifier) |
| 2 | Tell me about SKU XR-7700-B | 2 | BM25 (product code) |
| 3 | How do I get my money back? | 9 | Dense (doc uses "Funds"/"returned"/"payment") |
| 4 | How do I get a brand-new login key? | 5 | Dense (doc uses "issuing"/"fresh"/"credential") |
| 5 | How do I rotate an API key? | 4 | Either (direct token overlap) |

## Implementation notes

**BM25** — standard Okapi BM25, k1=1.5, b=0.75, no stopword removal. IDF uses the "+1" smoothing variant.

**Dense** — bag-of-words cosine with stopword removal + query-side synonym expansion. The synonym map simulates the paraphrase bridging that real dense embeddings perform (e.g. "money" expands to "funds", "payment"; "login" expands to "authentication", "credential").

**RRF** — k=60 (Cormack et al. 2009). Only BM25 docs with score > 0 contribute to the BM25 ranking to avoid polluting the fusion with arbitrary orderings of zero-score documents.

## Files

- `index.tsx` — component
- `index.module.css` — styles
- `index.test.tsx` — 3 vitest tests
- `README.md` — this file
