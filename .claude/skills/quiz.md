---
name: quiz
description: Grade a pending recall answer or generate a new recall question.
---

# /quiz [concept?]

## Two modes

### Mode A: Grade a pending answer (most common)

When the user runs `/quiz [concept]`, check `.sim-state.json` for a `pendingAnswer` field.

If present:

1. Read `pendingAnswer.question`, `pendingAnswer.answer`, `pendingAnswer.concept`.
2. Apply the grading rubric from CLAUDE.md (3 binary criteria → 0–3 total → 1–4 FSRS rating).
3. Write `pendingGrade` to `.sim-state.json` using the Write tool. Preserve all other fields. Format:

   ```json
   {
     "pendingGrade": {
       "concept": "<pendingAnswer.concept>",
       "rating": 3,
       "comment": "<one sentence — what was missing or what was strong>"
     }
   }
   ```

4. Tell the user: "Graded: <rating-name> (<rating>/4). <one-sentence comment>. Click 'Commit to SR' in the browser to enqueue."

### Mode B: Generate a new question

If no `pendingAnswer` exists, or if the user passes a concept that has no pendingAnswer:

1. Pick a concept (use the argument if given; else pick a due SR card from `content/learning-graph.json` × `localStorage` SR cards — ask user to paste their `localStorage.getItem('srs.v1')` if needed).
2. Write a recall question that:
   - Requires the user to use their own words
   - Requires either a concrete example or a tradeoff articulation
   - Is answerable from the chapter content
3. Print the question. Tell the user to answer in the browser (RecallPrompt) so the answer is captured in state.

## Rubric reminder

Three binary criteria:
- Correctness — is what they said true?
- Specificity — concrete example or specific behavior, not just buzzwords?
- Tradeoff awareness — did they name the tension?

Sum → rating:
- 0 → Again (1)
- 1 → Hard (2)
- 2 → Good (3)
- 3 → Easy (4)
