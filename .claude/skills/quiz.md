---
name: quiz
description: Grade pending recall answers or generate a new recall question.
---

# /quiz [concept?]

## Two modes

### Mode A: Grade pending answers (most common)

When the user runs `/quiz [concept]`, read `.sim-state.json` and look at the **`pendingAnswers`** map (keys are concept ids).

- If the user passed a concept argument: grade only `pendingAnswers[<concept>]`.
- If the user passed no argument: grade **every** entry in `pendingAnswers`.

For each answer to grade:

1. Read `pendingAnswers[<concept>].question`, `.answer`, `.concept`.
2. Apply the grading rubric from CLAUDE.md (3 binary criteria → 0–3 total → 1–4 FSRS rating).
3. Post the grade to the state-writer endpoint — it merges per-concept, so other concepts are not disturbed:

   ```bash
   curl -s -X POST http://localhost:5174/state \
     -H 'Content-Type: application/json' \
     -d '{"pendingGrades":{"<concept>":{"concept":"<concept>","rating":3,"comment":"<one sentence>"}}}'
   ```

4. Tell the user, per graded item: `Graded <concept>: <rating-name> (<rating>/4) — <one-sentence comment>`. End with: "Click 'Commit to SR' on each in the browser to enqueue."

If the state-writer is offline, fall back to the Write tool: read the file, merge your new entries into `pendingGrades`, write the file back. Never clobber existing entries.

### Mode B: Generate a new question

If `pendingAnswers` is empty (or has no entry for the concept the user named), generate a new recall question:

1. Pick a concept (use the argument if given; else pick a due SR card by inspecting `content/learning-graph.json` × `localStorage['srs.v1']` — ask the user to paste their `srs.v1` JSON if needed).
2. Write a recall question that:
   - Requires the user to use their own words
   - Requires either a concrete example or a tradeoff articulation
   - Is answerable from the chapter content
3. Print the question. Tell the user to answer in the browser (RecallPrompt) so the answer is captured in `pendingAnswers`.

## Rubric reminder

Three binary criteria:
- **Correctness** — is what they said true?
- **Specificity** — concrete example or specific behavior, not just buzzwords?
- **Tradeoff awareness** — did they name the tension?

Sum → rating:
- 0 → Again (1)
- 1 → Hard (2)
- 2 → Good (3)
- 3 → Easy (4)
