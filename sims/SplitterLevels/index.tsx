import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SOURCE_TEXT =
  '## Refund Policy\n\n' +
  'Refunds are processed within 5 business days. To request a refund, contact support@example.com with your order number. Refunds are issued to the original payment method.\n\n' +
  '## Cancellation\n\n' +
  'Cancellations are accepted up to 24 hours before the scheduled service date. Late cancellations may be charged a 50% fee.';

type Level = 1 | 2 | 3 | 4 | 5;

interface Chunk {
  start: number;
  end: number;
  label?: string;
}

// Hardcoded chunk boundary definitions per level
const CHUNKS_BY_LEVEL: Record<Level, Chunk[]> = {
  // Level 1: fixed 100 chars — cuts mid-sentence
  1: [
    { start: 0, end: 100 },
    { start: 100, end: 200 },
    { start: 200, end: 300 },
    { start: 300, end: SOURCE_TEXT.length },
  ],
  // Level 2: split at \n\n first — paragraph boundaries
  2: [
    { start: 0, end: 18 },                         // "## Refund Policy"
    { start: 20, end: 181 },                        // refund body paragraph
    { start: 183, end: 197 },                       // "## Cancellation"
    { start: 199, end: SOURCE_TEXT.length },        // cancellation body
  ],
  // Level 3: markdown headers — 2 chunks, one per section
  3: [
    { start: 0, end: 181, label: '§ Refund Policy' },
    { start: 183, end: SOURCE_TEXT.length, label: '§ Cancellation' },
  ],
  // Level 4: semantic grouping by embedding similarity — same split as L3 for this text
  4: [
    { start: 0, end: 181, label: '§ Refund Policy (semantic)' },
    { start: 183, end: SOURCE_TEXT.length, label: '§ Cancellation (semantic)' },
  ],
  // Level 5: agentic — LLM proposes same as L3, adds section context
  5: [
    { start: 0, end: 181, label: '§ Refund Policy [context: payment refund procedures]' },
    { start: 183, end: SOURCE_TEXT.length, label: '§ Cancellation [context: appointment cancellation policy]' },
  ],
};

const LEVEL_META: Record<
  Level,
  { label: string; description: string; semanticAligned: boolean }
> = {
  1: {
    label: 'Level 1 — Fixed',
    description: 'Splits every 100 chars regardless of sentence or paragraph boundaries.',
    semanticAligned: false,
  },
  2: {
    label: 'Level 2 — Recursive char',
    description: 'Splits at \\n\\n first, then \\n, then ., then space — lands at paragraph/sentence ends.',
    semanticAligned: true,
  },
  3: {
    label: 'Level 3 — Markdown headers',
    description: 'Splits at ## headers — one chunk per section, each prefixed with its heading.',
    semanticAligned: true,
  },
  4: {
    label: 'Level 4 — Semantic',
    description: 'Groups sentences by embedding similarity — mirrors header splits for this text.',
    semanticAligned: true,
  },
  5: {
    label: 'Level 5 — Agentic',
    description: 'LLM proposes splits and adds section context summaries to each chunk.',
    semanticAligned: true,
  },
};

const CHUNK_COLORS = ['#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#dc2626'];

function renderTextWithChunks(chunks: Chunk[]) {
  const parts: { text: string; chunkIndex: number }[] = [];
  chunks.forEach((chunk, i) => {
    parts.push({ text: SOURCE_TEXT.slice(chunk.start, chunk.end), chunkIndex: i });
  });
  return parts;
}

export function SplitterLevels() {
  const [activeLevel, setActiveLevel] = useState<Level>(1);

  const chunks = CHUNKS_BY_LEVEL[activeLevel];
  const meta = LEVEL_META[activeLevel];
  const chunkCount = chunks.length;
  const maxLength = Math.max(...chunks.map(c => c.end - c.start));
  const { semanticAligned } = meta;

  useEffect(() => {
    reportState('SplitterLevels', { activeLevel, chunkCount, semanticAligned });
  }, [activeLevel, chunkCount, semanticAligned]);

  const parts = renderTextWithChunks(chunks);

  return (
    <div className={styles.sim} data-testid="splitter-levels">
      <div className={styles.levelSelector} role="group" aria-label="Splitter level">
        {([1, 2, 3, 4, 5] as Level[]).map(lvl => (
          <button
            key={lvl}
            className={`${styles.levelBtn} ${activeLevel === lvl ? styles.active : ''}`}
            onClick={() => setActiveLevel(lvl)}
            aria-pressed={activeLevel === lvl}
          >
            {LEVEL_META[lvl].label}
          </button>
        ))}
      </div>

      <p className={styles.description}>{meta.description}</p>

      <div className={styles.textDisplay}>
        {parts.map(({ text, chunkIndex }) => (
          <span
            key={chunkIndex}
            className={styles.chunkSpan}
            style={{
              borderLeft: `3px solid ${CHUNK_COLORS[chunkIndex % CHUNK_COLORS.length]}`,
              background: `${CHUNK_COLORS[chunkIndex % CHUNK_COLORS.length]}12`,
            }}
          >
            {chunks[chunkIndex].label && (
              <span
                className={styles.chunkLabel}
                style={{ color: CHUNK_COLORS[chunkIndex % CHUNK_COLORS.length] }}
              >
                {chunks[chunkIndex].label}
              </span>
            )}
            <span className={styles.chunkText}>{text}</span>
          </span>
        ))}
      </div>

      <p className={styles.stats}>
        <strong>{chunkCount}</strong> chunks &nbsp;·&nbsp; max length{' '}
        <strong>{maxLength}</strong> chars &nbsp;·&nbsp; semantic boundary alignment:{' '}
        <strong>{semanticAligned ? '✓' : '✗'}</strong>
      </p>
    </div>
  );
}
