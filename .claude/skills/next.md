---
name: next
description: Suggest the next concept to study, respecting prerequisites and SR interleaving.
---

# /next

## Procedure

1. Read `content/learning-graph.json`.
2. Ask the user for their `localStorage` SR state (or check `.sim-state.json` if you've cached it).
3. Compute:
   - **Completed concepts**: those with an SR card.
   - **Due reviews**: SR cards where `dueAt <= now`.
   - **Ready-to-study concepts**: concepts with all prerequisites completed AND no SR card yet.

4. Decision:
   - If due reviews ≥ 3: suggest `/review` first. ("You have 4 reviews due. Knock those out before adding new material.")
   - Else, with probability ~60% pick a ready-to-study concept; ~40% pick a due review. Interleaving matters.
   - If nothing is ready (all prereqs not yet met), surface the prerequisite chain.

5. Tell the user the concept name, the chapter/section to open, and a one-sentence "why this next."

## Example output

> "Next: **chunk-overlap** (Chapter 1, section 'Overlap as glue'). You've completed chunk-size, which is the only prerequisite. After this you'll be ready for the retrieval-impact section."
