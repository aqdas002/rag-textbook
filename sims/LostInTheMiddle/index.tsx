import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const TOTAL_CHUNKS = 10;

// U-shape: high at position 1, drops to minimum around position 5, recovers at position 10.
function correctnessPctForPosition(pos: number): number {
  // U-shape via cosine interpolation: pos 1=95, pos 5=60, pos 10=90
  const u = (pos - 1) / (TOTAL_CHUNKS - 1); // 0..1
  // fit: a*cos(2*pi*u) + b  => at u=0: a+b=95, at u=0.5: -a+b=60 => a=17.5, b=77.5
  const pct = 17.5 * Math.cos(2 * Math.PI * u) + 77.5;
  return Math.round(pct);
}

export function LostInTheMiddle() {
  const [position, setPosition] = useState(1);
  const correctnessPct = correctnessPctForPosition(position);
  const correct = correctnessPct >= 75;

  useEffect(() => {
    reportState('LostInTheMiddle', { position, correctnessPct });
  }, [position, correctnessPct]);

  return (
    <figure className={styles.figure} data-testid="lost-in-the-middle">
      <div className={styles.chunksRow} data-testid="chunks-row">
        {Array.from({ length: TOTAL_CHUNKS }, (_, i) => {
          const pos = i + 1;
          const isRelevant = pos === position;
          return (
            <button
              key={pos}
              className={[styles.chunk, isRelevant ? styles.chunkRelevant : ''].join(' ')}
              onClick={() => setPosition(pos)}
              data-testid={`chunk-${pos}`}
              title={`Move relevant chunk to position ${pos}`}
              aria-pressed={isRelevant}
            >
              {isRelevant ? (
                <span className={styles.badge}>✓</span>
              ) : (
                <span className={styles.chunkNum}>{pos}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.positionHint}>
        Click a chunk position to place the relevant chunk there
      </div>

      <div className={styles.slider}>
        <label htmlFor="position-slider" className={styles.sliderLabel}>
          Relevant chunk at position: <strong>{position}</strong>
        </label>
        <input
          id="position-slider"
          type="range"
          min={1}
          max={TOTAL_CHUNKS}
          value={position}
          onChange={e => setPosition(Number(e.target.value))}
          className={styles.rangeInput}
          data-testid="position-slider"
        />
        <div className={styles.sliderTicks}>
          <span>1 (start)</span>
          <span>5 (middle)</span>
          <span>10 (end)</span>
        </div>
      </div>

      <div className={styles.result} data-testid="result">
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>LLM correctly used the relevant chunk:</span>
          <span
            className={[styles.resultValue, correct ? styles.yes : styles.no].join(' ')}
            data-testid="correct-label"
          >
            {correct ? 'Yes' : 'No'}
          </span>
        </div>
        <div className={styles.resultRow}>
          <span className={styles.resultLabel}>Probability of correct answer:</span>
          <span className={styles.resultPct} data-testid="correctness-pct">
            {correctnessPct}%
          </span>
        </div>
        <div className={styles.uBar}>
          <div
            className={styles.uBarFill}
            style={{ width: `${correctnessPct}%`, backgroundColor: correct ? '#059669' : '#dc2626' }}
          />
        </div>
      </div>

      <figcaption className={styles.caption}>
        Liu et al. 2023: LLMs preferentially attend to chunks at the start and end of context.
        Chunks in the middle are under-weighted even when relevant. A reranker fixes this by placing the best chunk first.
      </figcaption>
    </figure>
  );
}
