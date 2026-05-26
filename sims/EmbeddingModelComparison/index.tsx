import { useEffect } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const MODELS = [
  { name: 'text-embedding-3-small', vendor: 'OpenAI', dim: 1536, cost: 0.02, mteb: 62.3 },
  { name: 'text-embedding-3-large', vendor: 'OpenAI', dim: 3072, cost: 0.13, mteb: 64.6 },
  { name: 'embed-english-v3', vendor: 'Cohere', dim: 1024, cost: 0.10, mteb: 64.5 },
  { name: 'voyage-2', vendor: 'Voyage', dim: 1024, cost: 0.10, mteb: 64.4 },
  { name: 'bge-large-en-v1.5', vendor: 'BAAI (OSS)', dim: 1024, cost: 0, mteb: 63.5 },
  { name: 'e5-large-v2', vendor: 'Microsoft (OSS)', dim: 1024, cost: 0, mteb: 62.2 },
] as const;

const VENDOR_COLORS: Record<string, string> = {
  'OpenAI': '#2563eb',
  'Cohere': '#059669',
  'Voyage': '#7c3aed',
  'BAAI (OSS)': '#d97706',
  'Microsoft (OSS)': '#0891b2',
};

const MAX_COST = Math.max(...MODELS.map(m => m.cost));
const MTEB_MIN = 62;
const MTEB_MAX = 65;

export function EmbeddingModelComparison() {
  useEffect(() => {
    reportState('EmbeddingModelComparison', { modelCount: 6 });
  }, []);

  return (
    <figure className={styles.figure} data-testid="embedding-model-comparison">
      <div className={styles.header}>
        <span className={styles.col1}>Model</span>
        <span className={styles.colDim}>Dim</span>
        <span className={styles.colBar}>Cost / 1M tokens</span>
        <span className={styles.colBar}>MTEB score</span>
      </div>
      <div className={styles.rows}>
        {MODELS.map(model => {
          const color = VENDOR_COLORS[model.vendor] ?? '#6b7280';
          const costPct = MAX_COST > 0 ? (model.cost / MAX_COST) * 100 : 0;
          const mtebPct = ((model.mteb - MTEB_MIN) / (MTEB_MAX - MTEB_MIN)) * 100;
          return (
            <div key={model.name} className={styles.row} data-testid={`model-row-${model.name}`}>
              <div className={styles.col1}>
                <span className={styles.modelName}>{model.name}</span>
                <span className={styles.vendorBadge} style={{ background: color + '1a', color }}>
                  {model.vendor}
                </span>
              </div>
              <div className={styles.colDim}>
                <span className={styles.dimBadge}>{model.dim.toLocaleString()}</span>
              </div>
              <div className={styles.colBar}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${Math.max(costPct, model.cost === 0 ? 0 : 4)}%`, background: color }}
                  />
                </div>
                <span className={styles.barLabel}>
                  {model.cost === 0 ? 'free' : `$${model.cost.toFixed(2)}`}
                </span>
              </div>
              <div className={styles.colBar}>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${Math.max(mtebPct, 4)}%`, background: color }}
                  />
                </div>
                <span className={styles.barLabel}>{model.mteb.toFixed(1)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className={styles.caption}>
        MTEB scores span a narrow 62–65 range — cost and operational fit often matter more than leaderboard rank.
        OSS models run locally at zero marginal cost.
      </figcaption>
    </figure>
  );
}
