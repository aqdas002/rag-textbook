import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SOURCE_DOC = `# Returns Policy

## Eligibility

- 30 days from the date of purchase
- must include original packaging
- refunds processed within 5 business days`;

const CHUNK_BULLETS = `- 30 days from the date of purchase
- must include original packaging
- refunds processed within 5 business days`;

const CHUNK_WITH_HEADER = `Returns Policy / Eligibility /
- 30 days from the date of purchase
- must include original packaging
- refunds processed within 5 business days`;

const LLM_WITHOUT =
  '"I have a list of policies — 30 days from purchase, original packaging required, 5 business days to process — but I can\'t tell what these refer to. I don\'t have information about return windows."';

const LLM_WITH =
  '"The return window is 30 days from the date of purchase. Returns must include original packaging and refunds are processed within 5 business days."';

export function HeaderlessChunkFailure() {
  const [headerFixed, setHeaderFixed] = useState(false);

  useEffect(() => {
    reportState('HeaderlessChunkFailure', { headerFixed });
  }, [headerFixed]);

  return (
    <div className={styles.sim} data-testid="headerless-chunk-failure">
      {/* Panel 1: Source document */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelNum}>1</span>
          Source document
        </div>
        <pre className={styles.docBox}>{SOURCE_DOC}</pre>
      </div>

      {/* Panel 2: Chunk stored in vector DB */}
      <div className={`${styles.panel} ${headerFixed ? styles.panelFixed : styles.panelBroken}`}>
        <div className={styles.panelHeader}>
          <span className={styles.panelNum}>2</span>
          Stored in vector DB
          {!headerFixed && (
            <span className={styles.badge} data-status="broken">
              header stripped
            </span>
          )}
          {headerFixed && (
            <span className={styles.badge} data-status="fixed">
              header prepended
            </span>
          )}
        </div>
        <pre className={styles.chunkBox}>
          {headerFixed ? (
            <>
              <span className={styles.headerLine}>Returns Policy / Eligibility /</span>
              {'\n'}
              {CHUNK_BULLETS}
            </>
          ) : (
            CHUNK_BULLETS
          )}
        </pre>
      </div>

      {/* Panel 3: LLM at query time */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelNum}>3</span>
          LLM at query time
        </div>
        <div className={styles.conversation}>
          <div className={styles.bubble} data-role="user">
            <span className={styles.bubbleLabel}>User</span>
            <span className={styles.bubbleText}>"What is the return window?"</span>
          </div>
          <div className={styles.bubble} data-role="retriever">
            <span className={styles.bubbleLabel}>Retriever returns</span>
            <span className={styles.bubbleText}>
              {headerFixed ? CHUNK_WITH_HEADER : CHUNK_BULLETS}
            </span>
          </div>
          <div
            className={`${styles.bubble} ${headerFixed ? styles.bubbleSuccess : styles.bubbleFail}`}
            data-role="llm"
          >
            <span className={styles.bubbleLabel}>LLM</span>
            <span className={styles.bubbleText}>
              {headerFixed ? LLM_WITH : LLM_WITHOUT}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.fixRow}>
        <button
          className={`${styles.fixBtn} ${headerFixed ? styles.fixBtnActive : ''}`}
          onClick={() => setHeaderFixed(v => !v)}
          aria-pressed={headerFixed}
          data-testid="fix-toggle"
        >
          {headerFixed ? 'Undo: strip header' : 'Fix: prepend header'}
        </button>
        <span className={styles.fixHint}>
          {headerFixed
            ? 'Header prepended — LLM can now answer correctly.'
            : 'Toggle to see what prepending the header section fixes.'}
        </span>
      </div>
    </div>
  );
}
