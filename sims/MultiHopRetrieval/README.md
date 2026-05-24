# MultiHopRetrieval

**Chapter:** GraphRAG  
**Teaches:** `knowledge-graph`, `multi-hop-questions`, `graph-traversal-retrieval`

## What it shows

A side-by-side interactive visualization contrasting how vanilla similarity-based RAG and GraphRAG handle multi-hop questions.

**Left panel:** A D3 force-directed knowledge graph of 14 nodes (companies, people, events, products) and 13 directed labeled edges in the tech-industry domain. Active traversal path is highlighted in yellow.

**Right panel:** Query selector with 3 pre-loaded questions (1-hop, 2-hop, 3-hop) driving two retrieval columns:
- **Vanilla RAG** — top-5 chunks by toy cosine similarity (keyword overlap). Shows isolated facts.
- **GraphRAG** — ordered traversal path through the graph, assembled as a chain.

## Core pedagogical point

Vanilla similarity retrieval cannot answer questions that require chaining facts across documents. Each chunk contains one atomic fact; cosine similarity returns 5 isolated chunks. GraphRAG stores entities and relationships as a graph and traverses edges to assemble the full answer chain.

## Graph layout

Nodes are pre-seeded with `(seedX, seedY)` fractional positions and **fixed** (`fx`, `fy`) in the D3 simulation. This means the layout is 100% deterministic across renders — no random initialization, no force relaxation movement. The graph is visually arranged so company clusters are central, people fan out, and events/products are on the periphery.

## Queries

| Query | Hops | Vanilla answers? | GraphRAG answers? |
|-------|------|-----------------|-------------------|
| Who is the CEO of Meta? | 1 | Yes | Yes |
| Who runs the company that owns Instagram? | 2 | No | Yes |
| What did the leader of the company that acquired Instagram in 2012 say at their most recent earnings call? | 3 | No | Yes |

## Files

- `index.tsx` — React + D3 component
- `index.module.css` — styles
- `index.test.tsx` — 3 Vitest tests
- `README.md` — this file
