import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const QUERY = "How do I revoke a user's access?";

interface Doc {
  text: string;
  relevance: number;
}

const CORPUS: Doc[] = [
  { text: 'To remove permissions, navigate to Settings → Users and click Revoke.', relevance: 1.0 },
  { text: 'Access tokens are issued by the auth server and stored in cookies.', relevance: 0.1 },
  { text: 'Revoking access requires admin privileges on the team workspace.', relevance: 0.9 },
  { text: 'User authentication uses OAuth 2.0 with PKCE for security.', relevance: 0.1 },
  { text: 'The Users panel shows all members with their roles and last login.', relevance: 0.3 },
  { text: 'To delete a user account permanently, contact support.', relevance: 0.2 },
  { text: 'API access keys can be rotated from the developer settings page.', relevance: 0.2 },
  { text: 'Granting access to new users is done from the same Settings → Users page.', relevance: 0.4 },
  { text: 'Lost access usually means a session expired; sign in again.', relevance: 0.1 },
  { text: 'Audit logs record every permission change with timestamp and actor.', relevance: 0.3 },
];

interface Props {
  initialK?: number;
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had', 'i', 'me', 'my', 'we', 'our', 'to',
  'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'of', 'with', 'from',
  'how', 's', 'it', 'its', 'this', 'that', 'not', 'all', 'can',
]);

/** Tokenise a string into lowercase content words (stopwords filtered). */
function tokenise(text: string): string[] {
  const toks = text.toLowerCase().match(/\w+/g) ?? [];
  return toks.filter(t => !STOPWORDS.has(t));
}

/** Toy bag-of-words cosine similarity. */
function bowCosine(a: string, b: string): number {
  const tokA = tokenise(a);
  const tokB = tokenise(b);
  if (tokA.length === 0 || tokB.length === 0) return 0;

  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();
  for (const t of tokA) freqA.set(t, (freqA.get(t) ?? 0) + 1);
  for (const t of tokB) freqB.set(t, (freqB.get(t) ?? 0) + 1);

  let dot = 0;
  for (const [term, fa] of freqA) {
    dot += fa * (freqB.get(term) ?? 0);
  }

  const magA = Math.sqrt([...freqA.values()].reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt([...freqB.values()].reduce((s, v) => s + v * v, 0));

  return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
}

/** Cross-encoder score: 0.4 * bow_cosine + 0.6 * relevance */
function crossScore(doc: Doc, query: string): number {
  return 0.4 * bowCosine(doc.text, query) + 0.6 * doc.relevance;
}

function rankArrow(oldRank: number, newRank: number): string {
  if (newRank < oldRank) return `↑ was #${oldRank}`;
  if (newRank > oldRank) return `↓ was #${oldRank}`;
  return `→ was #${oldRank}`;
}

export function RerankerVisualizer({ initialK = 5 }: Props) {
  const [k, setK] = useState(initialK);

  const { biEncoderTop, reranked, promotedToTop3 } = useMemo(() => {
    // Stage 1: bi-encoder — sort all 10 docs by bow cosine
    const biScored = CORPUS.map((doc, idx) => ({
      idx,
      text: doc.text,
      score: bowCosine(doc.text, QUERY),
      rank: 0,
    }));
    biScored.sort((a, b) => b.score - a.score);
    biScored.forEach((d, i) => { d.rank = i + 1; });

    // Stage 2: cross-encoder — take top-K from bi-encoder and re-score
    const topK = biScored.slice(0, k);
    const crossScored = topK.map(d => ({
      text: d.text,
      oldRank: d.rank,
      score: crossScore(CORPUS[d.idx], QUERY),
      newRank: 0,
    }));
    crossScored.sort((a, b) => b.score - a.score);
    crossScored.forEach((d, i) => { d.newRank = i + 1; });

    // Count docs promoted into top-3: newRank <= 3 but oldRank > 3
    const promotedToTop3 = crossScored.filter(d => d.newRank <= 3 && d.oldRank > 3).length;

    return {
      biEncoderTop: biScored.map(d => ({ text: d.text, score: d.score, rank: d.rank })),
      reranked: crossScored,
      promotedToTop3,
    };
  }, [k]);

  useEffect(() => {
    reportState('RerankerVisualizer', {
      k,
      query: QUERY,
      biEncoderTop,
      reranked,
      promotedToTop3,
    });
  }, [k, biEncoderTop, reranked, promotedToTop3]);

  return (
    <div className={styles.sim}>
      <p>
        <strong>Query:</strong> {QUERY}
      </p>

      <label className={styles.sliderLabel}>
        <span>
          Top-K sent to reranker:&nbsp;<strong>{k}</strong>
        </span>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={k}
          aria-label="Top-K for reranking"
          onChange={e => setK(Number(e.target.value))}
        />
      </label>

      <div className={styles.columns}>
        {/* Left: Bi-encoder Stage 1 */}
        <div className={styles.panel}>
          <h4 className={styles.panelTitle}>Stage 1 — Bi-encoder (bag-of-words cosine)</h4>
          {biEncoderTop.map((doc, i) => (
            <div
              key={i}
              data-testid={`bi-row-${i}`}
              className={`${styles.docCard} ${i < k ? styles.inTopK : ''}`}
            >
              <span className={styles.rankBadge}>#{doc.rank}</span>
              <span className={styles.docText}>{doc.text}</span>
              <span className={styles.scoreChip}>{doc.score.toFixed(3)}</span>
            </div>
          ))}
          <p className={styles.hint}>Top {k} (shaded) sent to reranker</p>
        </div>

        {/* Right: Cross-encoder Stage 2 */}
        <div className={styles.panel}>
          <h4 className={styles.panelTitle}>Stage 2 — Cross-encoder reranked</h4>
          {reranked.map((doc, i) => (
            <div
              key={i}
              data-testid={`rerank-row-${i}`}
              className={styles.docCard}
            >
              <span className={styles.rankBadge}>#{doc.newRank}</span>
              <span className={styles.docText}>{doc.text}</span>
              <span className={styles.scoreChip}>{doc.score.toFixed(3)}</span>
              <span className={doc.newRank < doc.oldRank ? styles.up : doc.newRank > doc.oldRank ? styles.down : styles.same}>
                {rankArrow(doc.oldRank, doc.newRank)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.statsPanel}>
        <strong>Reranker promoted {promotedToTop3} doc{promotedToTop3 !== 1 ? 's' : ''} into the top-3</strong>
        {promotedToTop3 > 0 && (
          <span className={styles.promotedNote}>
            {' '}— docs relevant but not keyword-rich get rescued by cross-encoder scoring
          </span>
        )}
      </div>
    </div>
  );
}
