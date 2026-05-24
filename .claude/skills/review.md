---
name: review
description: Walk the user through their due SR cards one at a time.
---

# /review

## Procedure

1. Ask the user to paste their SR state from the browser dev console:

   ```js
   copy(localStorage.getItem('srs.v1'))
   ```

   (In v1.1 we'll auto-sync this; for now it's manual.)

2. Parse the JSON. Filter `cards` where `dueAt <= now`. Order randomly.

3. For each due card:
   a. Present `card.prompt` to the user.
   b. Wait for the user to answer in the terminal (free-form) or in the browser via RecallPrompt.
   c. Grade per the rubric in CLAUDE.md.
   d. Tell the user the rating and instruct them to click the rating in the browser to commit.

4. After all due cards: "Review complete. {n} cards reviewed."

## Important

Do not skip cards. Do not bias toward "Good" — the rubric is binary per criterion; apply it strictly so spacing reflects real performance.
