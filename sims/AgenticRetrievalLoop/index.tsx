import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AgentStep {
  thought: string;
  action: string;
  observation: string;
}

interface VanillaChunk {
  text: string;
  source: string;
}

interface QueryDef {
  text: string;
  label: string;
  vanillaChunks: VanillaChunk[];
  vanillaSynthesis: string;
  vanillaSuccess: boolean;
  agentSteps: AgentStep[];
  finalAnswer: string;
  /** Number of LLM calls (planning steps + final answer) */
  llmCalls: number;
  /** Number of retrieval operations */
  agentRetrievals: number;
}

// ---------------------------------------------------------------------------
// Cost constants
// ---------------------------------------------------------------------------

const COST_PER_LLM_CALL = 0.003;
const COST_PER_RETRIEVAL = 0.0001;
const VANILLA_COST_USD = 0.003; // single retrieval + single LLM call

// ---------------------------------------------------------------------------
// Query definitions (hardcoded per pedagogical spec)
// ---------------------------------------------------------------------------

export const QUERIES: QueryDef[] = [
  // ─── Query 0: Decomposition needed ───────────────────────────────────────
  {
    text: "What's the difference in total funding raised between Anthropic and OpenAI?",
    label: 'Decomposition needed',
    vanillaChunks: [
      {
        text: 'Anthropic has raised significant funding from investors including Google and Spark Capital, with rounds totalling several billion dollars.',
        source: 'doc/anthropic-funding-overview',
      },
      {
        text: "OpenAI's backers include Microsoft, which has invested over $10 billion across multiple rounds since 2019.",
        source: 'doc/openai-microsoft-partnership',
      },
      {
        text: 'Anthropic closed a $4 billion round led by Amazon in late 2023, bringing total raised to approximately $7.6 billion.',
        source: 'doc/anthropic-amazon-round',
      },
    ],
    vanillaSynthesis:
      'Anthropic has raised billions from Google and Amazon. OpenAI has received over $10 billion from Microsoft. Both companies are well-funded AI labs, though exact comparable totals are unclear from available context.',
    vanillaSuccess: false,
    agentSteps: [
      {
        thought: 'I need the total funding for Anthropic first, then for OpenAI, and finally compute the difference.',
        action: 'search("Anthropic total funding raised")',
        observation:
          'Chunk: "Anthropic has raised a total of approximately $7.6 billion across all funding rounds as of 2024, with major investors including Google and Amazon." [doc/anthropic-funding-total]',
      },
      {
        thought: "Good — Anthropic's total is $7.6B. Now I need OpenAI's figure.",
        action: 'search("OpenAI total funding raised all rounds")',
        observation:
          'Chunk: "OpenAI has raised approximately $13.0 billion in total, including $10B+ from Microsoft and earlier rounds from Khosla Ventures and others." [doc/openai-funding-total]',
      },
      {
        thought: 'I have both figures: Anthropic $7.6B, OpenAI $13.0B. I can now compute the difference.',
        action: 'compute(13.0 - 7.6)',
        observation: 'Result: $5.4 billion difference.',
      },
    ],
    finalAnswer:
      'OpenAI has raised approximately $5.4 billion more than Anthropic ($13.0B vs $7.6B total funding as of 2024).',
    llmCalls: 4,
    agentRetrievals: 2,
  },

  // ─── Query 1: Refinement needed ──────────────────────────────────────────
  {
    text: 'What are the open issues blocking the v2.1 release of the authentication service?',
    label: 'Refinement needed',
    vanillaChunks: [
      {
        text: 'The authentication service handles OAuth 2.0 flows and issues JWT tokens. Known issues include token refresh edge cases.',
        source: 'doc/auth-service-overview',
      },
      {
        text: 'Open bug tracker issues tagged #auth-service include AUTH-1024, AUTH-1031, AUTH-1045, AUTH-1102, and AUTH-1118.',
        source: 'doc/jira-auth-open-issues',
      },
      {
        text: 'Release v2.0 of the authentication service shipped in Q3 with multi-tenant support and SSO integration.',
        source: 'doc/auth-v2-release-notes',
      },
    ],
    vanillaSynthesis:
      'There are several open issues tagged #auth-service including AUTH-1024, AUTH-1031, and others. The v2.1 release is planned but specific blockers are not clearly identified in the retrieved context.',
    vanillaSuccess: false,
    agentSteps: [
      {
        thought: "I need to know what 'v2.1' means in context before I can find blockers. Let me look up the release plan first.",
        action: 'search("v2.1 release plan authentication service")',
        observation:
          'Chunk: "The v2.1 release plan lists 5 required tickets that must be resolved before ship: AUTH-1024, AUTH-1031, AUTH-1045, AUTH-1102, AUTH-1118." [doc/auth-v2.1-release-plan]',
      },
      {
        thought: 'I have the 5 ticket IDs. Now I must look up each to find which are still open. Starting with AUTH-1024.',
        action: 'lookup("AUTH-1024")',
        observation:
          'AUTH-1024: "Token refresh fails silently on expired refresh tokens." Status: OPEN. Priority: Blocker.',
      },
      {
        thought: 'AUTH-1024 is open and a blocker. Checking AUTH-1031.',
        action: 'lookup("AUTH-1031")',
        observation:
          'AUTH-1031: "SSO redirect loop under high concurrency." Status: CLOSED (fixed in commit a3f92c1).',
      },
      {
        thought: 'AUTH-1031 is closed. Checking AUTH-1045.',
        action: 'lookup("AUTH-1045")',
        observation:
          'AUTH-1045: "JWT signing key rotation breaks active sessions." Status: OPEN. Priority: Blocker.',
      },
      {
        thought: 'AUTH-1045 is open and a blocker. Checking AUTH-1102.',
        action: 'lookup("AUTH-1102")',
        observation:
          'AUTH-1102: "Audit log timestamps off by one hour in DST regions." Status: OPEN. Priority: Major.',
      },
      {
        thought: 'AUTH-1102 is open. Checking last ticket AUTH-1118.',
        action: 'lookup("AUTH-1118")',
        observation:
          'AUTH-1118: "OAuth PKCE flow not supported for mobile clients." Status: CLOSED (released in v2.0.3).',
      },
      {
        thought: 'I now have the status of all 5 tickets. 3 are open: AUTH-1024, AUTH-1045, AUTH-1102. I can synthesize the final answer.',
        action: 'synthesize(open tickets from AUTH-1024, AUTH-1031, AUTH-1045, AUTH-1102, AUTH-1118)',
        observation: '3 of 5 release-gating tickets are still open.',
      },
    ],
    finalAnswer:
      '3 of the 5 v2.1 release-gating tickets are open: AUTH-1024 (token refresh fails silently — Blocker), AUTH-1045 (JWT key rotation breaks sessions — Blocker), AUTH-1102 (audit log timestamp drift — Major). AUTH-1031 and AUTH-1118 are closed.',
    llmCalls: 8,
    agentRetrievals: 7,
  },

  // ─── Query 2: Single-call would have worked ───────────────────────────────
  {
    text: 'Who is the CEO of Anthropic?',
    label: 'Single-call sufficient',
    vanillaChunks: [
      {
        text: 'Dario Amodei is the CEO of Anthropic. He co-founded the company in 2021 along with his sister Daniela Amodei, who serves as President.',
        source: 'doc/anthropic-leadership',
      },
      {
        text: "Anthropic's leadership team includes CEO Dario Amodei and President Daniela Amodei, both formerly of OpenAI.",
        source: 'doc/anthropic-about',
      },
      {
        text: 'Dario Amodei previously served as VP of Research at OpenAI before leaving to co-found Anthropic.',
        source: 'doc/dario-amodei-bio',
      },
    ],
    vanillaSynthesis:
      'Dario Amodei is the CEO of Anthropic. He co-founded the company in 2021 with his sister Daniela Amodei (President), and previously served as VP of Research at OpenAI.',
    vanillaSuccess: true,
    agentSteps: [
      {
        thought: 'The user wants to know who is the CEO of Anthropic. I will search for this directly.',
        action: 'search("CEO of Anthropic")',
        observation:
          'Chunk: "Dario Amodei is the CEO of Anthropic. He co-founded the company in 2021." [doc/anthropic-leadership]',
      },
      {
        thought: 'The answer is clearly in the first retrieved chunk. No further retrieval needed.',
        action: 'synthesize("Dario Amodei is the CEO of Anthropic")',
        observation: 'Answer ready.',
      },
    ],
    finalAnswer:
      'Dario Amodei is the CEO of Anthropic. Note: this answer required 2 agent steps and 1 retrieval — more overhead than vanilla RAG, which answered it with a single call. Agentic systems pay a planning tax even on simple queries.',
    llmCalls: 3,
    agentRetrievals: 1,
  },
];

// ---------------------------------------------------------------------------
// Cost computation
// ---------------------------------------------------------------------------

function computeAgenticCost(q: QueryDef): number {
  return q.llmCalls * COST_PER_LLM_CALL + q.agentRetrievals * COST_PER_RETRIEVAL;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface AgenticRetrievalLoopProps {
  initialQueryIndex?: number;
}

export function AgenticRetrievalLoop({ initialQueryIndex = 0 }: AgenticRetrievalLoopProps) {
  const [activeQueryIndex, setActiveQueryIndex] = useState(initialQueryIndex);
  const [revealedSteps, setRevealedSteps] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const activeQuery = QUERIES[activeQueryIndex];
  const totalSteps = activeQuery.agentSteps.length;
  const agenticCostUSD = computeAgenticCost(activeQuery);

  // Reset step reveal when query changes
  useEffect(() => {
    setRevealedSteps(0);
    setIsPlaying(false);
  }, [activeQueryIndex]);

  // Auto-play: reveal one step per 800ms
  useEffect(() => {
    if (!isPlaying) return;
    if (revealedSteps >= totalSteps) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => setRevealedSteps(s => s + 1), 800);
    return () => clearTimeout(timer);
  }, [isPlaying, revealedSteps, totalSteps]);

  // reportState whenever query or revealed steps changes
  useEffect(() => {
    reportState('AgenticRetrievalLoop', {
      activeQuery: activeQueryIndex,
      vanillaSuccess: activeQuery.vanillaSuccess,
      agentSteps: activeQuery.agentSteps.length,
      agentRetrievals: activeQuery.agentRetrievals,
      agenticCostUSD,
      vanillaCostUSD: VANILLA_COST_USD,
    });
  }, [activeQueryIndex, activeQuery, agenticCostUSD]);

  const allStepsRevealed = revealedSteps >= totalSteps;

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Agentic RAG: ReAct Loop vs Vanilla Single-Call</h3>

      {/* Query selector */}
      <div className={styles.queryRow}>
        <label htmlFor="agentic-query-select" className={styles.queryLabel}>
          <strong>Query:</strong>
        </label>
        <select
          id="agentic-query-select"
          value={activeQueryIndex}
          onChange={e => setActiveQueryIndex(Number(e.target.value))}
          className={styles.querySelect}
          aria-label="Select query"
        >
          {QUERIES.map((q, i) => (
            <option key={i} value={i}>
              [{q.label}] {q.text}
            </option>
          ))}
        </select>
      </div>

      {/* Side-by-side layout */}
      <div className={styles.mainLayout}>
        {/* LEFT: Vanilla RAG */}
        <div className={styles.vanillaColumn} data-testid="vanilla-panel">
          <div className={styles.panelHeader}>
            <h4 className={styles.panelTitle}>Vanilla RAG</h4>
            <span
              className={`${styles.badge} ${activeQuery.vanillaSuccess ? styles.badgeGreen : styles.badgeRed}`}
            >
              {activeQuery.vanillaSuccess ? 'Vanilla succeeded' : 'Vanilla failed'}
            </span>
          </div>
          <p className={styles.panelSubtitle}>Single retrieval — top 3 chunks</p>

          {activeQuery.vanillaChunks.map((chunk, i) => (
            <div key={i} className={styles.chunkCard} data-testid={`vanilla-chunk-${i}`}>
              <span className={styles.rankBadge}>#{i + 1}</span>
              <div className={styles.chunkBody}>
                <p className={styles.chunkText}>{chunk.text}</p>
                <span className={styles.sourceTag}>{chunk.source}</span>
              </div>
            </div>
          ))}

          <div className={styles.synthCard}>
            <strong>Synthesized answer:</strong>
            <p className={styles.synthText}>{activeQuery.vanillaSynthesis}</p>
          </div>

          <div className={styles.costRow}>
            <span className={styles.costLabel}>Vanilla cost:</span>
            <span className={styles.costValue}>${VANILLA_COST_USD.toFixed(4)}</span>
            <span className={styles.costNote}>(1 LLM call + 1 retrieval)</span>
          </div>
        </div>

        {/* RIGHT: Agentic trace */}
        <div className={styles.agentColumn} data-testid="agent-trace-panel">
          <div className={styles.panelHeader}>
            <h4 className={styles.panelTitle}>Agentic RAG — ReAct Loop</h4>
            <div className={styles.playControls}>
              {!allStepsRevealed ? (
                <>
                  <button
                    className={styles.playBtn}
                    onClick={() => setIsPlaying(p => !p)}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  <button
                    className={styles.skipBtn}
                    onClick={() => {
                      setRevealedSteps(totalSteps);
                      setIsPlaying(false);
                    }}
                    aria-label="Skip to end"
                  >
                    Skip
                  </button>
                </>
              ) : (
                <button
                  className={styles.resetBtn}
                  onClick={() => setRevealedSteps(0)}
                  aria-label="Reset trace"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
          <p className={styles.panelSubtitle}>Step-by-step reasoning trace</p>

          {/* Vertical timeline */}
          <div className={styles.timeline}>
            {activeQuery.agentSteps.map((step, i) => {
              if (i >= revealedSteps) return null;
              return (
                <div key={i} className={styles.stepCard} data-testid={`agent-step-${i}`}>
                  <div className={styles.stepNumber}>Step {i + 1}</div>
                  <div className={styles.stepSection}>
                    <span className={styles.stepLabel}>Thought</span>
                    <span className={styles.stepThought}>{step.thought}</span>
                  </div>
                  <div className={styles.stepSection}>
                    <span className={styles.stepLabel}>Action</span>
                    <code className={styles.stepAction}>{step.action}</code>
                  </div>
                  <div className={styles.stepSection}>
                    <span className={styles.stepLabel}>Observation</span>
                    <span className={styles.stepObservation}>{step.observation}</span>
                  </div>
                </div>
              );
            })}

            {/* Show "thinking" indicator if playing and not yet all revealed */}
            {isPlaying && !allStepsRevealed && (
              <div className={styles.thinkingCard} data-testid="agent-thinking">
                <span className={styles.thinkingDots}>Reasoning...</span>
              </div>
            )}

            {/* Final answer — only after all steps revealed */}
            {allStepsRevealed && (
              <div className={styles.finalAnswerCard} data-testid="final-answer">
                <div className={styles.stepNumber}>Final Answer</div>
                <p className={styles.finalAnswerText}>{activeQuery.finalAnswer}</p>
              </div>
            )}
          </div>

          {/* Stats panel */}
          <div className={styles.statsPanel} data-testid="stats-panel">
            <div className={styles.statRow}>
              <span className={styles.statLabel}>LLM calls:</span>
              <span className={styles.statValue}>{activeQuery.llmCalls}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Retrievals:</span>
              <span className={styles.statValue}>{activeQuery.agentRetrievals}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Agentic cost:</span>
              <span className={`${styles.statValue} ${styles.costHighlight}`}>
                ${agenticCostUSD.toFixed(4)}
              </span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>vs Vanilla:</span>
              <span className={styles.statValue}>
                ${VANILLA_COST_USD.toFixed(4)}
              </span>
            </div>
            <div className={styles.statMultiplier}>
              {(agenticCostUSD / VANILLA_COST_USD).toFixed(1)}x more expensive than vanilla
            </div>
          </div>
        </div>
      </div>

      {/* Bottom insight panel */}
      <div className={styles.insightPanel}>
        {activeQueryIndex === 0 && (
          <>
            <strong>Decomposition:</strong> Vanilla RAG retrieved isolated funding facts but couldn&apos;t
            compute the difference — it doesn&apos;t know what to search for second until it sees the
            first result. The agent looped: find Anthropic total → find OpenAI total → subtract.
          </>
        )}
        {activeQueryIndex === 1 && (
          <>
            <strong>Refinement:</strong> The question can&apos;t even be answered without first fetching
            the release plan to learn which tickets matter. Then each ticket required a separate
            lookup. This query costs{' '}
            <strong>{(agenticCostUSD / VANILLA_COST_USD).toFixed(1)}x more</strong> than vanilla —
            agentic systems are powerful but expensive on complex queries.
          </>
        )}
        {activeQueryIndex === 2 && (
          <>
            <strong>Simple query:</strong> Vanilla RAG nailed this with one call. The agentic
            system still looped — it doesn&apos;t know in advance whether looping is needed. Result:{' '}
            <strong>{(agenticCostUSD / VANILLA_COST_USD).toFixed(1)}x more expensive</strong> for
            the same answer. Agentic lift only pays off on hard, multi-step queries.
          </>
        )}
      </div>
    </div>
  );
}
