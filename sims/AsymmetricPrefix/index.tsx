import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type Mode = 'correct' | 'wrong-no-prefix' | 'wrong-query-on-doc';

interface Scenario {
  label: string;
  query: string;
  queryPrefix: string;
  doc: string;
  docPrefix: string;
  cosine: number;
  description: string;
}

const SCENARIOS: Record<Mode, Scenario> = {
  'correct': {
    label: 'Correct prefixes',
    query: 'How do I revoke access?',
    queryPrefix: 'query:',
    doc: 'To remove permissions, navigate to Settings → Access Control and click Revoke.',
    docPrefix: 'passage:',
    cosine: 0.81,
    description: 'Both query and passage use the correct prefix. The model\'s asymmetric training kicks in: queries are mapped to a "question space" and passages to an "answer space" that are designed to be geometrically close when semantically matched.',
  },
  'wrong-no-prefix': {
    label: 'Missing prefix (query)',
    query: 'How do I revoke access?',
    queryPrefix: '',
    doc: 'To remove permissions, navigate to Settings → Access Control and click Revoke.',
    docPrefix: 'passage:',
    cosine: 0.62,
    description: 'The query is embedded as raw text without the "query:" prefix. The model maps it to the passage space instead of the question space. The geometric distance to the correctly-prefixed passage increases — you lose 10–15% retrieval quality on standard benchmarks.',
  },
  'wrong-query-on-doc': {
    label: 'Wrong prefix (doc uses query:)',
    query: 'How do I revoke access?',
    queryPrefix: 'query:',
    doc: 'To remove permissions, navigate to Settings → Access Control and click Revoke.',
    docPrefix: 'query:',
    cosine: 0.57,
    description: 'Both sides use "query:" prefix. The model maps both to the question space. This is the worst case: at-scale corpus indexing with the wrong prefix degrades retrieval silently, because every passage lands in the wrong part of the space and similarity scores drop across the board.',
  },
};

const MODES: Mode[] = ['correct', 'wrong-no-prefix', 'wrong-query-on-doc'];

function CosineMeter({ score, color }: { score: number; color: string }) {
  const pct = Math.round(score * 100);
  return (
    <div className={styles.meter}>
      <div className={styles.meterTrack}>
        <div
          className={styles.meterFill}
          style={{ width: `${pct}%`, background: color }}
          data-testid="cosine-fill"
        />
      </div>
      <span className={styles.meterLabel} style={{ color }}>{score.toFixed(2)}</span>
    </div>
  );
}

export function AsymmetricPrefix() {
  const [mode, setMode] = useState<Mode>('correct');
  const scenario = SCENARIOS[mode];
  const cosineScore = scenario.cosine;
  const color = cosineScore >= 0.75 ? '#059669' : cosineScore >= 0.65 ? '#d97706' : '#dc2626';

  useEffect(() => {
    reportState('AsymmetricPrefix', { mode, cosineScore });
  }, [mode, cosineScore]);

  return (
    <figure className={styles.figure} data-testid="asymmetric-prefix">
      <div className={styles.toggleRow}>
        {MODES.map(m => (
          <button
            key={m}
            type="button"
            className={`${styles.toggleBtn} ${mode === m ? styles.toggleActive : ''}`}
            onClick={() => setMode(m)}
            data-testid={`mode-${m}`}
          >
            {SCENARIOS[m].label}
          </button>
        ))}
      </div>

      <div className={styles.sides}>
        <div className={styles.side}>
          <div className={styles.sideLabel}>Query embedding</div>
          {scenario.queryPrefix && (
            <span className={styles.prefix} data-testid="query-prefix">{scenario.queryPrefix}</span>
          )}
          {!scenario.queryPrefix && (
            <span className={styles.prefixMissing} data-testid="query-prefix">no prefix</span>
          )}
          <div className={styles.text}>{scenario.query}</div>
        </div>

        <div className={styles.arrow} aria-hidden>
          <div className={styles.arrowLine} />
          <div className={styles.cosineBox} style={{ borderColor: color, color }}>
            <span className={styles.cosineWord}>cosine</span>
            <span className={styles.cosineVal}>{cosineScore.toFixed(2)}</span>
          </div>
          <div className={styles.arrowLine} />
        </div>

        <div className={styles.side}>
          <div className={styles.sideLabel}>Passage embedding</div>
          <span className={styles.prefix} data-testid="doc-prefix">{scenario.docPrefix}</span>
          <div className={styles.text}>{scenario.doc}</div>
        </div>
      </div>

      <CosineMeter score={cosineScore} color={color} />

      <div className={styles.desc}>{scenario.description}</div>

      <figcaption className={styles.caption}>
        E5 and BGE models require "query:" and "passage:" prefixes. Forgetting them costs 10–15%
        retrieval quality. OpenAI and Cohere bake asymmetry into training — no user-visible prefix needed.
      </figcaption>
    </figure>
  );
}
