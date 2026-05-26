import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type StageKey =
  | 'chunks'
  | 'tokenize-index'
  | 'embed'
  | 'vector'
  | 'vector-db'
  | 'topk'
  | 'query'
  | 'tokenize-query'
  | 'query-vector'
  | 'ann';

interface Stage {
  key: StageKey;
  label: string;
  detail: string;
  color: string;
  highlight?: boolean;
  badge?: string;
}

const INDEXING_STAGES: Stage[] = [
  {
    key: 'chunks',
    label: 'Chunks (from Ch 1)',
    detail: 'Text chunks produced by chunking pipeline — fixed-size, recursive, or document-specific. Size and overlap choices made here propagate through the whole pipeline.',
    color: '#7c3aed',
  },
  {
    key: 'tokenize-index',
    label: 'Tokenize',
    detail: 'Convert text to token IDs using the encoder\'s tokenizer (tiktoken for OpenAI, SentencePiece for many open-source models). Tokenization is model-specific — always use the tokenizer that matches your encoder.',
    color: '#0891b2',
  },
  {
    key: 'embed',
    label: 'Embed (encoder model)',
    detail: 'The encoder model maps the token sequence to a single fixed-length vector. OpenAI text-embedding-3, Cohere Embed v3, BGE, E5 — this is the step this chapter covers.',
    color: '#d97706',
    highlight: true,
    badge: 'this chapter',
  },
  {
    key: 'vector',
    label: 'Vector',
    detail: 'A dense float array — 384, 768, 1536, or 3072 dimensions depending on your model. This is what gets stored. Store the model name alongside every vector so you can detect encoder drift.',
    color: '#059669',
  },
  {
    key: 'vector-db',
    label: 'Vector DB index',
    detail: 'Pinecone, Weaviate, Qdrant, pgvector — stores vectors and metadata; builds an ANN index (HNSW or IVF) for fast approximate nearest-neighbor search. Covered in Chapter 3.',
    color: '#2563eb',
  },
  {
    key: 'topk',
    label: 'Top-K retrieval (Ch 3)',
    detail: 'ANN search returns the K vectors with highest cosine similarity to the query vector. K is a hyperparameter — larger K means more context for the LLM but more noise. Covered in Chapter 3.',
    color: '#dc2626',
  },
];

const QUERY_STAGES: Stage[] = [
  {
    key: 'query',
    label: 'Query',
    detail: 'The user\'s question — free-form text. May be rewritten or expanded before embedding (covered in a later chapter).',
    color: '#6b7280',
  },
  {
    key: 'tokenize-query',
    label: 'Tokenize',
    detail: 'Same tokenizer as the indexing path — model-specific. Mismatch here is silent and catastrophic.',
    color: '#0891b2',
  },
  {
    key: 'embed',
    label: 'Embed (SAME encoder!)',
    detail: 'The query is embedded with the exact same encoder model used at index time. Different encoder = different vector space = cosine similarity is meaningless. This is the single most common encoder bug in production.',
    color: '#d97706',
    highlight: true,
    badge: 'same encoder!',
  },
  {
    key: 'query-vector',
    label: 'Query vector',
    detail: 'A vector in the same space as the chunk vectors. Cosine similarity between query vector and chunk vectors is only meaningful because they share the same encoder geometry.',
    color: '#059669',
  },
  {
    key: 'ann',
    label: 'ANN search',
    detail: 'Approximate Nearest Neighbor search in the vector index. Returns the top-K chunk vectors by cosine similarity to the query vector. The results flow into the LLM context window.',
    color: '#2563eb',
  },
];

export function EmbeddingPipelineFlow() {
  const [activeStage, setActiveStage] = useState<StageKey | null>(null);

  // Find detail from whichever list has it
  const allStages = [...INDEXING_STAGES, ...QUERY_STAGES];
  const activeDetail = activeStage
    ? allStages.find(s => s.key === activeStage)?.detail ?? null
    : null;
  const activeLabel = activeStage
    ? allStages.find(s => s.key === activeStage)?.label ?? null
    : null;

  useEffect(() => {
    reportState('EmbeddingPipelineFlow', { activeStage });
  }, [activeStage]);

  function handleClick(key: StageKey) {
    setActiveStage(prev => (prev === key ? null : key));
  }

  return (
    <div className={styles.sim} data-testid="embedding-pipeline-flow">
      {/* Indexing pipeline */}
      <div className={styles.sectionLabel}>Indexing pipeline</div>
      <div className={styles.pipeline} role="group" aria-label="Indexing pipeline stages">
        {INDEXING_STAGES.map((stage, i) => (
          <div key={`idx-${stage.key}`} className={styles.stageRow}>
            <button
              className={`${styles.stageBox} ${stage.highlight ? styles.stageHighlight : ''} ${activeStage === stage.key ? styles.stageActive : ''}`}
              style={{
                borderColor: stage.highlight
                  ? stage.color
                  : activeStage === stage.key
                  ? stage.color
                  : '#d1d5db',
                color: stage.highlight
                  ? stage.color
                  : activeStage === stage.key
                  ? stage.color
                  : '#374151',
              }}
              onClick={() => handleClick(stage.key)}
              aria-pressed={activeStage === stage.key}
              data-testid={`stage-idx-${stage.key}`}
            >
              {stage.highlight && (
                <span className={styles.focusBadge}>{stage.badge}</span>
              )}
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
            <span className={styles.detailStageLabel}>{activeLabel}</span>
            <span className={styles.detailText}>{activeDetail}</span>
          </>
        ) : (
          <span className={styles.detailHint}>Click any stage to see what lives there.</span>
        )}
      </div>

      {/* Query pipeline */}
      <div className={styles.sectionLabel} style={{ marginTop: '1rem' }}>Query path</div>
      <div className={styles.pipeline} role="group" aria-label="Query pipeline stages">
        {QUERY_STAGES.map((stage, i) => (
          <div key={`qry-${stage.key}`} className={styles.stageRow}>
            <button
              className={`${styles.queryBox} ${stage.highlight ? styles.queryHighlight : ''} ${activeStage === stage.key ? styles.queryActive : ''}`}
              style={{
                borderColor: stage.highlight
                  ? stage.color
                  : activeStage === stage.key
                  ? stage.color
                  : '#d1d5db',
                color: stage.highlight
                  ? stage.color
                  : activeStage === stage.key
                  ? stage.color
                  : '#374151',
              }}
              onClick={() => handleClick(stage.key)}
              aria-pressed={activeStage === stage.key}
              data-testid={`stage-qry-${stage.key}`}
            >
              {stage.highlight && (
                <span className={styles.focusBadgeQuery}>{stage.badge}</span>
              )}
              {stage.label}
            </button>
            {i < QUERY_STAGES.length - 1 && (
              <span className={styles.arrow} aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>

      <p className={styles.keyNote}>
        The &ldquo;SAME encoder!&rdquo; annotation is the key teaching point — query and chunks must use identical
        encoder models or their vectors live in different spaces and cosine similarity is meaningless.
      </p>
    </div>
  );
}
