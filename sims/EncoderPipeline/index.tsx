import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type Stage = 'input' | 'tokenizer' | 'encoder' | 'output';

const STAGES: { id: Stage; label: string; short: string }[] = [
  { id: 'input', label: 'Raw text', short: '"the king reigns"' },
  { id: 'tokenizer', label: 'Tokenizer', short: 'BPE tokenizer' },
  { id: 'encoder', label: 'Encoder model', short: 'Transformer encoder' },
  { id: 'output', label: 'Embedding', short: '[1536 floats]' },
];

const STAGE_DETAIL: Record<Stage, { headline: string; body: string }> = {
  input: {
    headline: 'Raw text input',
    body: 'The string "the king reigns" is passed as-is. No preprocessing beyond Unicode normalization. The model handles punctuation, case, and whitespace internally.',
  },
  tokenizer: {
    headline: 'BPE tokenization → token IDs',
    body: '"the king reigns" → ["the", "▁king", "▁reigns"] → [464, 3364, 31723]\n\nByte-Pair Encoding splits text into subword units. Frequent words like "the" are single tokens; rarer words are split. Token IDs are integers — indices into the model\'s vocabulary of ~50k entries. Spaces are encoded as a leading ▁ (sentencepiece convention).',
  },
  encoder: {
    headline: 'Transformer encoder: attention → pooling → vector',
    body: 'The 3 token embeddings (lookup table rows) pass through N transformer layers. Each layer runs multi-head self-attention — every token attends to every other token — then a feed-forward block. After the final layer, all token representations are mean-pooled into one vector. That vector is projected to the output dimension (e.g. 1536). No causal mask: the encoder sees the full sequence bidirectionally.',
  },
  output: {
    headline: 'Embedding: 1536-dimensional float vector',
    body: '[0.021, -0.114, 0.337, 0.089, -0.201, ... ×1536]\n\nA dense, fixed-length vector of 32-bit floats. Each number is meaningless alone — the vector\'s position relative to other vectors encodes meaning. Stored in the vector index. At query time, cosine similarity between this vector and a query vector determines retrieval rank.',
  },
};

export function EncoderPipeline() {
  const [activeStage, setActiveStage] = useState<Stage | null>(null);

  useEffect(() => {
    reportState('EncoderPipeline', { activeStage: activeStage ?? 'none' });
  }, [activeStage]);

  function toggle(id: Stage) {
    setActiveStage(prev => (prev === id ? null : id));
  }

  const detail = activeStage ? STAGE_DETAIL[activeStage] : null;

  return (
    <figure className={styles.figure} data-testid="encoder-pipeline">
      <div className={styles.flow}>
        {STAGES.map((stage, i) => (
          <div key={stage.id} className={styles.flowItem}>
            <button
              type="button"
              className={`${styles.box} ${activeStage === stage.id ? styles.boxActive : ''}`}
              onClick={() => toggle(stage.id)}
              aria-expanded={activeStage === stage.id}
              aria-label={`${stage.label} — click to expand`}
              data-testid={`stage-${stage.id}`}
            >
              <span className={styles.boxLabel}>{stage.label}</span>
              <span className={styles.boxShort}>{stage.short}</span>
            </button>
            {i < STAGES.length - 1 && (
              <span className={styles.arrow} aria-hidden>→</span>
            )}
          </div>
        ))}
      </div>

      {detail && (
        <div className={styles.detail} data-testid="stage-detail">
          <strong className={styles.detailHead}>{detail.headline}</strong>
          <pre className={styles.detailBody}>{detail.body}</pre>
        </div>
      )}

      {!detail && (
        <p className={styles.hint}>Click any stage to see what happens inside it.</p>
      )}

      <figcaption className={styles.caption}>
        The encoder runs twice per RAG request: once at index time (per chunk) and once at query time.
        The tokenizer and encoder are fixed — only the input text changes.
      </figcaption>
    </figure>
  );
}
