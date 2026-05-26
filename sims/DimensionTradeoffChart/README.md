# DimensionTradeoffChart

Inline figure for Chapter 2 — Embeddings.

Interactive line chart showing relative retrieval quality vs. embedding dimension (256–3072). The curve climbs steeply through ~1024 dimensions then plateaus. Users click chart points or use the slider to select a dimension; a readout shows quality percentage and storage savings vs. the 3072-dim baseline.

Teaches: the Matryoshka principle — you can truncate dimensions aggressively with minimal quality loss, and going beyond 1024 dim rarely pays off for real RAG workloads.
