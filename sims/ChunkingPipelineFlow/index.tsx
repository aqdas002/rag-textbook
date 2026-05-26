import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type StageKey =
  | 'source'
  | 'extract'
  | 'clean'
  | 'chunk'
  | 'embed'
  | 'index';

interface Stage {
  key: StageKey;
  label: string;
  detail: string;
  color: string;
  highlight?: boolean;
}

const INDEXING_STAGES: Stage[] = [
  {
    key: 'source',
    label: 'Source docs',
    detail: 'PDFs, HTML, Markdown, code repos — anything textual.',
    color: '#6b7280',
  },
  {
    key: 'extract',
    label: 'Extract text',
    detail: 'pypdf, BeautifulSoup, Unstructured.io — convert raw files to plain text.',
    color: '#2563eb',
  },
  {
    key: 'clean',
    label: 'Clean / normalize',
    detail: 'Drop boilerplate, strip nav menus, deduplicate repeated headers.',
    color: '#0891b2',
  },
  {
    key: 'chunk',
    label: 'Chunk',
    detail: 'Fixed / recursive / document-specific / semantic — see this chapter.',
    color: '#7c3aed',
    highlight: true,
  },
  {
    key: 'embed',
    label: 'Embed',
    detail: 'OpenAI text-embedding-3, Cohere Embed v3, BGE — see Chapter 2.',
    color: '#059669',
  },
  {
    key: 'index',
    label: 'Vector index',
    detail: 'Pinecone, Weaviate, Qdrant — HNSW or IVF index — see Chapter 3.',
    color: '#d97706',
  },
];

const QUERY_STAGES = [
  { label: 'Query', color: '#6b7280' },
  { label: 'Embed', color: '#059669' },
  { label: 'Vector index', color: '#d97706' },
  { label: 'top-K chunks', color: '#7c3aed' },
  { label: 'LLM context', color: '#dc2626' },
];

export function ChunkingPipelineFlow() {
  const [activeStage, setActiveStage] = useState<StageKey | null>(null);

  const activeDetail = activeStage
    ? INDEXING_STAGES.find(s => s.key === activeStage)?.detail ?? null
    : null;

  useEffect(() => {
    reportState('ChunkingPipelineFlow', { activeStage });
  }, [activeStage]);

  return (
    <div className={styles.sim} data-testid="chunking-pipeline-flow">
      {/* Indexing pipeline */}
      <div className={styles.sectionLabel}>Indexing pipeline</div>
      <div className={styles.pipeline} role="group" aria-label="Indexing pipeline stages">
        {INDEXING_STAGES.map((stage, i) => (
          <div key={stage.key} className={styles.stageRow}>
            <button
              className={`${styles.stageBox} ${stage.highlight ? styles.stageHighlight : ''} ${activeStage === stage.key ? styles.stageActive : ''}`}
              style={{
                borderColor: stage.highlight ? stage.color : activeStage === stage.key ? stage.color : '#d1d5db',
                color: stage.highlight ? stage.color : activeStage === stage.key ? stage.color : '#374151',
              }}
              onClick={() => setActiveStage(prev => (prev === stage.key ? null : stage.key))}
              aria-pressed={activeStage === stage.key}
              data-testid={`stage-${stage.key}`}
            >
              {stage.highlight && <span className={styles.focusBadge}>this chapter</span>}
              {stage.label}
            </button>
            {i < INDEXING_STAGES.length - 1 && (
              <span className={styles.arrow} aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div
        className={`${styles.detailPanel} ${activeDetail ? styles.detailVisible : ''}`}
        data-testid="detail-panel"
        aria-live="polite"
      >
        {activeDetail ? (
          <>
            <span className={styles.detailStageLabel}>
              {INDEXING_STAGES.find(s => s.key === activeStage)?.label}
            </span>
            <span className={styles.detailText}>{activeDetail}</span>
          </>
        ) : (
          <span className={styles.detailHint}>Click a stage to see details.</span>
        )}
      </div>

      {/* Query path */}
      <div className={styles.sectionLabel} style={{ marginTop: '1rem' }}>Query path</div>
      <div className={styles.queryPipeline}>
        {QUERY_STAGES.map((qs, i) => (
          <div key={qs.label} className={styles.stageRow}>
            <div
              className={styles.queryBox}
              style={{ borderColor: qs.color, color: qs.color }}
            >
              {qs.label}
            </div>
            {i < QUERY_STAGES.length - 1 && (
              <span className={styles.arrow} aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
