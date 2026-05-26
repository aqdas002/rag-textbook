import { useState, useEffect } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const CANDIDATES = [5, 10, 20, 30, 50, 100];

function latencyMs(n: number) { return 30 + 6 * n; }
function costPer1K(n: number) { return 0.10 * n; }
function inSweetSpot(n: number) { return n >= 20 && n <= 30; }

function qualityLabel(n: number): string {
  if (n <= 10) return 'Good — may miss buried gems';
  if (n <= 30) return 'Sweet spot — catches synonyms & paraphrases';
  if (n <= 50) return 'Diminishing returns — noise increases';
  return 'Flat — quality saturated past N=50';
}

const N_MIN = 5;
const N_MAX = 100;
const LATENCY_MAX = latencyMs(N_MAX);   // 630ms
const COST_MAX = costPer1K(N_MAX);      // $10.00

export function TopNvsRerankCost() {
  const [selectedN, setSelectedN] = useState(20);

  const lat = latencyMs(selectedN);
  const cost = costPer1K(selectedN);
  const sweet = inSweetSpot(selectedN);

  useEffect(() => {
    reportState('TopNvsRerankCost', {
      selectedN,
      latencyMs: lat,
      costPer1K: cost,
      inSweetSpot: sweet,
    });
  }, [selectedN, lat, cost, sweet]);

  const latPct = (lat / LATENCY_MAX) * 100;
  const costPct = (cost / COST_MAX) * 100;

  return (
    <figure className={styles.figure} data-testid="top-n-vs-rerank-cost">
      {/* Slider */}
      <div className={styles.sliderRow}>
        <label className={styles.sliderLabel} htmlFor="top-n-slider">
          Candidates sent to reranker: <strong data-testid="selected-n">{selectedN}</strong>
        </label>
        <input
          id="top-n-slider"
          type="range"
          min={N_MIN}
          max={N_MAX}
          step={1}
          value={selectedN}
          onChange={e => setSelectedN(Number(e.target.value))}
          className={styles.slider}
          data-testid="n-slider"
        />
        <div className={styles.sliderTicks} aria-hidden>
          {CANDIDATES.map(c => (
            <span key={c} style={{ left: `${((c - N_MIN) / (N_MAX - N_MIN)) * 100}%` }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Metric bars */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Latency</span>
          <div className={styles.barTrack}>
            {sweet && <div className={styles.sweetZone} data-testid="sweet-zone" />}
            <div
              className={styles.barFill}
              style={{ width: `${latPct}%`, background: '#6366f1' }}
              data-testid="latency-bar"
            />
          </div>
          <span className={styles.metricValue} data-testid="latency-value">{lat}ms</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Cost / 1K queries</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${costPct}%`, background: '#f59e0b' }}
              data-testid="cost-bar"
            />
          </div>
          <span className={styles.metricValue} data-testid="cost-value">
            ${cost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Quality & sweet spot callout */}
      <div
        className={sweet ? `${styles.callout} ${styles.calloutSweet}` : styles.callout}
        data-testid="quality-callout"
      >
        <span className={styles.calloutIcon} aria-hidden>{sweet ? '★' : '○'}</span>
        <span className={styles.calloutText}>{qualityLabel(selectedN)}</span>
        {sweet && (
          <span className={styles.sweetBadge} data-testid="sweet-badge">sweet spot</span>
        )}
      </div>

      {/* Reference curve — sparkline dots for each candidate value */}
      <div className={styles.sparkRow} aria-label="Latency curve reference" role="img">
        {CANDIDATES.map(c => {
          const pct = (latencyMs(c) / LATENCY_MAX) * 100;
          const isSelected = c === selectedN || (selectedN > c && selectedN < (CANDIDATES[CANDIDATES.indexOf(c) + 1] ?? Infinity));
          return (
            <div key={c} className={styles.sparkItem}>
              <div className={styles.sparkBarWrap}>
                <div
                  className={`${styles.sparkBar} ${inSweetSpot(c) ? styles.sparkBarSweet : ''} ${isSelected ? styles.sparkBarActive : ''}`}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className={styles.sparkLabel}>{c}</span>
            </div>
          );
        })}
        <span className={styles.sparkAxisLabel}>latency ↑</span>
      </div>

      <figcaption className={styles.caption}>
        Cost and latency grow linearly with N. The sweet spot (N=20–30) gives the reranker
        enough candidates to recover buried relevant docs without paying for noise.
        Past N=50, quality is flat while cost keeps climbing.
      </figcaption>
    </figure>
  );
}
