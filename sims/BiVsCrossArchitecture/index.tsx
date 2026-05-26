import { useEffect } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

export function BiVsCrossArchitecture() {
  useEffect(() => {
    reportState('BiVsCrossArchitecture', { rendered: true });
  }, []);

  return (
    <figure className={styles.figure} data-testid="bi-vs-cross-architecture">
      <div className={styles.panels}>
        {/* --- Bi-encoder panel --- */}
        <div className={styles.panel} data-testid="bi-encoder-panel">
          <h4 className={styles.panelTitle}>Bi-Encoder</h4>
          <div className={styles.diagram}>
            <div className={styles.parallelPaths}>
              <div className={styles.path}>
                <span className={styles.node}>query</span>
                <span className={styles.arrow}>→</span>
                <span className={`${styles.node} ${styles.nodeModel}`}>[encoder]</span>
                <span className={styles.arrow}>→</span>
                <span className={`${styles.node} ${styles.nodeVec}`}>[vector]</span>
              </div>
              <div className={styles.path}>
                <span className={styles.node}>doc</span>
                <span className={styles.arrow}>→</span>
                <span className={`${styles.node} ${styles.nodeModel}`}>[encoder]</span>
                <span className={styles.arrow}>→</span>
                <span className={`${styles.node} ${styles.nodeVec}`}>[vector]</span>
              </div>
            </div>
            <div className={styles.converge}>↘ &nbsp; ↗</div>
            <div className={styles.scoreBox} data-testid="bi-encoder-score">cosine similarity → score</div>
          </div>
          <p className={styles.label}>
            Embeddings computed once at index time per doc; query embedded once per query.
          </p>
          <dl className={styles.stats}>
            <div className={styles.statRow}>
              <dt>Index-time work</dt>
              <dd>1 forward pass per doc (offline)</dd>
            </div>
            <div className={styles.statRow}>
              <dt>Query-time work</dt>
              <dd>1 forward pass + K-NN lookup</dd>
            </div>
            <div className={styles.statRow}>
              <dt>Latency (1M corpus)</dt>
              <dd className={styles.statGood}>1 vector lookup, ~80ms</dd>
            </div>
          </dl>
        </div>

        <div className={styles.divider} aria-hidden />

        {/* --- Cross-encoder panel --- */}
        <div className={styles.panel} data-testid="cross-encoder-panel">
          <h4 className={styles.panelTitle}>Cross-Encoder</h4>
          <div className={styles.diagram}>
            <div className={styles.singlePath}>
              <span className={`${styles.node} ${styles.nodeWide}`}>query [SEP] doc</span>
              <span className={styles.arrow}>→</span>
              <span className={`${styles.node} ${styles.nodeModel}`}>[transformer — full attention]</span>
              <span className={styles.arrow}>→</span>
              <span className={`${styles.node} ${styles.nodeScore}`}>[single score]</span>
            </div>
          </div>
          <p className={styles.label}>
            Every (query, doc) pair requires one full transformer forward pass.
          </p>
          <dl className={styles.stats}>
            <div className={styles.statRow}>
              <dt>Index-time work</dt>
              <dd>None</dd>
            </div>
            <div className={styles.statRow}>
              <dt>Query-time work</dt>
              <dd>1 forward pass per candidate</dd>
            </div>
            <div className={styles.statRow}>
              <dt>Latency (1M corpus)</dt>
              <dd className={styles.statBad}>Impossible — 1M forward passes</dd>
            </div>
          </dl>
        </div>
      </div>

      <figcaption className={styles.caption}>
        The bi-encoder&apos;s speed comes from precomputation: doc vectors are fixed at index time.
        The cross-encoder&apos;s precision comes from seeing both inputs simultaneously — but every
        pair needs a fresh forward pass.
      </figcaption>
    </figure>
  );
}
