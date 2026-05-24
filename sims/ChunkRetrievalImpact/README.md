# ChunkRetrievalImpact

**Teaches:** `chunk-retrieval-impact`, `chunk-size-tradeoff`

Fixed corpus of 5 facts, fixed query, varying chunk size. Shows top-K chunks and precision@K. Makes visible: the wrong chunk size silently destroys retrieval. Uses a toy keyword-overlap similarity (not real embeddings) — chapter explains why this is a teaching simplification.

**Reported state:** `{ chunkSize, query, topKChunks, precisionAtK }`
