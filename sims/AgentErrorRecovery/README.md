# AgentErrorRecovery

Chapter 14 sim — Agent errors: tool failures and recovery strategies.

## Pedagogical point

Tools fail in production. Networks flake; rate limits hit; servers 503. An agent without error
handling silently corrupts results, charges the user twice, or hits the step limit doing useless
work. An agent with naive retry can over-retry permanent errors (wasted cost, no recovery) or
under-retry transient errors (gave up too soon). Production-grade recovery requires:

- Classifying errors as transient or permanent
- Exponential backoff with jitter for transient errors
- Circuit breakers to stop hammering a broken tool
- Idempotency keys so a retry does not double-charge the user

## Scenarios

| # | Name | What it tests |
|---|------|---------------|
| 0 | Transient 503 | Network hiccup — retry should recover |
| 1 | Permanent 400 | Malformed args — no retry will fix this |
| 2 | Side-effecting timeout | charge_card succeeds server-side but response times out |

## Strategies

| Strategy | Behaviour |
|----------|-----------|
| No handling | Any error crashes the loop immediately |
| Naive retry | Retry up to 3 times with no backoff; treats all errors as transient |
| Production-grade | Classify → transient: exponential backoff + jitter; permanent: escalate; side-effecting: idempotency key |

## Outcome matrix

| Scenario \ Strategy | No handling | Naive retry | Production |
|---|---|---|---|
| 0. Transient 503 | Failed | Succeeded (1 retry) | Succeeded (1 retry + jitter) |
| 1. Permanent 400 | Failed | Failed (3 retries wasted) | Failed fast (0 retries, escalate) |
| 2. Side-effecting timeout | Failed | Card charged twice | Succeeded (idempotency key) |

## Files

- `index.tsx` — component
- `index.module.css` — styles
- `index.test.tsx` — 3 tests
- `README.md` — this file

## Concepts taught

`tool-errors`, `retry-policy`, `circuit-breakers`, `idempotency-in-tools`
