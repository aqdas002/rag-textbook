import { useEffect } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const RERANKERS = [
  { name: 'cohere rerank-3', vendor: 'Cohere', costPer1K: 2.0, latencyMs: 150, mtebRerank: 64.2 },
  { name: 'voyage rerank-2', vendor: 'Voyage', costPer1K: 1.8, latencyMs: 140, mtebRerank: 63.8 },
  { name: 'bge-reranker-v2-m3', vendor: 'BAAI (OSS)', costPer1K: 0, latencyMs: 120, mtebRerank: 62.5 },
  { name: 'jina-reranker-v2', vendor: 'Jina (OSS)', costPer1K: 0, latencyMs: 130, mtebRerank: 61.9 },
] as const;

const COST_MAX = 2.0;
const LATENCY_MAX = 200;
const QUALITY_MIN = 60;
const QUALITY_MAX = 65;

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className={styles.barTrack}>
      <div
        className={styles.barFill}
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function QualityBar({ value }: { value: number }) {
  const pct = Math.round(((value - QUALITY_MIN) / (QUALITY_MAX - QUALITY_MIN)) * 100);
  return (
    <div className={styles.barTrack}>
      <div
        className={styles.barFill}
        style={{ width: `${pct}%`, background: '#6366f1' }}
      />
    </div>
  );
}

function isApi(vendor: string) {
  return vendor === 'Cohere' || vendor === 'Voyage';
}

export function RerankerLandscape() {
  useEffect(() => {
    reportState('RerankerLandscape', { rerankerCount: RERANKERS.length });
  }, []);

  return (
    <figure className={styles.figure} data-testid="reranker-landscape">
      <div className={styles.tableWrapper}>
        <table className={styles.table} aria-label="Reranker comparison">
          <thead>
            <tr>
              <th className={styles.th}>Model</th>
              <th className={styles.th}>Type</th>
              <th className={styles.th}>
                Cost / 1K
                <span className={styles.axisHint}> ($0 → $2)</span>
              </th>
              <th className={styles.th}>
                Latency
                <span className={styles.axisHint}> (0 → 200ms)</span>
              </th>
              <th className={styles.th}>
                MTEB Rerank
                <span className={styles.axisHint}> (60–65)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {RERANKERS.map(r => {
              const api = isApi(r.vendor);
              return (
                <tr
                  key={r.name}
                  className={api ? styles.rowApi : styles.rowOss}
                  data-testid={`reranker-row-${r.name.replace(/\s+/g, '-')}`}
                >
                  <td className={styles.tdName}>
                    <code className={styles.modelName}>{r.name}</code>
                  </td>
                  <td className={styles.tdVendor}>
                    <span className={api ? styles.badgeApi : styles.badgeOss}>
                      {r.vendor}
                    </span>
                  </td>
                  <td className={styles.tdBar}>
                    {r.costPer1K === 0 ? (
                      <span className={styles.freeLabel}>free</span>
                    ) : (
                      <>
                        <Bar value={r.costPer1K} max={COST_MAX} color={api ? '#6366f1' : '#22c55e'} />
                        <span className={styles.barValue}>${r.costPer1K.toFixed(2)}</span>
                      </>
                    )}
                  </td>
                  <td className={styles.tdBar}>
                    <Bar value={r.latencyMs} max={LATENCY_MAX} color={api ? '#6366f1' : '#22c55e'} />
                    <span className={styles.barValue}>{r.latencyMs}ms</span>
                  </td>
                  <td className={styles.tdBar}>
                    <QualityBar value={r.mtebRerank} />
                    <span className={styles.barValue}>{r.mtebRerank}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#6366f1' }} />
          API (Cohere, Voyage)
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#22c55e' }} />
          OSS / self-host (BGE, Jina)
        </span>
      </div>

      <figcaption className={styles.caption}>
        API rerankers lead on quality; OSS options close the gap and cost $0 per call.
        Self-hosted BGE on a T4 GPU runs at ~120ms — competitive with Cohere&apos;s 150ms.
      </figcaption>
    </figure>
  );
}
