import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Strategy = 'none' | 'naive' | 'production';

interface TraceStep {
  action: string;
  result: 'success' | 'error';
  statusCode?: number;
  reason?: string;
  retryBadge?: string;
  note?: string;
}

interface TraceOutcome {
  label: string;
  variant: 'success' | 'failure' | 'warning';
}

interface Trace {
  steps: TraceStep[];
  outcome: TraceOutcome;
  totalAttempts: number;
  totalLatencyMs: number;
  totalCostUSD: number;
  sideEffects: number;
}

interface Scenario {
  label: string;
  description: string;
  traces: Record<Strategy, Trace>;
}

// ---------------------------------------------------------------------------
// Hardcoded traces for each (scenario, strategy) combination
// ---------------------------------------------------------------------------

const SCENARIOS: Scenario[] = [
  // ─── Scenario 0: Transient network error (503) ───────────────────────────
  {
    label: 'Transient 503',
    description:
      'Tool returns HTTP 503 (Service Unavailable) once, then succeeds on retry. A transient network hiccup.',
    traces: {
      none: {
        steps: [
          {
            action: 'fetch_user_data(user_id="u42")',
            result: 'error',
            statusCode: 503,
            reason: 'Service Unavailable — upstream timeout',
          },
        ],
        outcome: { label: 'Failed — loop crashed on first error', variant: 'failure' },
        totalAttempts: 1,
        totalLatencyMs: 500,
        totalCostUSD: 0.003,
        sideEffects: 0,
      },
      naive: {
        steps: [
          {
            action: 'fetch_user_data(user_id="u42")',
            result: 'error',
            statusCode: 503,
            reason: 'Service Unavailable',
            retryBadge: 'retry 1/3',
          },
          {
            action: 'fetch_user_data(user_id="u42")',
            result: 'success',
            note: 'Returned user record after retry',
          },
        ],
        outcome: { label: 'Succeeded (1 retry, +500ms)', variant: 'success' },
        totalAttempts: 2,
        totalLatencyMs: 1000,
        totalCostUSD: 0.006,
        sideEffects: 0,
      },
      production: {
        steps: [
          {
            action: 'fetch_user_data(user_id="u42")',
            result: 'error',
            statusCode: 503,
            reason: 'Service Unavailable — classified as TRANSIENT',
            retryBadge: 'backing off 200ms',
          },
          {
            action: 'fetch_user_data(user_id="u42")',
            result: 'success',
            note: 'Returned user record after exponential backoff + jitter',
          },
        ],
        outcome: { label: 'Succeeded (1 retry, +200ms with jitter)', variant: 'success' },
        totalAttempts: 2,
        totalLatencyMs: 700,
        totalCostUSD: 0.006,
        sideEffects: 0,
      },
    },
  },

  // ─── Scenario 1: Permanent error (400) ───────────────────────────────────
  {
    label: 'Permanent 400',
    description:
      'Tool returns HTTP 400 (Bad Request) due to malformed arguments. No amount of retrying will fix this.',
    traces: {
      none: {
        steps: [
          {
            action: 'query_database(filter="date > invalid-date")',
            result: 'error',
            statusCode: 400,
            reason: 'Bad Request — invalid date format in filter',
          },
        ],
        outcome: { label: 'Failed — loop crashed, no retry', variant: 'failure' },
        totalAttempts: 1,
        totalLatencyMs: 300,
        totalCostUSD: 0.003,
        sideEffects: 0,
      },
      naive: {
        steps: [
          {
            action: 'query_database(filter="date > invalid-date")',
            result: 'error',
            statusCode: 400,
            reason: 'Bad Request — invalid date format',
            retryBadge: 'retry 1/3',
          },
          {
            action: 'query_database(filter="date > invalid-date")',
            result: 'error',
            statusCode: 400,
            reason: 'Bad Request — invalid date format',
            retryBadge: 'retry 2/3',
          },
          {
            action: 'query_database(filter="date > invalid-date")',
            result: 'error',
            statusCode: 400,
            reason: 'Bad Request — invalid date format',
            retryBadge: 'retry 3/3',
          },
        ],
        outcome: {
          label: 'Failed (3 retries wasted, +900ms, identical error every time)',
          variant: 'failure',
        },
        totalAttempts: 4,
        totalLatencyMs: 1200,
        totalCostUSD: 0.012,
        sideEffects: 0,
      },
      production: {
        steps: [
          {
            action: 'query_database(filter="date > invalid-date")',
            result: 'error',
            statusCode: 400,
            reason: 'Bad Request — classified as PERMANENT. Escalating to user.',
          },
        ],
        outcome: {
          label: 'Failed fast (0 retries) — escalated to user with clear error',
          variant: 'failure',
        },
        totalAttempts: 1,
        totalLatencyMs: 300,
        totalCostUSD: 0.003,
        sideEffects: 0,
      },
    },
  },

  // ─── Scenario 2: Side-effecting tool with timeout ────────────────────────
  {
    label: 'Side-effecting timeout',
    description:
      'charge_card(amount=99.99) succeeds on the server, but the HTTP response times out. Without idempotency, a retry charges the card twice.',
    traces: {
      none: {
        steps: [
          {
            action: 'charge_card(amount=99.99)',
            result: 'error',
            reason: 'ETIMEDOUT — response never arrived (server committed charge)',
          },
        ],
        outcome: {
          label: 'Failed — no commit registered. Card may or may not be charged.',
          variant: 'failure',
        },
        totalAttempts: 1,
        totalLatencyMs: 5000,
        totalCostUSD: 0.003,
        sideEffects: 0,
      },
      naive: {
        steps: [
          {
            action: 'charge_card(amount=99.99)',
            result: 'error',
            reason: 'ETIMEDOUT — response timed out (server committed charge)',
            retryBadge: 'retry 1/3',
          },
          {
            action: 'charge_card(amount=99.99)',
            result: 'success',
            note: 'Charge returned success — but server charged AGAIN (duplicate transaction)',
          },
        ],
        outcome: {
          label: 'Side effect: card charged twice ($99.99 x 2)',
          variant: 'warning',
        },
        totalAttempts: 2,
        totalLatencyMs: 5300,
        totalCostUSD: 0.006,
        sideEffects: 2,
      },
      production: {
        steps: [
          {
            action: 'charge_card(amount=99.99, idempotency_key="idem_a9f3")',
            result: 'error',
            reason: 'ETIMEDOUT — response timed out (server committed charge)',
            retryBadge: 'backing off 800ms',
          },
          {
            action: 'charge_card(amount=99.99, idempotency_key="idem_a9f3")',
            result: 'success',
            note: 'Server recognized duplicate key — returned original response, no double charge',
          },
        ],
        outcome: {
          label: 'Succeeded (1 retry with idempotency key, +800ms, no double charge)',
          variant: 'success',
        },
        totalAttempts: 2,
        totalLatencyMs: 5800,
        totalCostUSD: 0.006,
        sideEffects: 0,
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Strategy metadata
// ---------------------------------------------------------------------------

const STRATEGIES: Array<{ key: Strategy; label: string; description: string }> = [
  {
    key: 'none',
    label: 'No handling',
    description: 'Any tool error crashes the loop immediately.',
  },
  {
    key: 'naive',
    label: 'Naive retry',
    description: 'Always retry up to 3 times with no backoff. Treats all errors as transient.',
  },
  {
    key: 'production',
    label: 'Production-grade',
    description:
      'Classify error → transient: exponential backoff + jitter; permanent: escalate; side-effecting: idempotency key.',
  },
];

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

export interface AgentErrorRecoveryProps {
  initialScenarioIndex?: number;
  initialStrategy?: Strategy;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AgentErrorRecovery({
  initialScenarioIndex = 0,
  initialStrategy = 'none',
}: AgentErrorRecoveryProps) {
  const [activeScenario, setActiveScenario] = useState(initialScenarioIndex);
  const [activeStrategy, setActiveStrategy] = useState<Strategy>(initialStrategy);

  const scenario = SCENARIOS[activeScenario];
  const trace = scenario.traces[activeStrategy];
  const finalOutcome = trace.outcome.label;

  useEffect(() => {
    reportState('AgentErrorRecovery', {
      activeScenario,
      activeStrategy,
      finalOutcome,
      totalAttempts: trace.totalAttempts,
      totalLatencyMs: trace.totalLatencyMs,
      sideEffects: trace.sideEffects,
    });
  }, [activeScenario, activeStrategy, finalOutcome, trace]);

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Agent Error Recovery: Tool Failures &amp; Recovery Strategies</h3>

      {/* Scenario selector */}
      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>Scenario:</span>
        <div className={styles.btnGroup} role="group" aria-label="Select scenario">
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              className={`${styles.btn} ${i === activeScenario ? styles.btnActive : ''}`}
              onClick={() => setActiveScenario(i)}
              aria-pressed={i === activeScenario}
              data-testid={`scenario-btn-${i}`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy toggle */}
      <div className={styles.controlRow}>
        <span className={styles.controlLabel}>Strategy:</span>
        <div className={styles.btnGroup} role="group" aria-label="Select strategy">
          {STRATEGIES.map(s => (
            <button
              key={s.key}
              className={`${styles.btn} ${s.key === activeStrategy ? styles.btnActive : ''}`}
              onClick={() => setActiveStrategy(s.key)}
              aria-pressed={s.key === activeStrategy}
              data-testid={`strategy-btn-${s.key}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Context descriptions */}
      <p className={styles.description}>{scenario.description}</p>
      <p className={styles.strategyDesc}>
        <strong>{STRATEGIES.find(s => s.key === activeStrategy)?.label}:</strong>{' '}
        {STRATEGIES.find(s => s.key === activeStrategy)?.description}
      </p>

      {/* Trace */}
      <div className={styles.trace}>
        {trace.steps.map((step, i) => (
          <div
            key={i}
            className={`${styles.stepCard} ${step.result === 'success' ? styles.stepSuccess : styles.stepError}`}
            data-testid={`step-${i}`}
          >
            <div className={styles.stepHeader}>
              <span className={styles.stepNumber}>Step {i + 1}</span>
              {step.retryBadge && (
                <span className={styles.retryBadge}>{step.retryBadge}</span>
              )}
              <span
                className={`${styles.resultBadge} ${step.result === 'success' ? styles.resultSuccess : styles.resultError}`}
              >
                {step.result === 'success' ? '✓ success' : `✗ ${step.statusCode ? `HTTP ${step.statusCode}` : 'error'}`}
              </span>
            </div>

            <div className={styles.stepAction}>
              <span className={styles.stepActionLabel}>Tool call</span>
              <code className={styles.stepActionCode}>{step.action}</code>
            </div>

            {step.result === 'error' && step.reason && (
              <div className={styles.stepReason}>
                <span className={styles.stepReasonLabel}>Reason</span>
                <span className={styles.stepReasonText}>{step.reason}</span>
              </div>
            )}

            {step.result === 'success' && step.note && (
              <div className={styles.stepNote}>{step.note}</div>
            )}
          </div>
        ))}

        {/* Final outcome */}
        <div
          className={`${styles.outcomeCard} ${
            trace.outcome.variant === 'success'
              ? styles.outcomeSuccess
              : trace.outcome.variant === 'warning'
              ? styles.outcomeWarning
              : styles.outcomeFailure
          }`}
          data-testid="outcome-card"
        >
          <strong>Outcome:</strong> {trace.outcome.label}
        </div>
      </div>

      {/* Stats panel */}
      <div className={styles.statsPanel} data-testid="stats-panel">
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total attempts</span>
          <span className={styles.statValue}>{trace.totalAttempts}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Wall-clock time</span>
          <span className={styles.statValue}>{trace.totalLatencyMs}ms</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Cost (LLM + tools)</span>
          <span className={`${styles.statValue} ${styles.statCost}`}>
            ${trace.totalCostUSD.toFixed(3)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Side effects</span>
          <span className={`${styles.statValue} ${trace.sideEffects > 0 ? styles.statDanger : ''}`}>
            {trace.sideEffects === 0 ? 'none' : trace.sideEffects === 2 ? 'double charge' : trace.sideEffects}
          </span>
        </div>
      </div>
    </div>
  );
}
