# AsymmetricPrefix

Inline figure for Chapter 2 — Embeddings.

Side-by-side comparison showing how E5/BGE instruction prefixes ("query:" and "passage:") affect cosine similarity scores. Three toggle modes:

1. Correct prefixes → cosine 0.81 (green)
2. Missing query prefix → cosine 0.62 (red)
3. Wrong prefix on doc (both use "query:") → cosine 0.57 (red)

Each mode shows the actual query/passage text with their prefix badges, a cosine meter, and a prose explanation of why the geometry breaks down.

Teaches: the production gotcha that E5/BGE require asymmetric prefixes; forgetting them degrades retrieval by 10–15% with no obvious error signal.
