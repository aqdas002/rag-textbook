# EncoderPipeline

Inline figure for Chapter 2 — Embeddings.

A horizontal flow diagram showing the four stages of text-to-embedding conversion: raw text input → BPE tokenizer → transformer encoder → output vector. Each stage is a clickable box; clicking expands a detail panel explaining what happens inside (token IDs, BPE merge rules for the tokenizer; attention + mean-pooling for the encoder; float array interpretation for the output).

Teaches: the concrete mechanics that prior chapter sections describe abstractly — what a tokenizer actually does, what "encoder" means operationally, and what an embedding vector physically is.
