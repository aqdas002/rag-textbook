import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Chunk {
  id: number;
  text: string;
}

interface QueryDef {
  text: string;
  hypotheticalAnswer: string;
  corpus: Chunk[];
  correctChunkId: number;
  rawCorrectRank: number;
  hydeCorrectRank: number;
  pedagogicalNote: string;
}

// ---------------------------------------------------------------------------
// Pre-loaded queries (hardcoded per pedagogical spec)
// ---------------------------------------------------------------------------

const QUERIES: QueryDef[] = [
  // ─── Query 0: HyDE big win ─────────────────────────────────────────────────
  {
    text: 'Why is my Postgres query slow on a large join?',
    hypotheticalAnswer:
      'Postgres queries on large joins are often slow because the optimizer falls back to a sequential scan when there\'s no index on the join column. Run EXPLAIN ANALYZE to see the query plan — a \'Seq Scan\' node on a joined table is the smoking gun. Add a B-tree index on the join column to let the planner switch to an index scan.',
    corpus: [
      {
        id: 0,
        text: 'Sequential scans on joined tables in PostgreSQL indicate a missing B-tree index. Use EXPLAIN ANALYZE to verify — look for a Seq Scan node. Adding an index on the join column lets the planner choose an index scan instead.',
      },
      {
        id: 1,
        text: 'Postgres performance can degrade on large joins if statistics are stale. Run ANALYZE on the tables involved to update planner statistics.',
      },
      {
        id: 2,
        text: 'Slow queries are often caused by missing indexes, inefficient joins, or poor query structure. Profile with a monitoring tool before optimizing.',
      },
    ],
    correctChunkId: 0,
    rawCorrectRank: 3,
    hydeCorrectRank: 1,
    pedagogicalNote:
      'The query uses conversational vocabulary (slow, large join) while the correct doc uses technical answer-style vocabulary (sequential scan, B-tree index, EXPLAIN ANALYZE). HyDE bridges that gap by generating answer-style text first.',
  },

  // ─── Query 1: HyDE modest win ──────────────────────────────────────────────
  {
    text: 'How do I reset my password?',
    hypotheticalAnswer:
      "To reset your password, navigate to the login page and click 'Forgot password.' Enter your email address; a password reset link will be sent. Click the link in the email and enter your new password. The link expires after 24 hours.",
    corpus: [
      {
        id: 0,
        text: "To reset your password, go to the login page, click 'Forgot password,' enter your email, and follow the link sent to your inbox.",
      },
      {
        id: 1,
        text: 'Password policies require at least 8 characters including one uppercase letter and one number.',
      },
      {
        id: 2,
        text: 'Account security settings let you enable two-factor authentication and manage your password preferences.',
      },
    ],
    correctChunkId: 0,
    rawCorrectRank: 2,
    hydeCorrectRank: 1,
    pedagogicalNote:
      'For common how-to questions, HyDE provides a modest improvement — the query and the answer share vocabulary, so raw retrieval already works reasonably well.',
  },

  // ─── Query 2: HyDE no benefit ──────────────────────────────────────────────
  {
    text: 'What is the warranty period for SKU XR-7700-B?',
    hypotheticalAnswer:
      'The warranty period for SKU XR-7700-B is 24 months from the date of purchase. The warranty covers manufacturing defects but excludes accidental damage or normal wear.',
    corpus: [
      {
        id: 0,
        text: 'SKU XR-7700-B carries a 24-month warranty from the date of purchase, covering manufacturing defects.',
      },
      {
        id: 1,
        text: 'Warranty claims must be submitted via the support portal with proof of purchase within the warranty period.',
      },
      {
        id: 2,
        text: 'Extended warranties are available for purchase within 30 days of the original product registration.',
      },
    ],
    correctChunkId: 0,
    rawCorrectRank: 1,
    hydeCorrectRank: 1,
    pedagogicalNote:
      'The exact SKU identifier (XR-7700-B) already dominates the similarity score for both raw and HyDE retrieval. HyDE provides no quality lift here, but still costs an extra LLM call and adds latency.',
  },
];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HYDE_ADDED_LATENCY_MS = 400;
const HYDE_ADDED_COST_USD = 0.001;
const TOP_N = 3;

// ---------------------------------------------------------------------------
// Retrieval quality label helper
// ---------------------------------------------------------------------------

function rankLabel(rank: number): string {
  if (rank === 1) return 'Rank 1 — correct answer at top';
  if (rank === 2) return 'Rank 2 — correct answer one step below top';
  return `Rank ${rank} — correct answer buried`;
}

function rankColor(rank: number): string {
  if (rank === 1) return '#059669';
  if (rank === 2) return '#d97706';
  return '#dc2626';
}

// ---------------------------------------------------------------------------
// Chunk ordering helpers
// Reorder corpus so that hardcoded ranks produce a stable top-3 display.
// Raw: correctChunkId appears at rawCorrectRank position.
// HyDE: correctChunkId appears at hydeCorrectRank position.
// ---------------------------------------------------------------------------

function buildRankedList(
  corpus: Chunk[],
  correctChunkId: number,
  correctRank: number,
): Chunk[] {
  const others = corpus.filter(c => c.id !== correctChunkId);
  const correct = corpus.find(c => c.id === correctChunkId)!;
  // Insert correct chunk at the desired rank (1-indexed)
  const result: Chunk[] = [...others];
  result.splice(correctRank - 1, 0, correct);
  return result.slice(0, TOP_N);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface HyDEvsRawProps {
  initialQueryIndex?: number;
}

export function HyDEvsRaw({ initialQueryIndex = 0 }: HyDEvsRawProps) {
  const [activeQueryIndex, setActiveQueryIndex] = useState(initialQueryIndex);

  const activeQuery = QUERIES[activeQueryIndex];
  const { rawCorrectRank, hydeCorrectRank } = activeQuery;
  const qualityLift = rawCorrectRank - hydeCorrectRank;

  const rawRanked = buildRankedList(
    activeQuery.corpus,
    activeQuery.correctChunkId,
    rawCorrectRank,
  );
  const hydeRanked = buildRankedList(
    activeQuery.corpus,
    activeQuery.correctChunkId,
    hydeCorrectRank,
  );

  useEffect(() => {
    reportState('HyDEvsRaw', {
      activeQuery: activeQuery.text,
      rawCorrectRank,
      hydeCorrectRank,
      qualityLift,
      hyDeAddedLatencyMs: HYDE_ADDED_LATENCY_MS,
      hyDeAddedCostUSD: HYDE_ADDED_COST_USD,
    });
  }, [activeQueryIndex, activeQuery.text, rawCorrectRank, hydeCorrectRank, qualityLift]);

  return (
    <div className={styles.sim}>
      {/* Query selector */}
      <div className={styles.queryRow}>
        <label htmlFor="hyde-query-select" className={styles.queryLabel}>
          <strong>Query:</strong>
        </label>
        <select
          id="hyde-query-select"
          value={activeQueryIndex}
          onChange={e => setActiveQueryIndex(Number(e.target.value))}
          className={styles.querySelect}
          aria-label="Select query"
        >
          {QUERIES.map((q, i) => (
            <option key={i} value={i}>
              {q.text}
            </option>
          ))}
        </select>
      </div>

      {/* Side-by-side columns */}
      <div className={styles.columns}>
        {/* LEFT: Raw query retrieval */}
        <div className={styles.panel} data-testid="raw-panel">
          <h4 className={styles.panelTitle}>Raw Query Retrieval</h4>

          <div className={styles.queryBox}>
            <span className={styles.queryBoxLabel}>Query:</span>
            <p className={styles.queryBoxText}>{activeQuery.text}</p>
          </div>

          <p className={styles.retrievalSubtitle}>Top-3 retrieved chunks</p>

          {rawRanked.map((chunk, i) => {
            const isCorrect = chunk.id === activeQuery.correctChunkId;
            return (
              <div
                key={chunk.id}
                data-testid={`raw-chunk-${i}`}
                className={`${styles.chunkCard} ${isCorrect ? styles.correctChunk : ''}`}
              >
                <span className={styles.rankBadge}>#{i + 1}</span>
                <span className={styles.chunkText}>
                  {isCorrect && <span className={styles.checkMark}>&#10003;</span>}
                  {chunk.text}
                </span>
              </div>
            );
          })}

          <div className={styles.qualityIndicator}>
            <span
              className={styles.qualityDot}
              style={{ background: rankColor(rawCorrectRank) }}
            />
            <span className={styles.qualityLabel} style={{ color: rankColor(rawCorrectRank) }}>
              {rankLabel(rawCorrectRank)}
            </span>
          </div>
        </div>

        {/* RIGHT: HyDE retrieval */}
        <div className={styles.panel} data-testid="hyde-panel">
          <h4 className={styles.panelTitle}>HyDE Retrieval</h4>

          <div className={styles.queryBox}>
            <span className={styles.queryBoxLabel}>Query:</span>
            <p className={styles.queryBoxText}>{activeQuery.text}</p>
          </div>

          <div className={styles.hypotheticalBox}>
            <span className={styles.hypotheticalLabel}>
              Hypothetical answer generated by LLM:
            </span>
            <p className={styles.hypotheticalText}>{activeQuery.hypotheticalAnswer}</p>
          </div>

          <p className={styles.retrievalSubtitle}>Top-3 retrieved chunks (embedded from hypothetical answer)</p>

          {hydeRanked.map((chunk, i) => {
            const isCorrect = chunk.id === activeQuery.correctChunkId;
            return (
              <div
                key={chunk.id}
                data-testid={`hyde-chunk-${i}`}
                className={`${styles.chunkCard} ${isCorrect ? styles.correctChunk : ''}`}
              >
                <span className={styles.rankBadge}>#{i + 1}</span>
                <span className={styles.chunkText}>
                  {isCorrect && <span className={styles.checkMark}>&#10003;</span>}
                  {chunk.text}
                </span>
              </div>
            );
          })}

          <div className={styles.qualityIndicator}>
            <span
              className={styles.qualityDot}
              style={{ background: rankColor(hydeCorrectRank) }}
            />
            <span className={styles.qualityLabel} style={{ color: rankColor(hydeCorrectRank) }}>
              {rankLabel(hydeCorrectRank)}
            </span>
          </div>

          {hydeCorrectRank < rawCorrectRank && (
            <div className={styles.annotation}>
              &#8593; correct answer at rank {hydeCorrectRank} (was rank {rawCorrectRank} in raw)
            </div>
          )}
          {hydeCorrectRank === rawCorrectRank && (
            <div className={styles.annotationNeutral}>
              same rank as raw retrieval — HyDE adds cost without quality benefit
            </div>
          )}
        </div>
      </div>

      {/* Quality lift summary */}
      <div className={styles.liftPanel}>
        {qualityLift > 0 ? (
          <span className={styles.liftPositive}>
            Quality lift: HyDE moved the correct answer from rank {rawCorrectRank} to rank{' '}
            {hydeCorrectRank} &#8593;
          </span>
        ) : qualityLift < 0 ? (
          <span className={styles.liftNegative}>
            Quality regression: HyDE moved the correct answer from rank {rawCorrectRank} to rank{' '}
            {hydeCorrectRank} &#8595;
          </span>
        ) : (
          <span className={styles.liftNeutral}>
            No quality lift: correct answer at rank {rawCorrectRank} in both approaches.
          </span>
        )}
        <span className={styles.liftCost}>
          {' '}HyDE adds <strong>+{HYDE_ADDED_LATENCY_MS}ms latency</strong> and{' '}
          <strong>+${HYDE_ADDED_COST_USD.toFixed(3)} cost</strong> (extra LLM call).
        </span>
      </div>

      {/* Explainer */}
      <div className={styles.explainerPanel}>
        <strong>How HyDE works:</strong> When the query and answer use different vocabulary, HyDE
        shifts the embedding closer to the answer&apos;s natural language. Instead of embedding the
        question, it embeds a hypothetical answer — documents matching that answer-style text are
        usually the real answer.
        {activeQuery.pedagogicalNote && (
          <span className={styles.pedagogicalNote}> {activeQuery.pedagogicalNote}</span>
        )}
      </div>
    </div>
  );
}
