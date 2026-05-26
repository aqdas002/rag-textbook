import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

interface Segment {
  label: string;
  ms: number;
  color: string;
  rerankOnly?: boolean;
}

const BASE_SEGMENTS: Segment[] = [
  { label: 'Query embedding', ms: 40, color: '#7c3aed' },
  { label: 'Dense ANN search', ms: 60, color: '#2563eb' },
  { label: 'Cross-encoder rerank', ms: 120, color: '#dc2626', rerankOnly: true },
  { label: 'LLM first token', ms: 300, color: '#059669' },
  { label: 'LLM completion', ms: 800, color: '#d97706' },
];

export function LatencyBreakdown() {
  const [rerankEnabled, setRerankEnabled] = useState(true);
  const [highlightFirstToken, setHighlightFirstToken] = useState(false);

  const segments = BASE_SEGMENTS.filter(s => !s.rerankOnly || rerankEnabled);
  const totalMs = segments.reduce((sum, s) => sum + s.ms, 0);
  const firstTokenMs = segments
    .filter(s => s.label !== 'LLM completion')
    .reduce((sum, s) => sum + s.ms, 0);

  useEffect(() => {
    reportState('LatencyBreakdown', { totalMs, firstTokenMs, rerankEnabled });
  }, [totalMs, firstTokenMs, rerankEnabled]);

  // Build cumulative positions for bar
  let cumulative = 0;
  const segmentRects = segments.map(s => {
    const start = cumulative;
    cumulative += s.ms;
    return { ...s, start, pctStart: start / totalMs * 100, pctWidth: s.ms / totalMs * 100 };
  });

  const firstTokenPct = firstTokenMs / totalMs * 100;

  return (
    <figure className={styles.figure} data-testid="latency-breakdown">
      <div className={styles.controls}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={rerankEnabled}
            onChange={e => setRerankEnabled(e.target.checked)}
            data-testid="rerank-toggle"
          />
          Rerank on
        </label>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={highlightFirstToken}
            onChange={e => setHighlightFirstToken(e.target.checked)}
            data-testid="first-token-toggle"
          />
          Highlight first-token point
        </label>
        <span className={styles.total}>Total: <strong>{totalMs} ms</strong></span>
      </div>

      <div className={styles.barContainer}>
        <div className={styles.bar}>
          {segmentRects.map(s => (
            <div
              key={s.label}
              className={styles.segment}
              style={{
                width: `${s.pctWidth}%`,
                backgroundColor: s.color,
                opacity: highlightFirstToken && s.label === 'LLM completion' ? 0.35 : 1,
              }}
              title={`${s.label}: ${s.ms} ms`}
              data-testid={`segment-${s.label.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span className={styles.segLabel}>{s.ms}ms</span>
            </div>
          ))}
          {highlightFirstToken && (
            <div
              className={styles.firstTokenMarker}
              style={{ left: `${firstTokenPct}%` }}
              data-testid="first-token-marker"
            >
              <div className={styles.markerLine} />
              <span className={styles.markerLabel}>first token<br />{firstTokenMs} ms</span>
            </div>
          )}
        </div>

        <div className={styles.legend}>
          {segmentRects.map(s => (
            <div key={s.label} className={styles.legendItem}>
              <span className={styles.legendSwatch} style={{ backgroundColor: s.color }} />
              <span className={styles.legendText}>{s.label} ({s.ms} ms)</span>
            </div>
          ))}
        </div>
      </div>

      <figcaption className={styles.caption}>
        LLM generation dominates total latency. Streaming delivers first-token at ~{firstTokenMs} ms — what users actually perceive.
        {rerankEnabled ? ' Reranker adds 120 ms but yields 10–20% quality lift.' : ''}
      </figcaption>
    </figure>
  );
}
