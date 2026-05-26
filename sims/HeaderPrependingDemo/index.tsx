import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const CHUNK_BULLETS =
  '- 30 days from the date of purchase\n- must include original packaging\n- refunds processed within 5 business days';

const HEADER_PREFIX = 'Returns Policy / Eligibility /';

const WITHOUT_SCORE = 0.42;
const WITH_SCORE = 0.81;
const THRESHOLD = 0.6;

const LLM_WITHOUT =
  '"I don\'t have information about return windows. The provided context describes purchase conditions but does not specify a return or refund period."';
const LLM_WITH =
  '"The return window is 30 days from the date of purchase. Returns must include original packaging and refunds are processed within 5 business days."';

export function HeaderPrependingDemo() {
  const [showLLM, setShowLLM] = useState(false);

  const withoutHeaderRetrieved = WITHOUT_SCORE >= THRESHOLD;
  const withHeaderRetrieved = WITH_SCORE >= THRESHOLD;

  useEffect(() => {
    reportState('HeaderPrependingDemo', {
      showingLLM: showLLM,
      withoutHeaderRetrieved,
      withHeaderRetrieved,
    });
  }, [showLLM, withoutHeaderRetrieved, withHeaderRetrieved]);

  return (
    <div className={styles.sim} data-testid="header-prepending-demo">
      <div className={styles.toolbar}>
        <span className={styles.query}>
          Query: <em>"what is the return window?"</em>
        </span>
        <button
          className={`${styles.toggleBtn} ${showLLM ? styles.active : ''}`}
          onClick={() => setShowLLM(v => !v)}
          aria-pressed={showLLM}
        >
          {showLLM ? 'Hide LLM input/output' : 'Show LLM input/output'}
        </button>
      </div>

      <div className={styles.columns}>
        {/* Without header */}
        <div className={`${styles.column} ${styles.withoutCol}`}>
          <h4 className={styles.colTitle}>Without header</h4>
          <pre className={styles.chunkBox}>{CHUNK_BULLETS}</pre>
          <div className={styles.scoreRow}>
            <span
              className={styles.scoreBadge}
              style={{ background: '#fee2e2', color: '#b91c1c' }}
            >
              cosine {WITHOUT_SCORE.toFixed(2)}
            </span>
            <span className={styles.retrievedBadge} data-retrieved="false">
              retrieved? ✗
            </span>
          </div>
          {showLLM && (
            <div className={styles.llmBox} data-testid="llm-without">
              <div className={styles.llmLabel}>LLM response</div>
              <p className={styles.llmText}>{LLM_WITHOUT}</p>
            </div>
          )}
        </div>

        {/* With header */}
        <div className={`${styles.column} ${styles.withCol}`}>
          <h4 className={styles.colTitle}>With header prepended</h4>
          <pre className={styles.chunkBox}>
            <span className={styles.headerPrefix}>{HEADER_PREFIX}{'\n'}</span>
            {CHUNK_BULLETS}
          </pre>
          <div className={styles.scoreRow}>
            <span
              className={styles.scoreBadge}
              style={{ background: '#dcfce7', color: '#15803d' }}
            >
              cosine {WITH_SCORE.toFixed(2)}
            </span>
            <span className={styles.retrievedBadge} data-retrieved="true">
              retrieved? ✓
            </span>
          </div>
          {showLLM && (
            <div className={`${styles.llmBox} ${styles.llmSuccess}`} data-testid="llm-with">
              <div className={styles.llmLabel}>LLM response</div>
              <p className={styles.llmText}>{LLM_WITH}</p>
            </div>
          )}
        </div>
      </div>

      <p className={styles.caption}>
        The word "return" appears in the header prefix but not in the bullets. Without context,
        the embedding score is too low to retrieve; with it, the chunk wins.
      </p>
    </div>
  );
}
