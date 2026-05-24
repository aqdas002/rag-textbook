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
const K = 3;

interface Props {
  initialLambda?: number;
}

interface DocScore {
  doc: string;
  score: number;
}

/** Tokenise a string into lowercase words. */
function tokenise(text: string): string[] {
  return text.toLowerCase().match(/\w+/g) ?? [];
}

/** Toy bag-of-words cosine similarity. */
function cosineSim(a: string, b: string): number {
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

/**
 * MMR selection:
 * score_i = λ * sim(d_i, q) - (1-λ) * max_{d_j ∈ selected} sim(d_i, d_j)
 * Greedily pick the doc maximising this score each round.
 */
function mmrSelect(corpus: string[], query: string, k: number, lambda: number): DocScore[] {
  const queryScores = corpus.map(doc => cosineSim(doc, query));
  const selected: number[] = [];
  const remaining = corpus.map((_, idx) => idx);

  for (let round = 0; round < k && remaining.length > 0; round++) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (const idx of remaining) {
      const relevance = queryScores[idx];
      const redundancy =
        selected.length === 0
          ? 0
          : Math.max(...selected.map(selIdx => cosineSim(corpus[idx], corpus[selIdx])));
      const mmrScore = lambda * relevance - (1 - lambda) * redundancy;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = idx;
      }
    }

    if (bestIdx === -1) break;
    selected.push(bestIdx);
    remaining.splice(remaining.indexOf(bestIdx), 1);
  }

  return selected.map(idx => ({ doc: corpus[idx], score: queryScores[idx] }));
}

/** Vanilla top-K by relevance only. */
function vanillaTopK(corpus: string[], query: string, k: number): DocScore[] {
  const scored = corpus.map(doc => ({ doc, score: cosineSim(doc, query) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

export function MMRRetriever({ initialLambda = 0.5 }: Props) {
  const [lambda, setLambda] = useState(initialLambda);

  const { mmrSelected, vanillaResults, divergenceCount } = useMemo(() => {
    const mmrSelected = mmrSelect(CORPUS, QUERY, K, lambda);
    const vanillaResults = vanillaTopK(CORPUS, QUERY, K);

    const vanillaDocs = new Set(vanillaResults.map(d => d.doc));
    const divergenceCount = mmrSelected.filter(d => !vanillaDocs.has(d.doc)).length;

    return { mmrSelected, vanillaResults, divergenceCount };
  }, [lambda]);

  useEffect(() => {
    reportState('MMRRetriever', {
      lambda,
      query: QUERY,
      mmrSelected,
      vanillaTopK: vanillaResults,
      divergenceCount,
    });
  }, [lambda, mmrSelected, vanillaResults, divergenceCount]);

  return (
    <div className={styles.sim}>
      <p>
        <strong>Query:</strong> {QUERY}
      </p>

      <label className={styles.sliderLabel}>
        <span>
          Lambda (λ):&nbsp;<strong>{lambda.toFixed(2)}</strong>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={lambda}
          aria-label="Lambda diversity weight"
          onChange={e => setLambda(Number(e.target.value))}
        />
      </label>
      <p className={styles.hint}>
        λ = 1 → pure relevance &nbsp;|&nbsp; λ = 0 → pure diversity
      </p>

      <div className={styles.columns}>
        <div className={styles.panel}>
          <h4 className={styles.panelTitle}>MMR Selected (λ = {lambda.toFixed(2)})</h4>
          {mmrSelected.map((item, i) => (
            <div
              key={i}
              data-testid={`mmr-card-${i}`}
              className={styles.docCard}
            >
              <span className={styles.rankBadge}>#{i + 1}</span>
              <span className={styles.docText}>{item.doc}</span>
              <span className={styles.scoreChip}>{item.score.toFixed(3)}</span>
            </div>
          ))}
        </div>

        <div className={styles.panel}>
          <h4 className={styles.panelTitle}>Vanilla Top-3 (relevance only)</h4>
          {vanillaResults.map((item, i) => (
            <div
              key={i}
              data-testid={`vanilla-card-${i}`}
              className={styles.docCard}
            >
              <span className={styles.rankBadge}>#{i + 1}</span>
              <span className={styles.docText}>{item.doc}</span>
              <span className={styles.scoreChip}>{item.score.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.divergenceNote}>
        MMR picked <strong>{divergenceCount}</strong> doc{divergenceCount !== 1 ? 's' : ''} that
        pure relevance didn&apos;t.
      </p>
    </div>
  );
}
