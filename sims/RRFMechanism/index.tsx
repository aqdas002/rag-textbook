import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

interface RankedDoc {
  docId: string;
  bm25Rank: number;
  bm25Score: number;
  denseRank: number;
  denseScore: number;
}

// Fixed toy corpus — 4 docs with deliberately different orderings
const DOCS: RankedDoc[] = [
  { docId: 'Doc A', bm25Rank: 1, bm25Score: 8.42, denseRank: 3, denseScore: 0.61 },
  { docId: 'Doc B', bm25Rank: 2, bm25Score: 6.18, denseRank: 1, denseScore: 0.89 },
  { docId: 'Doc C', bm25Rank: 3, bm25Score: 4.05, denseRank: 4, denseScore: 0.43 },
  { docId: 'Doc D', bm25Rank: 4, bm25Score: 1.77, denseRank: 2, denseScore: 0.77 },
];

function rrfScore(bm25Rank: number, denseRank: number, k: number): number {
  return 1 / (k + bm25Rank) + 1 / (k + denseRank);
}

export function RRFMechanism() {
  const [k, setK] = useState(60);

  const merged = useMemo(() => {
    return [...DOCS]
      .map(d => ({ ...d, rrf: rrfScore(d.bm25Rank, d.denseRank, k) }))
      .sort((a, b) => b.rrf - a.rrf);
  }, [k]);

  const topMergedDoc = merged[0]?.docId ?? '';

  useEffect(() => {
    reportState('RRFMechanism', { kConstant: k, topMergedDoc });
  }, [k, topMergedDoc]);

  const bm25Sorted = [...DOCS].sort((a, b) => a.bm25Rank - b.bm25Rank);
  const denseSorted = [...DOCS].sort((a, b) => a.denseRank - b.denseRank);

  const kNote = k < 30
    ? 'Small k: top rank dominates — big gap between #1 and #2'
    : k > 120
    ? 'Large k: ranks are nearly equal — a uniform blend'
    : 'k = 60 (default): moderate smoothing, consistent with Cormack et al. 2009';

  return (
    <div className={styles.sim} data-testid="rrf-mechanism">
      {/* k slider */}
      <div className={styles.sliderRow}>
        <span className={styles.sliderLabel}>RRF constant k =</span>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={k}
          onChange={e => setK(Number(e.target.value))}
          className={styles.slider}
          data-testid="rrf-k-slider"
        />
        <span className={styles.kValue}>{k}</span>
      </div>
      <p className={styles.kNote}>{kNote}</p>

      {/* Three columns */}
      <div className={styles.columns}>
        {/* BM25 column */}
        <div className={styles.panel} data-testid="rrf-bm25-col">
          <p className={styles.panelTitle}>BM25</p>
          {bm25Sorted.map(d => (
            <div key={d.docId} className={styles.docRow}>
              <span className={styles.rankBadge}>#{d.bm25Rank}</span>
              <span className={styles.docId}>{d.docId}</span>
              <span className={styles.score}>{d.bm25Score.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* RRF merged column */}
        <div className={styles.panel} data-testid="rrf-merged-col">
          <p className={styles.panelTitle}>RRF Merged</p>
          {merged.map((d, i) => (
            <div key={d.docId} className={styles.mergeRow}>
              <span className={styles.mergeDoc}>#{i + 1} {d.docId}</span>{' '}
              <span className={styles.mergeScore}>{d.rrf.toFixed(4)}</span>
              <div className={styles.mergeFormula}>
                1/{k}+{d.bm25Rank} + 1/{k}+{d.denseRank}
              </div>
            </div>
          ))}
        </div>

        {/* Dense column */}
        <div className={styles.panel} data-testid="rrf-dense-col">
          <p className={styles.panelTitle}>Dense</p>
          {denseSorted.map(d => (
            <div key={d.docId} className={styles.docRow}>
              <span className={styles.rankBadge}>#{d.denseRank}</span>
              <span className={styles.docId}>{d.docId}</span>
              <span className={styles.score}>{d.denseScore.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <figcaption className={styles.caption}>
        RRF uses only ranks, not raw scores — so BM25&apos;s unbounded scores and cosine&apos;s [0,1] range never need normalising.
        Drag the slider: small k makes top-rank dominance sharper; large k flattens the differences.
      </figcaption>
    </div>
  );
}
