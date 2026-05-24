import { useState, useEffect, useMemo } from 'react';
import { reportState } from '../../src/lib/reportState';
import { WORDS } from '../EmbeddingSpace';
import styles from './index.module.css';

interface Props {
  initialA?: string;
  initialB?: string;
}

// Center coordinates around (0,0) so cosine similarity can go negative when
// phrases point to opposite quadrants of the embedding space.
const VOCAB = new Map(
  WORDS.map(w => [w.word, { x: w.x - 0.5, y: w.y - 0.5 }]),
);

function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z]+/g) ?? [];
}

function embed(phrase: string): { vec: [number, number] | null; recognized: string[] } {
  const tokens = tokenize(phrase);
  const recognized = tokens.filter(t => VOCAB.has(t));
  if (recognized.length === 0) return { vec: null, recognized: [] };
  const sum = recognized.reduce<[number, number]>(
    (acc, w) => {
      const v = VOCAB.get(w)!;
      return [acc[0] + v.x, acc[1] + v.y];
    },
    [0, 0],
  );
  return { vec: [sum[0] / recognized.length, sum[1] / recognized.length], recognized };
}

function cosine(a: [number, number], b: [number, number]): number {
  const dot = a[0] * b[0] + a[1] * b[1];
  const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function SimilarityScorer({
  initialA = 'the king and queen wear the crown',
  initialB = 'royalty rules the throne',
}: Props) {
  const [phraseA, setPhraseA] = useState(initialA);
  const [phraseB, setPhraseB] = useState(initialB);

  const a = useMemo(() => embed(phraseA), [phraseA]);
  const b = useMemo(() => embed(phraseB), [phraseB]);
  const similarity = a.vec && b.vec ? cosine(a.vec, b.vec) : 0;

  const displayBar = Math.max(0, Math.min(1, similarity));
  const barColor =
    similarity > 0.7 ? '#10b981' : similarity > 0.3 ? '#f59e0b' : '#ef4444';

  useEffect(() => {
    reportState('SimilarityScorer', {
      phraseA,
      phraseB,
      similarity,
      recognizedA: a.recognized,
      recognizedB: b.recognized,
    });
  }, [phraseA, phraseB, similarity, a.recognized, b.recognized]);

  return (
    <div className={styles.sim}>
      <label className={styles.field}>
        <span className={styles.label}>Phrase A</span>
        <textarea
          value={phraseA}
          onChange={e => setPhraseA(e.target.value)}
          rows={2}
        />
        <span className={styles.tokens}>
          recognized: {a.recognized.length ? a.recognized.join(', ') : '(none)'}
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Phrase B</span>
        <textarea
          value={phraseB}
          onChange={e => setPhraseB(e.target.value)}
          rows={2}
        />
        <span className={styles.tokens}>
          recognized: {b.recognized.length ? b.recognized.join(', ') : '(none)'}
        </span>
      </label>

      <div className={styles.scoreRow}>
        <span className={styles.scoreLabel}>Cosine similarity:</span>
        <strong className={styles.scoreValue}>{similarity.toFixed(2)}</strong>
      </div>
      <div className={styles.barTrack}>
        <div
          className={styles.barFill}
          style={{ width: `${displayBar * 100}%`, background: barColor }}
        />
      </div>

      <p className={styles.note}>
        Vocab is the 30 words from the embedding space. Tokens not in vocab are
        ignored — that's why <em>"the king sleeps"</em> and <em>"the king reigns"</em>
        score the same. Synonym swaps that stay in the same cluster keep similarity
        high; jumping clusters tanks it.
      </p>
    </div>
  );
}
