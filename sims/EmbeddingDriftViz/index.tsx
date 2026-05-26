import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// Model A (ada-002) — royalty cluster in top-left, animals top-right, food bottom-left, tech bottom-right
const MODEL_A_WORDS = [
  { word: 'king',      x: 0.12, y: 0.88, cluster: 'royalty' },
  { word: 'queen',     x: 0.18, y: 0.82, cluster: 'royalty' },
  { word: 'prince',    x: 0.10, y: 0.78, cluster: 'royalty' },
  { word: 'crown',     x: 0.22, y: 0.90, cluster: 'royalty' },
  { word: 'throne',    x: 0.15, y: 0.74, cluster: 'royalty' },
  { word: 'cat',       x: 0.78, y: 0.85, cluster: 'animals' },
  { word: 'dog',       x: 0.84, y: 0.80, cluster: 'animals' },
  { word: 'lion',      x: 0.76, y: 0.78, cluster: 'animals' },
  { word: 'wolf',      x: 0.88, y: 0.84, cluster: 'animals' },
  { word: 'pizza',     x: 0.12, y: 0.15, cluster: 'food' },
  { word: 'burger',    x: 0.18, y: 0.10, cluster: 'food' },
  { word: 'pasta',     x: 0.10, y: 0.22, cluster: 'food' },
  { word: 'sushi',     x: 0.22, y: 0.18, cluster: 'food' },
  { word: 'python',    x: 0.78, y: 0.18, cluster: 'tech' },
  { word: 'function',  x: 0.84, y: 0.12, cluster: 'tech' },
  { word: 'array',     x: 0.76, y: 0.24, cluster: 'tech' },
  { word: 'database',  x: 0.88, y: 0.20, cluster: 'tech' },
];

// Model B (text-embedding-3-small) — SAME words, clusters in different positions
// Royalty now top-RIGHT, animals bottom-LEFT, food top-left area, tech bottom-right
const MODEL_B_WORDS = [
  { word: 'king',      x: 0.78, y: 0.88, cluster: 'royalty' },
  { word: 'queen',     x: 0.84, y: 0.82, cluster: 'royalty' },
  { word: 'prince',    x: 0.76, y: 0.78, cluster: 'royalty' },
  { word: 'crown',     x: 0.88, y: 0.90, cluster: 'royalty' },
  { word: 'throne',    x: 0.81, y: 0.74, cluster: 'royalty' },
  { word: 'cat',       x: 0.12, y: 0.22, cluster: 'animals' },
  { word: 'dog',       x: 0.18, y: 0.16, cluster: 'animals' },
  { word: 'lion',      x: 0.10, y: 0.28, cluster: 'animals' },
  { word: 'wolf',      x: 0.22, y: 0.12, cluster: 'animals' },
  { word: 'pizza',     x: 0.22, y: 0.82, cluster: 'food' },
  { word: 'burger',    x: 0.15, y: 0.88, cluster: 'food' },
  { word: 'pasta',     x: 0.28, y: 0.78, cluster: 'food' },
  { word: 'sushi',     x: 0.18, y: 0.75, cluster: 'food' },
  { word: 'python',    x: 0.80, y: 0.18, cluster: 'tech' },
  { word: 'function',  x: 0.86, y: 0.12, cluster: 'tech' },
  { word: 'array',     x: 0.78, y: 0.24, cluster: 'tech' },
  { word: 'database',  x: 0.88, y: 0.20, cluster: 'tech' },
];

// Query "king" in Model B space — if we search Model A's index, nearest neighbor is "pizza" (different cluster)
const MIXED_QUERY_WORD = { word: 'king (B)', x: 0.78, y: 0.88 };
const MIXED_NEAREST = { word: 'pizza', score: 0.05, note: 'nearest in Model A index' };

const CLUSTER_COLORS: Record<string, string> = {
  royalty: '#8b5cf6',
  animals: '#10b981',
  food:    '#f59e0b',
  tech:    '#3b82f6',
};

const MIGRATION_OPTIONS = [
  { label: 'Re-embed everything', desc: 'Re-index all chunks with the new model before switching query encoder. One-time cost; clean cutover.' },
  { label: 'Run parallel indexes during transition', desc: 'Queries go to both indexes simultaneously; results merged. More complex but avoids a write-freeze.' },
  { label: 'Pin the model version forever', desc: 'Keep using the old model indefinitely. Simplest, but you lose quality improvements and risk deprecation.' },
];

interface ScatterProps {
  words: typeof MODEL_A_WORDS;
  title: string;
  highlightCluster?: string;
  showQueryVector?: boolean;
  dim?: number;
}

function Scatter({ words, title, highlightCluster, showQueryVector, dim = 200 }: ScatterProps) {
  const pad = 20;
  const inner = dim - pad * 2;

  return (
    <div className={styles.scatterWrap}>
      <div className={styles.scatterTitle}>{title}</div>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className={styles.scatterSvg}>
        {words.map(w => {
          const cx = pad + w.x * inner;
          const cy = dim - pad - w.y * inner;
          const color = CLUSTER_COLORS[w.cluster] ?? '#6b7280';
          const dim2 = highlightCluster && w.cluster !== highlightCluster ? 0.25 : 1;
          return (
            <g key={w.word} opacity={dim2}>
              <circle cx={cx} cy={cy} r={5} fill={color} />
              <text x={cx + 7} y={cy + 4} fontSize={9} fill="#1e293b">{w.word}</text>
            </g>
          );
        })}
        {showQueryVector && (
          <g>
            <circle
              cx={pad + MIXED_QUERY_WORD.x * inner}
              cy={dim - pad - MIXED_QUERY_WORD.y * inner}
              r={7} fill="none" stroke="#dc2626" strokeWidth={2}
            />
            <text
              x={pad + MIXED_QUERY_WORD.x * inner + 9}
              y={dim - pad - MIXED_QUERY_WORD.y * inner + 4}
              fontSize={9} fill="#dc2626" fontWeight="bold"
            >
              query
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

export function EmbeddingDriftViz() {
  const [showingMigrationPlan, setShowingMigrationPlan] = useState(false);

  useEffect(() => {
    reportState('EmbeddingDriftViz', { showingMigrationPlan });
  }, [showingMigrationPlan]);

  return (
    <div className={styles.sim} data-testid="embedding-drift-viz">
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Embedding Drift</span>
          <span className={styles.subtitle}>Same words, different vector spaces</span>
        </div>
      </div>

      {/* Side-by-side scatter plots */}
      <div className={styles.scatterRow}>
        <Scatter words={MODEL_A_WORDS} title="Model A (ada-002)" highlightCluster="royalty" />
        <div className={styles.vsLabel}>≠</div>
        <Scatter words={MODEL_B_WORDS} title="Model B (text-embedding-3-small)" highlightCluster="royalty" />
      </div>

      <p className={styles.caption}>
        The royalty cluster (purple) is top-left in Model A but top-right in Model B. Clusters have
        rotated — the geometry is incompatible. Each model defines its own coordinate system.
      </p>

      {/* Mixing panel */}
      <div className={styles.mixPanel} data-testid="mix-panel">
        <div className={styles.mixTitle}>What happens if you mix them?</div>
        <div className={styles.mixScatters}>
          <div className={styles.mixScatterBlock}>
            <div className={styles.mixLabel}>Query vector (from Model B space)</div>
            <Scatter
              words={MODEL_A_WORDS}
              title="Model A index"
              showQueryVector
              dim={180}
            />
          </div>
          <div className={styles.mixArrow}>→ ANN search →</div>
          <div className={styles.mixResult}>
            <div className={styles.mixResultTitle}>Nearest neighbor found:</div>
            <div className={styles.mixResultWord} data-testid="mix-result-word">{MIXED_NEAREST.word}</div>
            <div className={styles.mixResultScore}>cosine similarity: {MIXED_NEAREST.score}</div>
            <div className={styles.mixNote}>{MIXED_NEAREST.note}</div>
            <div className={styles.verdict} data-verdict="bad">Mixing models = nonsense retrieval.</div>
          </div>
        </div>
      </div>

      {/* Migration plan toggle */}
      <div className={styles.migrationRow}>
        <button
          className={`${styles.migrationToggle} ${showingMigrationPlan ? styles.migrationToggleActive : ''}`}
          onClick={() => setShowingMigrationPlan(v => !v)}
          aria-expanded={showingMigrationPlan}
          data-testid="migration-toggle"
        >
          {showingMigrationPlan ? 'Hide migration plan' : 'Migration plan'}
        </button>
        {showingMigrationPlan && (
          <div className={styles.migrationList} data-testid="migration-list">
            {MIGRATION_OPTIONS.map(opt => (
              <div key={opt.label} className={styles.migrationOption}>
                <span className={styles.migrationOptionLabel}>{opt.label}</span>
                <span className={styles.migrationOptionDesc}>{opt.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
