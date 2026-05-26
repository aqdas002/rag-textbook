import { useEffect } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SAMPLE_TEXT = '"the king reigns over the realm"';

// 20 sparse vocabulary slots — only a few have non-zero values
const SPARSE_SLOTS: { token: string; value: number }[] = [
  { token: 'a',       value: 0 },
  { token: 'account', value: 0 },
  { token: 'also',    value: 0 },
  { token: 'by',      value: 0 },
  { token: 'crown',   value: 0 },
  { token: 'error',   value: 0 },
  { token: 'has',     value: 0 },
  { token: 'is',      value: 0 },
  { token: 'king',    value: 0.82 },
  { token: 'log',     value: 0 },
  { token: 'model',   value: 0 },
  { token: 'not',     value: 0 },
  { token: 'of',      value: 0 },
  { token: 'over',    value: 0.18 },
  { token: 'realm',   value: 0.71 },
  { token: 'reign',   value: 0.77 },
  { token: 'system',  value: 0 },
  { token: 'the',     value: 0.09 },
  { token: 'token',   value: 0 },
  { token: 'user',    value: 0 },
];

// 16-dim dense vector (continuous values between -1 and 1)
const DENSE_DIMS: number[] = [
   0.41, -0.29,  0.68, -0.13,  0.55,  0.33, -0.47,  0.21,
  -0.38,  0.74, -0.16,  0.59,  0.11, -0.63,  0.48, -0.22,
];

function valueToColor(v: number): string {
  // Map [-1, 1] to a blue-white-red scale
  const t = (v + 1) / 2; // 0..1
  const r = Math.round(255 * t);
  const b = Math.round(255 * (1 - t));
  const g = Math.round(80 + 100 * (1 - Math.abs(v)));
  return `rgb(${r},${g},${b})`;
}

const MAX_SPARSE = Math.max(...SPARSE_SLOTS.map(s => s.value));

export function SparseDenseRepresentation() {
  useEffect(() => {
    reportState('SparseDenseRepresentation', { rendered: true });
  }, []);

  return (
    <figure className={styles.figure} data-testid="sparse-dense-representation">
      <p className={styles.sampleText}>Sample text: {SAMPLE_TEXT}</p>

      <div className={styles.columns}>
        {/* Sparse panel */}
        <div className={styles.panel} data-testid="sparse-panel">
          <p className={styles.panelTitle}>Sparse (BM25 / SPLADE)</p>
          <p className={styles.panelLabel}>
            Vocab-sized vector — mostly zero. Non-zero only for tokens present in the text.
          </p>
          <div className={styles.sparseVector}>
            {SPARSE_SLOTS.map(slot => {
              const barH = slot.value > 0
                ? Math.max(4, Math.round((slot.value / MAX_SPARSE) * 40))
                : 2;
              const isActive = slot.value > 0;
              return (
                <div key={slot.token} className={styles.sparseSlot}>
                  <div
                    className={styles.sparseBar}
                    style={{
                      height: `${barH}px`,
                      background: isActive ? '#7c3aed' : '#e5e7eb',
                    }}
                  />
                  <span
                    className={`${styles.sparseToken} ${isActive ? styles.sparseTokenActive : ''}`}
                  >
                    {slot.token}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dense panel */}
        <div className={styles.panel} data-testid="dense-panel">
          <p className={styles.panelTitle}>Dense (embedding)</p>
          <p className={styles.panelLabel}>
            Fixed 16-dim vector — every position carries continuous semantic information.
          </p>
          <div className={styles.denseVector}>
            {DENSE_DIMS.map((v, i) => (
              <div
                key={i}
                className={styles.denseCell}
                style={{ background: valueToColor(v) }}
                title={`dim ${i}: ${v.toFixed(2)}`}
              >
                {v.toFixed(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <table className={styles.compTable} data-testid="comparison-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Sparse</th>
            <th>Dense</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vector size</td>
            <td>Vocabulary size (30k–100k)</td>
            <td>Fixed (768, 1536, …)</td>
          </tr>
          <tr>
            <td>Non-zero values</td>
            <td>Few (exact terms in text)</td>
            <td>All positions</td>
          </tr>
          <tr>
            <td>Match type</td>
            <td>Exact token match</td>
            <td>Semantic / synonym</td>
          </tr>
          <tr>
            <td>Compute cost</td>
            <td>O(text length)</td>
            <td>O(model forward pass)</td>
          </tr>
          <tr>
            <td>Fails on</td>
            <td>Paraphrase, synonyms</td>
            <td>Rare identifiers, OOV terms</td>
          </tr>
        </tbody>
      </table>

      <figcaption className={styles.caption}>
        Sparse vectors light up only for tokens present in the text; dense vectors encode meaning
        across all dimensions regardless of exact vocabulary overlap.
      </figcaption>
    </figure>
  );
}
