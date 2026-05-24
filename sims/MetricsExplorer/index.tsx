import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const QUERY = "How do I revoke a user's access?";

interface DocRow {
  rank: number;
  text: string;
  score: number;
  defaultRelevant: boolean;
}

const DOCS: DocRow[] = [
  { rank: 1, text: 'To remove permissions, navigate to Settings → Users and click Revoke.', score: 0.92, defaultRelevant: true },
  { rank: 2, text: 'Access tokens are issued by the auth server and stored in cookies.', score: 0.87, defaultRelevant: false },
  { rank: 3, text: 'Revoking access requires admin privileges on the team workspace.', score: 0.81, defaultRelevant: true },
  { rank: 4, text: 'The Users panel shows all members; select a member and choose Revoke Access.', score: 0.76, defaultRelevant: true },
  { rank: 5, text: 'User authentication uses OAuth 2.0 with PKCE for security.', score: 0.71, defaultRelevant: false },
  { rank: 6, text: 'To delete a user account permanently, contact support.', score: 0.65, defaultRelevant: false },
  { rank: 7, text: 'API access keys can be rotated from the developer settings page.', score: 0.59, defaultRelevant: false },
  { rank: 8, text: 'Granting access to new users is done from the same Settings → Users page.', score: 0.53, defaultRelevant: true },
  { rank: 9, text: 'Lost access usually means a session expired; sign in again.', score: 0.47, defaultRelevant: false },
  { rank: 10, text: 'Audit logs record every permission change with timestamp and actor.', score: 0.41, defaultRelevant: false },
];

// Default relevance: ranks 1, 3, 4, 8 are relevant
// Precision@5 = 3/5 = 0.6
// Recall@5 = 3/4 = 0.75
// MRR = 1/1 = 1.0

function computeMetrics(
  relevant: boolean[],
  k: number,
): {
  totalRelevant: number;
  relevantAtK: number;
  precisionAtK: number;
  recallAtK: number;
  mrr: number;
  apAtK: number;
  ndcgAtK: number;
  relevantRanks: number[];
} {
  const totalRelevant = relevant.filter(Boolean).length;
  const relevantRanks = relevant
    .map((r, i) => (r ? i + 1 : 0))
    .filter(r => r > 0);

  // Relevant in top-K
  const topK = relevant.slice(0, k);
  const relevantAtK = topK.filter(Boolean).length;

  // Precision@K
  const precisionAtK = relevantAtK / k;

  // Recall@K
  const recallAtK = totalRelevant === 0 ? 0 : relevantAtK / totalRelevant;

  // MRR: 1 / rank of first relevant doc (in full list)
  const firstRelevantRank = relevant.findIndex(Boolean);
  const mrr = firstRelevantRank === -1 ? 0 : 1 / (firstRelevantRank + 1);

  // AP@K: average of precision@i for each i in top-K where doc i is relevant
  // Denominator is number of relevant docs in top-K (standard average over relevant positions)
  let apSum = 0;
  let relevantSoFar = 0;
  for (let i = 0; i < k; i++) {
    if (topK[i]) {
      relevantSoFar++;
      apSum += relevantSoFar / (i + 1);
    }
  }
  const apAtK = relevantAtK === 0 ? 0 : apSum / relevantAtK;

  // nDCG@K: DCG@K / IDCG@K using binary relevance, discount = log2(rank+1)
  let dcg = 0;
  for (let i = 0; i < k; i++) {
    const gain = topK[i] ? 1 : 0;
    dcg += gain / Math.log2(i + 2); // log2((i+1)+1) = log2(i+2)
  }

  // Ideal DCG: place all relevant docs at top positions
  const idealPositions = Math.min(totalRelevant, k);
  let idcg = 0;
  for (let i = 0; i < idealPositions; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  const ndcgAtK = idcg === 0 ? 0 : dcg / idcg;

  return {
    totalRelevant,
    relevantAtK,
    precisionAtK,
    recallAtK,
    mrr,
    apAtK,
    ndcgAtK,
    relevantRanks,
  };
}

function getIntuitionMessage(
  precisionAtK: number,
  recallAtK: number,
  mrr: number,
  ndcgAtK: number,
  k: number,
): string {
  if (mrr > 0.6 && precisionAtK < 0.4) {
    return 'MRR is rewarding you for ranking the first relevant doc near the top, but most of your top-K is irrelevant. Good for the "show me the answer" use case; bad if your LLM has to filter.';
  }
  if (precisionAtK > 0.6 && recallAtK < 0.4) {
    return `Your top-${k} is dense with relevant docs, but you're missing most of the actually-relevant set. Good if K is tight; bad if your downstream LLM needs full coverage.`;
  }
  if (ndcgAtK > 0 && precisionAtK > ndcgAtK + 0.2) {
    return `Your top-${k} contains the right docs, but they're not in the right order. A reranker would help.`;
  }
  if (precisionAtK === 0 && recallAtK === 0) {
    return `No relevant docs in the top-${k}. Retrieval is missing the mark entirely — consider expanding K or improving embeddings.`;
  }
  if (precisionAtK >= 0.8 && recallAtK >= 0.8) {
    return 'Excellent retrieval! High precision and recall both — your system is surfacing the right docs without much noise.';
  }
  return `Precision@${k}: ${(precisionAtK * 100).toFixed(0)}% of retrieved docs are relevant. Recall@${k}: ${(recallAtK * 100).toFixed(0)}% of all relevant docs were found.`;
}

export function MetricsExplorer() {
  const [k, setK] = useState(5);
  const [relevance, setRelevance] = useState<boolean[]>(
    DOCS.map(d => d.defaultRelevant),
  );

  const metrics = useMemo(() => computeMetrics(relevance, k), [relevance, k]);

  const intuition = useMemo(
    () =>
      getIntuitionMessage(
        metrics.precisionAtK,
        metrics.recallAtK,
        metrics.mrr,
        metrics.ndcgAtK,
        k,
      ),
    [metrics, k],
  );

  useEffect(() => {
    reportState('MetricsExplorer', {
      k,
      totalRelevant: metrics.totalRelevant,
      relevantAtK: metrics.relevantAtK,
      precisionAtK: metrics.precisionAtK,
      recallAtK: metrics.recallAtK,
      mrr: metrics.mrr,
      apAtK: metrics.apAtK,
      ndcgAtK: metrics.ndcgAtK,
      relevantRanks: metrics.relevantRanks,
    });
  }, [k, metrics]);

  function toggleRelevance(index: number) {
    setRelevance(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }

  return (
    <div className={styles.sim}>
      <p className={styles.query}>
        <strong>Query:</strong> {QUERY}
      </p>

      <div className={styles.layout}>
        {/* Ranked list */}
        <div className={styles.rankedList}>
          <h4 className={styles.sectionTitle}>Ranked Results</h4>
          {DOCS.map((doc, i) => (
            <div
              key={doc.rank}
              data-testid={`doc-row-${doc.rank}`}
              className={`${styles.docRow} ${relevance[i] ? styles.relevant : ''} ${i < k ? styles.inTopK : styles.belowK}`}
            >
              <span className={styles.rankBadge}>#{doc.rank}</span>
              <span className={styles.docText}>{doc.text}</span>
              <span className={styles.scoreChip}>{doc.score.toFixed(2)}</span>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  data-testid={`relevance-toggle-${doc.rank}`}
                  checked={relevance[i]}
                  onChange={() => toggleRelevance(i)}
                  aria-label={`Mark rank ${doc.rank} as relevant`}
                />
                Relevant?
              </label>
            </div>
          ))}
          <p className={styles.hint}>
            Shaded rows are within top-K. Toggle relevance to see metrics update.
          </p>
        </div>

        {/* Metrics panel */}
        <div className={styles.metricsPanel}>
          <h4 className={styles.sectionTitle}>Metrics</h4>

          <label className={styles.sliderLabel}>
            <span>
              K:&nbsp;<strong>{k}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={k}
              aria-label="K — number of retrieved documents to evaluate"
              onChange={e => setK(Number(e.target.value))}
            />
          </label>

          <div className={styles.metricsList}>
            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>Precision@{k}</span>
                <span className={styles.metricValue}>
                  {metrics.precisionAtK.toFixed(3)}
                </span>
              </div>
              <p className={styles.metricExplain}>
                answers: what fraction of my top-{k} were relevant?
              </p>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${metrics.precisionAtK * 100}%`, background: '#6366f1' }}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>Recall@{k}</span>
                <span className={styles.metricValue}>
                  {metrics.recallAtK.toFixed(3)}
                </span>
              </div>
              <p className={styles.metricExplain}>
                answers: did I get any of the relevant docs in my top-{k}?
              </p>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${metrics.recallAtK * 100}%`, background: '#059669' }}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>MRR</span>
                <span className={styles.metricValue}>
                  {metrics.mrr.toFixed(3)}
                </span>
              </div>
              <p className={styles.metricExplain}>
                answers: how high did I rank the first relevant doc?
              </p>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${metrics.mrr * 100}%`, background: '#f59e0b' }}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>AP@{k}</span>
                <span className={styles.metricValue}>
                  {metrics.apAtK.toFixed(3)}
                </span>
              </div>
              <p className={styles.metricExplain}>
                answers: how consistently did I rank relevant docs above irrelevant ones?
              </p>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${metrics.apAtK * 100}%`, background: '#ec4899' }}
                />
              </div>
            </div>

            <div className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>nDCG@{k}</span>
                <span className={styles.metricValue}>
                  {metrics.ndcgAtK.toFixed(3)}
                </span>
              </div>
              <p className={styles.metricExplain}>
                answers: did I rank the most-relevant doc highest, and so on down the list?
              </p>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${metrics.ndcgAtK * 100}%`, background: '#0ea5e9' }}
                />
              </div>
            </div>
          </div>

          <div className={styles.summary}>
            <span>{metrics.relevantAtK} relevant in top-{k}</span>
            <span>{metrics.totalRelevant} total relevant</span>
          </div>

          {/* Intuition panel */}
          <div className={styles.intuitionPanel}>
            <strong className={styles.intuitionTitle}>Intuition</strong>
            <p className={styles.intuitionText}>{intuition}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
