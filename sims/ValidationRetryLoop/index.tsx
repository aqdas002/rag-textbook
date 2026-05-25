import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Attempt {
  jsonOutput: string;
  valid: boolean;
  validatorMessage: string;
  retryPrompt?: string;
}

interface Scenario {
  label: string;
  description: string;
  schema: string;
  attempts: Attempt[];
  totalCallsUSD: number;
  totalTokens: number;
  p50LatencyMs: number;
  lesson: string;
}

// ---------------------------------------------------------------------------
// Pre-loaded scenarios
// ---------------------------------------------------------------------------

const SCENARIOS: Scenario[] = [
  // ─── Scenario 0: Strict mode, well-designed schema, capable model ──────────
  {
    label: 'Strict mode · capable model',
    description: 'GPT-4o with response_format=json_schema, strict=true',
    schema: `{
  "type": "object",
  "required": ["task", "due_date", "assignee", "priority"],
  "properties": {
    "task":     { "type": "string" },
    "due_date": { "type": "string", "format": "date" },
    "assignee": { "type": "string" },
    "priority": { "type": "string", "enum": ["low","medium","high"] }
  },
  "additionalProperties": false
}`,
    attempts: [
      {
        jsonOutput: `{
  "task": "Migrate database to Postgres 16",
  "due_date": "2026-05-30",
  "assignee": "alice@example.com",
  "priority": "high"
}`,
        valid: true,
        validatorMessage: 'All required fields present, types correct',
      },
    ],
    totalCallsUSD: 0.005,
    totalTokens: 420,
    p50LatencyMs: 1200,
    lesson:
      'Strict mode constrains token generation at the API level — schema adherence is guaranteed. Zero retries needed.',
  },

  // ─── Scenario 1: Non-strict mode, well-designed schema, capable model ──────
  {
    label: 'Non-strict · well-designed schema',
    description: 'GPT-4o without strict=true, clear schema',
    schema: `{
  "type": "object",
  "required": ["task", "due_date", "assignee"],
  "properties": {
    "task":     { "type": "string" },
    "due_date": { "type": "string", "format": "date" },
    "assignee": { "type": "string" },
    "priority": { "type": "string", "enum": ["low","medium","high"] }
  },
  "additionalProperties": false
}`,
    attempts: [
      {
        jsonOutput: `{
  "task": "Migrate database to Postgres 16",
  "due_date": "2026-05-30",
  "assignee": "alice@example.com"
}`,
        valid: true,
        validatorMessage:
          'Required fields present. `priority` is optional — omission is valid',
      },
    ],
    totalCallsUSD: 0.005,
    totalTokens: 410,
    p50LatencyMs: 1200,
    lesson:
      'A well-designed schema (clear types, unambiguous fields) often passes first try even without strict mode.',
  },

  // ─── Scenario 2: Non-strict mode, ambiguous schema, capable model ──────────
  {
    label: 'Non-strict · ambiguous schema',
    description: 'GPT-4o without strict=true, ambiguous date field',
    schema: `{
  "type": "object",
  "required": ["task", "due_date", "assignee"],
  "properties": {
    "task":     { "type": "string" },
    "due_date": { "type": "string" },
    "assignee": { "type": "string" }
  },
  "additionalProperties": false
}`,
    attempts: [
      {
        jsonOutput: `{
  "task": "Migrate database to Postgres 16",
  "due_date": "next Tuesday",
  "assignee": "alice@example.com"
}`,
        valid: false,
        validatorMessage:
          'Invalid date format: `due_date` must be ISO 8601 (YYYY-MM-DD), got "next Tuesday"',
        retryPrompt:
          'Your output failed validation: `due_date` must be a valid ISO 8601 date (YYYY-MM-DD). Please return only the JSON object.',
      },
      {
        jsonOutput: `{
  "task": "Migrate database to Postgres 16",
  "due_date": "2026-05-26",
  "assignee": "alice@example.com"
}`,
        valid: true,
        validatorMessage: 'All fields valid. ISO 8601 date confirmed',
      },
    ],
    totalCallsUSD: 0.010,
    totalTokens: 840,
    p50LatencyMs: 2400,
    lesson:
      'Ambiguous field descriptions (no format hint) let the model return natural language. Each retry doubles latency and cost.',
  },

  // ─── Scenario 3: Non-strict mode, complex nested schema, weaker model ───────
  {
    label: 'Non-strict · nested schema · weaker model',
    description: 'GPT-3.5-turbo without strict=true, deeply nested schema',
    schema: `{
  "type": "object",
  "required": ["meeting_title", "start_time", "attendees"],
  "properties": {
    "meeting_title": { "type": "string" },
    "start_time":    { "type": "string", "format": "date-time" },
    "attendees": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "email"],
        "properties": {
          "name":  { "type": "string" },
          "email": { "type": "string", "format": "email" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}`,
    attempts: [
      {
        jsonOutput: `{
  "meeting_title": "Q2 Planning",
  "start_time": "2026-06-01T10:00:00Z",
  "attendees": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob" }
  ]
}`,
        valid: false,
        validatorMessage:
          'Missing required field: `email` on attendees[1] (Bob)',
        retryPrompt:
          'Your output failed validation: attendees[1] is missing required field `email`. Every attendee must have both `name` and `email`. Please return only the corrected JSON object.',
      },
      {
        jsonOutput: `{
  "meeting_title": "Q2 Planning",
  "start_time": "2026-06-01T10:00:00Z",
  "attendees": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob", "email": "bob@example.com", "notes": "joins late" }
  ]
}`,
        valid: false,
        validatorMessage:
          'Additional property not allowed: `notes` in attendees[1] (schema has additionalProperties: false)',
        retryPrompt:
          'Your output failed validation: attendees[1] has an extra key `notes` which is not allowed by the schema. Remove all keys not listed in the schema and return only the corrected JSON object.',
      },
      {
        jsonOutput: `{
  "meeting_title": "Q2 Planning",
  "start_time": "2026-06-01T10:00:00Z",
  "attendees": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob",   "email": "bob@example.com" }
  ]
}`,
        valid: true,
        validatorMessage: 'All required fields present, no additional properties',
      },
    ],
    totalCallsUSD: 0.015,
    totalTokens: 1260,
    p50LatencyMs: 3600,
    lesson:
      'Deeply nested schemas + weaker models = retry storm. Either flatten the schema, add explicit constraints, or switch to a stronger model.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface ValidationRetryLoopProps {
  initialScenarioIndex?: number;
}

export function ValidationRetryLoop({ initialScenarioIndex = 0 }: ValidationRetryLoopProps) {
  const [activeScenario, setActiveScenario] = useState(initialScenarioIndex);

  const scenario = SCENARIOS[activeScenario];
  const totalAttempts = scenario.attempts.length;
  const finalOutcome = scenario.attempts[totalAttempts - 1].valid ? 'passed' : 'failed';

  useEffect(() => {
    reportState('ValidationRetryLoop', {
      activeScenario,
      totalAttempts,
      totalCallsUSD: scenario.totalCallsUSD,
      totalLatencyMs: scenario.p50LatencyMs,
      finalOutcome,
    });
  }, [activeScenario, totalAttempts, scenario.totalCallsUSD, scenario.p50LatencyMs, finalOutcome]);

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Structured Outputs: Validate-and-Retry Loop</h3>

      {/* Scenario selector */}
      <div className={styles.scenarioRow}>
        <span className={styles.scenarioLabel}>Scenario:</span>
        <div className={styles.scenarioBtns} role="group" aria-label="Select scenario">
          {SCENARIOS.map((s, i) => (
            <button
              key={i}
              className={`${styles.scenarioBtn} ${i === activeScenario ? styles.scenarioBtnActive : ''}`}
              onClick={() => setActiveScenario(i)}
              aria-pressed={i === activeScenario}
              data-testid={`scenario-btn-${i}`}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className={styles.scenarioDescription}>{scenario.description}</p>

      {/* Schema */}
      <div className={styles.schemaBlock}>
        <div className={styles.schemaHeader}>Schema (JSON Schema)</div>
        <pre className={styles.schemaPre}>{scenario.schema}</pre>
      </div>

      {/* Attempt trace */}
      <div className={styles.trace}>
        {scenario.attempts.map((attempt, i) => (
          <div key={i} className={styles.attemptWrapper}>
            <div
              className={`${styles.attemptCard} ${attempt.valid ? styles.attemptPass : styles.attemptFail}`}
              data-testid={`attempt-${i}`}
            >
              <div className={styles.attemptHeader}>
                <span className={styles.attemptNumber}>Attempt {i + 1}</span>
                <span
                  className={`${styles.validBadge} ${attempt.valid ? styles.validBadgePass : styles.validBadgeFail}`}
                >
                  {attempt.valid ? '✓ valid' : `✗ ${attempt.validatorMessage}`}
                </span>
              </div>

              <div className={styles.jsonBlock}>
                <div className={styles.jsonLabel}>LLM output</div>
                <pre className={styles.jsonPre}>{attempt.jsonOutput}</pre>
              </div>

              {!attempt.valid && (
                <div className={styles.errorBlock}>
                  <div className={styles.errorLabel}>Validation error</div>
                  <span className={styles.errorMsg}>{attempt.validatorMessage}</span>
                </div>
              )}
            </div>

            {/* Retry prompt between failed attempt and next attempt */}
            {!attempt.valid && attempt.retryPrompt && i < scenario.attempts.length - 1 && (
              <div className={styles.retryPromptCard} data-testid={`retry-prompt-${i}`}>
                <div className={styles.retryPromptLabel}>Retry prompt sent to LLM</div>
                <p className={styles.retryPromptText}>{attempt.retryPrompt}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats panel */}
      <div className={styles.statsPanel} data-testid="stats-panel">
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Attempts:</span>
          <span className={styles.statValue}>{totalAttempts}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Total tokens (est.):</span>
          <span className={styles.statValue}>{scenario.totalTokens}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Cost:</span>
          <span className={`${styles.statValue} ${styles.statCost}`}>${scenario.totalCallsUSD.toFixed(3)}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>p50 latency:</span>
          <span className={styles.statValue}>{(scenario.p50LatencyMs / 1000).toFixed(1)}s</span>
        </div>
      </div>

      {/* Lesson panel */}
      <div className={styles.lessonPanel}>
        <strong>Key takeaway:</strong> {scenario.lesson}
      </div>
    </div>
  );
}
