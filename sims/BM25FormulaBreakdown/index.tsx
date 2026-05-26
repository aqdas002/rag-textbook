import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type ExampleQuery = 'the king' | 'E_AUTH_4096' | 'user account';

interface TermInfo {
  term: string;
  idf: number;
  note: string;
}

interface ExampleData {
  label: string;
  terms: TermInfo[];
  topDocs: { text: string; score: number }[];
  dominantTerm: string;
}

const EXAMPLES: Record<ExampleQuery, ExampleData> = {
  'the king': {
    label: '"the king"',
    dominantTerm: 'king',
    terms: [
      { term: 'the',  idf: 0.01, note: 'appears in every doc → near-zero IDF' },
      { term: 'king', idf: 2.84, note: 'rare in corpus → high IDF, dominates score' },
    ],
    topDocs: [
      { text: 'The king issued a royal decree across the realm.',        score: 4.21 },
      { text: 'A king rules by authority granted through succession.',   score: 3.87 },
      { text: 'Medieval governance centred on the king and his court.', score: 3.40 },
    ],
  },
  'E_AUTH_4096': {
    label: '"E_AUTH_4096"',
    dominantTerm: 'E_AUTH_4096',
    terms: [
      { term: 'E_AUTH_4096', idf: 6.90, note: 'appears in exactly 1 doc → maximum IDF' },
    ],
    topDocs: [
      { text: 'Error code E_AUTH_4096 indicates an expired session token.', score: 8.63 },
      { text: '(all other docs score 0 — term is absent)',                  score: 0.00 },
    ],
  },
  'user account': {
    label: '"user account"',
    dominantTerm: 'account',
    terms: [
      { term: 'user',    idf: 1.42, note: 'medium frequency — moderate IDF' },
      { term: 'account', idf: 1.89, note: 'less common than "user" → slightly higher IDF' },
    ],
    topDocs: [
      { text: 'User account settings can be updated in your profile page.', score: 5.18 },
      { text: 'Create a user account to access the full feature set.',      score: 4.76 },
      { text: 'Account users receive email notifications by default.',      score: 3.92 },
    ],
  },
};

const MAX_IDF = 7;

export function BM25FormulaBreakdown() {
  const [query, setQuery] = useState<ExampleQuery>('the king');

  const example = EXAMPLES[query];

  useEffect(() => {
    reportState('BM25FormulaBreakdown', {
      exampleQuery: query,
      dominantTerm: example.dominantTerm,
    });
  }, [query, example.dominantTerm]);

  return (
    <figure className={styles.figure} data-testid="bm25-formula-breakdown">
      {/* Color-coded formula */}
      <div className={styles.formulaRow} data-testid="bm25-formula">
        <span>BM25(d,q) = Σ </span>
        <span className={`${styles.part} ${styles.partIDF}`}>IDF(q_i)</span>
        <span> · [</span>
        <span className={`${styles.part} ${styles.partTF}`}>tf(q_i,d)</span>
        <span> · (</span>
        <span className={`${styles.part} ${styles.partK1}`}>k1</span>
        <span>+1)] / [</span>
        <span className={`${styles.part} ${styles.partTF}`}>tf(q_i,d)</span>
        <span> + </span>
        <span className={`${styles.part} ${styles.partK1}`}>k1</span>
        <span>·(1 − </span>
        <span className={`${styles.part} ${styles.partB}`}>b</span>
        <span> + </span>
        <span className={`${styles.part} ${styles.partB}`}>b</span>
        <span>·</span>
        <span className={`${styles.part} ${styles.partLen}`}>|d|/avgdl</span>
        <span>)]</span>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {[
          { label: 'IDF — rewards rare query terms', color: '#ede9fe' },
          { label: 'tf — rewards repetition (with saturation cap)', color: '#dbeafe' },
          { label: '|d|/avgdl — penalises long docs', color: '#ffedd5' },
          { label: 'k1 = 1.5 — TF saturation', color: '#f3f4f6' },
          { label: 'b = 0.75 — length normalisation', color: '#f3f4f6' },
        ].map(({ label, color }) => (
          <div key={label} className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: color, border: '1px solid #d1d5db' }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Query radio selector */}
      <div className={styles.radioRow}>
        {(Object.keys(EXAMPLES) as ExampleQuery[]).map(q => (
          <label key={q} className={styles.radioLabel}>
            <input
              type="radio"
              name="bm25-query"
              value={q}
              checked={query === q}
              onChange={() => setQuery(q)}
              data-testid={`query-radio-${q === 'the king' ? 'the-king' : q === 'E_AUTH_4096' ? 'e-auth-4096' : 'user-account'}`}
            />
            {EXAMPLES[q].label}
          </label>
        ))}
      </div>

      {/* Breakdown panel */}
      <div className={styles.breakdown} data-testid="breakdown-panel">
        <p className={styles.breakdownTitle}>IDF values for query terms</p>
        {example.terms.map(t => (
          <div key={t.term} className={styles.termRow}>
            <span className={styles.termToken}>{t.term}</span>
            <span
              className={styles.idfBar}
              style={{ width: `${Math.round((t.idf / MAX_IDF) * 120)}px` }}
            />
            <span className={styles.idfValue}>{t.idf.toFixed(2)}</span>
            <span style={{ color: '#6b7280', fontSize: '0.85em' }}>— {t.note}</span>
          </div>
        ))}

        <div className={styles.docList}>
          <div className={styles.docListTitle}>Top scoring docs in toy corpus</div>
          {example.topDocs.map((d, i) => (
            <div key={i} className={styles.docItem}>
              <span className={styles.docScore}>{d.score.toFixed(2)}</span>
              <span>{d.text}</span>
            </div>
          ))}
        </div>
      </div>

      <figcaption className={styles.caption}>
        IDF is the dominant weight. A single rare token (like an error code) can outscore a long common phrase.
      </figcaption>
    </figure>
  );
}
