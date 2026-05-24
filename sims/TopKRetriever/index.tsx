import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const CORPUS = [
  'Paris is the capital of France.',
  'The Eiffel Tower stands 330 meters tall and opened in 1889.',
  'France is famous for cheese, wine, and croissants.',
  'The Louvre in Paris is the most visited museum in the world.',
  'Tokyo is the largest metropolitan area in the world.',
  'Sushi originated as a method of preserving fish in fermented rice.',
  'Python is a high-level programming language created by Guido van Rossum.',
  'JavaScript runs in every web browser and was created in 1995.',
];

const QUERY = 'Tell me about Paris.';

interface Props {
  initialK?: number;
}

/** Tokenise a string into lowercase words. */
function tokenise(text: string): string[] {
  return (text.toLowerCase().match(/\w+/g) ?? []);
}

/** Toy bag-of-words cosine similarity: shared word fraction adjusted by frequency. */
function cosineSim(a: string, b: string): number {
  const tokA = tokenise(a);
  const tokB = tokenise(b);
  if (tokA.length === 0 || tokB.length === 0) return 0;

  // Build term-frequency maps
  const freqA = new Map<string, number>();
  const freqB = new Map<string, number>();
  for (const t of tokA) freqA.set(t, (freqA.get(t) ?? 0) + 1);
  for (const t of tokB) freqB.set(t, (freqB.get(t) ?? 0) + 1);

  // Dot product
  let dot = 0;
  for (const [term, fa] of freqA) {
    const fb = freqB.get(term) ?? 0;
    dot += fa * fb;
  }

  // Magnitudes
  const magA = Math.sqrt([...freqA.values()].reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt([...freqB.values()].reduce((s, v) => s + v * v, 0));

  return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
}

export function TopKRetriever({ initialK = 3 }: Props) {
  const [k, setK] = useState(initialK);

  const { ranked, topK, allScores } = useMemo(() => {
    const scored = CORPUS.map((doc, idx) => ({
      idx,
      doc,
      score: cosineSim(doc, QUERY),
    }));
    scored.sort((a, b) => b.score - a.score);

    const topKSet = new Set(scored.slice(0, k).map(d => d.idx));
    const ranked = scored.map((item, rank) => ({ ...item, rank, inTopK: topKSet.has(item.idx) }));
    const topK = scored.slice(0, k).map((item, rank) => ({
      doc: item.doc,
      score: item.score,
      rank: rank + 1,
    }));
    const allScores = CORPUS.map((doc, idx) => ({
      doc,
      score: scored.find(s => s.idx === idx)?.score ?? 0,
    }));

    return { ranked, topK, allScores };
  }, [k]);

  useEffect(() => {
    reportState('TopKRetriever', { k, query: QUERY, topK, allScores });
  }, [k, topK, allScores]);

  // Re-sort for display: put top-K first, then the rest
  const displayOrder = useMemo(() => {
    const inTop = ranked.filter(d => d.inTopK).sort((a, b) => a.rank - b.rank);
    const rest = ranked.filter(d => !d.inTopK);
    return [...inTop, ...rest];
  }, [ranked]);

  return (
    <div className={styles.sim}>
      <p>
        <strong>Query:</strong> {QUERY}
      </p>

      <label className={styles.sliderLabel}>
        K (number of results):&nbsp;<strong>{k}</strong>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={k}
          onChange={e => setK(Number(e.target.value))}
        />
      </label>

      <div className={styles.docList}>
        {displayOrder.map(item => (
          <div
            key={item.idx}
            data-testid={`doc-card-${item.idx}`}
            className={item.inTopK ? `${styles.docCard} ${styles.highlighted}` : styles.docCard}
          >
            {item.inTopK && (
              <span className={styles.rankBadge}>#{item.rank}</span>
            )}
            <span className={styles.docText}>{item.doc}</span>
            <span className={styles.scoreChip}>{item.score.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className={styles.topKPanel}>
        <h4>Top {k} retrieved documents</h4>
        {topK.map((item, i) => (
          <div key={i} className={styles.topKRow}>
            <span className={styles.rankBadge}>#{item.rank}</span>
            <span className={styles.docText}>{item.doc}</span>
            <span className={styles.scoreChip}>{item.score.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
