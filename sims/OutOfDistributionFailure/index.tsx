import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type Distribution = 'in' | 'out';

const BACKGROUND_WORDS = [
  // permissions cluster (center)
  { word: 'access',     x: 0.50, y: 0.62, cluster: 'permissions' },
  { word: 'revoke',     x: 0.55, y: 0.68, cluster: 'permissions' },
  { word: 'permission', x: 0.44, y: 0.70, cluster: 'permissions' },
  { word: 'user',       x: 0.58, y: 0.58, cluster: 'permissions' },
  { word: 'role',       x: 0.48, y: 0.56, cluster: 'permissions' },
  { word: 'admin',      x: 0.42, y: 0.64, cluster: 'permissions' },
  // auth cluster (nearby)
  { word: 'login',      x: 0.62, y: 0.72, cluster: 'auth' },
  { word: 'token',      x: 0.65, y: 0.65, cluster: 'auth' },
  { word: 'session',    x: 0.60, y: 0.78, cluster: 'auth' },
  // billing cluster (far)
  { word: 'invoice',    x: 0.15, y: 0.20, cluster: 'billing' },
  { word: 'payment',    x: 0.20, y: 0.14, cluster: 'billing' },
  { word: 'charge',     x: 0.12, y: 0.28, cluster: 'billing' },
  // infra cluster (far)
  { word: 'server',     x: 0.82, y: 0.18, cluster: 'infra' },
  { word: 'deploy',     x: 0.88, y: 0.24, cluster: 'infra' },
  { word: 'container',  x: 0.80, y: 0.28, cluster: 'infra' },
];

const CLUSTER_COLORS: Record<string, string> = {
  permissions: '#7c3aed',
  auth:        '#2563eb',
  billing:     '#f59e0b',
  infra:       '#10b981',
};

interface QueryConfig {
  label: string;
  text: string;
  dot: { x: number; y: number };
  cluster: string;
  top3: Array<{ doc: string; score: number; relevant: boolean }>;
  verdict: 'correct' | 'wrong';
  verdictText: string;
}

const QUERIES: Record<Distribution, QueryConfig> = {
  in: {
    label: 'In-distribution query',
    text: 'How do I revoke user access?',
    dot: { x: 0.52, y: 0.65 },
    cluster: 'permissions',
    top3: [
      { doc: 'Access Management / Revoke User Access',          score: 0.91, relevant: true },
      { doc: 'User Roles / Removing Permissions',              score: 0.87, relevant: true },
      { doc: 'Admin Guide / User Account Deactivation',        score: 0.83, relevant: true },
    ],
    verdict: 'correct',
    verdictText: 'Retrieved correct answer',
  },
  out: {
    label: 'Out-of-distribution query',
    text: 'How do I revoke AUTHZ-9 grants for tier-3 SKUs?',
    dot: { x: 0.32, y: 0.40 },
    cluster: 'none',
    top3: [
      { doc: 'Billing / SKU Pricing Tiers',                    score: 0.42, relevant: false },
      { doc: 'Infrastructure / Grant Deployment Scripts',      score: 0.39, relevant: false },
      { doc: 'Product Catalog / Tier Classification',         score: 0.36, relevant: false },
    ],
    verdict: 'wrong',
    verdictText: 'Retrieved unrelated docs',
  },
};

const MITIGATIONS = [
  { label: 'query rewriting', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd' },
  { label: 'synonym expansion', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  { label: 'fine-tune encoder on your jargon', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7' },
];

interface ScatterPanelProps {
  query: QueryConfig;
  dim?: number;
}

function ScatterPanel({ query, dim = 220 }: ScatterPanelProps) {
  const pad = 20;
  const inner = dim - pad * 2;

  return (
    <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className={styles.scatterSvg}>
      {/* background word dots */}
      {BACKGROUND_WORDS.map(w => {
        const cx = pad + w.x * inner;
        const cy = dim - pad - w.y * inner;
        const color = CLUSTER_COLORS[w.cluster] ?? '#6b7280';
        return (
          <g key={w.word} opacity={0.5}>
            <circle cx={cx} cy={cy} r={4} fill={color} />
            <text x={cx + 6} y={cy + 4} fontSize={8} fill="#6b7280">{w.word}</text>
          </g>
        );
      })}

      {/* query dot */}
      {(() => {
        const cx = pad + query.dot.x * inner;
        const cy = dim - pad - query.dot.y * inner;
        const inCluster = query.cluster !== 'none';
        return (
          <g>
            <circle cx={cx} cy={cy} r={8} fill={inCluster ? '#7c3aed' : '#dc2626'} opacity={0.9} />
            <circle cx={cx} cy={cy} r={12} fill="none" stroke={inCluster ? '#7c3aed' : '#dc2626'} strokeWidth={1.5} strokeDasharray="3 2" />
            <text x={cx} y={cy - 15} fontSize={9} fill={inCluster ? '#7c3aed' : '#dc2626'} fontWeight="bold" textAnchor="middle">
              query
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

export function OutOfDistributionFailure() {
  const [distribution, setDistribution] = useState<Distribution>('in');
  const query = QUERIES[distribution];

  useEffect(() => {
    reportState('OutOfDistributionFailure', { distribution });
  }, [distribution]);

  return (
    <div className={styles.sim} data-testid="out-of-distribution-failure">
      {/* Toggle */}
      <div className={styles.toggleRow} role="group" aria-label="Query distribution">
        {(['in', 'out'] as Distribution[]).map(d => (
          <button
            key={d}
            className={`${styles.toggleBtn} ${distribution === d ? styles.toggleBtnActive : ''}`}
            onClick={() => setDistribution(d)}
            aria-pressed={distribution === d}
            data-testid={`toggle-${d}`}
          >
            {d === 'in' ? 'In-distribution query' : 'Out-of-distribution query'}
          </button>
        ))}
      </div>

      {/* Main display */}
      <div className={styles.mainRow}>
        {/* Left: query + scatter */}
        <div className={styles.leftCol}>
          <div className={styles.queryBox} data-testid="query-text">
            <span className={styles.queryLabel}>Query</span>
            <span className={styles.queryText}>&ldquo;{query.text}&rdquo;</span>
          </div>
          <div className={styles.scatterWrap}>
            <div className={styles.scatterTitle}>2D embedding projection</div>
            <ScatterPanel query={query} />
          </div>
        </div>

        {/* Right: top-3 results + verdict */}
        <div className={styles.rightCol}>
          <div className={styles.resultsTitle}>Nearest 3 docs by cosine:</div>
          <div className={styles.resultsList} data-testid="results-list">
            {query.top3.map((r, i) => (
              <div key={i} className={`${styles.resultItem} ${r.relevant ? styles.resultRelevant : styles.resultIrrelevant}`}>
                <span className={styles.resultRank}>#{i + 1}</span>
                <span className={styles.resultDoc}>{r.doc}</span>
                <span className={styles.resultScore}>{r.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div
            className={`${styles.verdict} ${query.verdict === 'correct' ? styles.verdictCorrect : styles.verdictWrong}`}
            data-testid="verdict"
          >
            {query.verdict === 'correct' ? '✓' : '✗'} {query.verdictText}
          </div>
        </div>
      </div>

      {/* Mitigations */}
      <div className={styles.mitigationsRow}>
        <span className={styles.mitigationsLabel}>Mitigations:</span>
        {MITIGATIONS.map(m => (
          <span
            key={m.label}
            className={styles.chip}
            style={{ color: m.color, background: m.bg, borderColor: m.border }}
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
