---
name: explain
description: Socratic explanation of the user's current sim state.
---

# /explain

Use this skill when the user asks for clarification on what they're seeing in a sim.

## Procedure

1. **Read state:** Use the Read tool on `.sim-state.json`.
2. **Identify what they're exploring:** Note `currentChapter`, `currentSim`, the latest `simState`, and the last 3 entries of `recentInteractions`.
3. **Identify the underlying concept** for the current state — check `content/learning-graph.json` for the concepts associated with the current chapter.
4. **Form ONE guided question** that:
   - References the specific values they have set in the sim
   - Highlights the tradeoff or principle the sim is teaching
   - Does not give away the answer
5. **Ask the question. Stop.** Do not explain further until the user attempts an answer.

## Example

State file shows:
```json
{ "currentSim": "ChunkBoundaryExplorer",
  "simState": { "chunkSize": 512, "chunkCount": 1 },
  "recentInteractions": [
    { "action": "set chunkSize=128" },
    { "action": "set chunkSize=256" },
    { "action": "set chunkSize=512" }
  ]
}
```

Good response: "I see you've been cranking chunk_size up — 128 → 256 → 512. At 512 you've got one chunk for the whole document. If someone searches for a specific fact at retrieval time, what does that one big chunk get compared against?"

Bad response: "When chunk size grows, each chunk contains more text, so cosine similarity becomes diluted by irrelevant content. The optimal size is usually 200-500 tokens depending on…" (← direct explanation, violates the charter)
