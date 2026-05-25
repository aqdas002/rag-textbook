# ValidationRetryLoop

Chapter 12 — Structured Outputs

## What it teaches

When you ask an LLM to output JSON matching a schema, it sometimes succeeds first try and sometimes doesn't. This sim makes the validate-and-retry loop visible across 4 scenarios:

1. **Strict mode, capable model** — API guarantees schema adherence at the token level; zero retries
2. **Non-strict, well-designed schema** — clear types and formats pass first try even without strict mode
3. **Non-strict, ambiguous schema** — missing format hints cause natural-language output; one retry required
4. **Non-strict, complex nested schema, weaker model** — retry storm; 3 attempts, 3x cost and latency

## Concepts

- `structured-outputs`
- `schema-strictness`
- `output-validation-loop`

## Files

| File | Purpose |
|------|---------|
| `index.tsx` | Main component |
| `index.module.css` | Styles |
| `index.test.tsx` | 3 vitest tests |
| `README.md` | This file |

## Running tests

```bash
npx vitest run sims/ValidationRetryLoop/index.test.tsx
```
