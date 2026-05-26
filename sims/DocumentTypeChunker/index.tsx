import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

type DocType = 'code' | 'markdown' | 'pdf' | 'html';

interface DocSample {
  label: string;
  text: string;
  chunks: string[];
  brokenRange: [number, number]; // start/end char indices within the joined-chunk text of the damage
  corruption: string;
}

const SAMPLES: Record<DocType, DocSample> = {
  code: {
    label: 'Code (Python)',
    text: `def calculate_discount(price, tier):\n    if tier == 'premium':\n        return price * 0.85\n    return price * 0.95`,
    chunks: [
      `def calculate_discount(price, tier):\n    if tier == 'premium':`,
      `\n        return price * 0.85\n    return price * 0.95`,
    ],
    brokenRange: [0, 1], // both chunks index
    corruption:
      'The if/return block is split mid-indent. Neither chunk is valid Python — the first has a dangling if with no body, the second has orphaned return statements.',
  },
  markdown: {
    label: 'Markdown',
    text: `## Refund Policy\n\nRefunds are processed within 5 business days.\nContact support@example.com for help.`,
    chunks: [
      `## Refund Policy\n\nRefunds are processed within 5`,
      ` business days.\nContact support@example.com for help.`,
    ],
    brokenRange: [0, 1],
    corruption:
      'The header "## Refund Policy" is separated from its content. The second chunk has no heading — the retriever has no idea what section it belongs to.',
  },
  pdf: {
    label: 'PDF with tables',
    text: `Pricing Table\n| Plan  | Price | Features      |\n| Basic | $9    | Email support |\n| Pro   | $29   | Email + chat  |`,
    chunks: [
      `Pricing Table\n| Plan  | Price | Features      |\n| Basic`,
      ` | $9    | Email support |\n| Pro   | $29   | Email + chat  |`,
    ],
    brokenRange: [0, 1],
    corruption:
      'The table row for "Basic" is sliced mid-row. Chunk 1 ends with "Basic" and no price; chunk 2 starts with a price and no plan name.',
  },
  html: {
    label: 'HTML',
    text: `<nav>Home | About | Contact</nav>\n<main>\n  <h1>Returns</h1>\n  <p>30-day window from purchase.</p>\n</main>`,
    chunks: [
      `<nav>Home | About | Contact</nav>\n<main>\n  <h1>Returns</h1>`,
      `\n  <p>30-day window from purchase.</p>\n</main>`,
    ],
    brokenRange: [0, 1],
    corruption:
      'Nav menu noise dominates chunk 1. The actual content ("Returns", "30-day window") is split across two chunks with broken HTML tags.',
  },
};

const DOC_TYPE_OPTIONS: { key: DocType; label: string }[] = [
  { key: 'code', label: 'Code' },
  { key: 'markdown', label: 'Markdown' },
  { key: 'pdf', label: 'PDF / table' },
  { key: 'html', label: 'HTML' },
];

const CHUNK_COLORS = ['#dc2626', '#d97706'];

export function DocumentTypeChunker() {
  const [docType, setDocType] = useState<DocType>('code');

  const sample = SAMPLES[docType];
  const chunkCount = sample.chunks.length;

  useEffect(() => {
    reportState('DocumentTypeChunker', { docType, chunkCount });
  }, [docType, chunkCount]);

  return (
    <div className={styles.sim} data-testid="document-type-chunker">
      <div className={styles.selector} role="group" aria-label="Document type">
        {DOC_TYPE_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.typeBtn} ${docType === key ? styles.active : ''}`}
            onClick={() => setDocType(key)}
            aria-pressed={docType === key}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.panels}>
        {/* Original */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Original document</div>
          <pre className={styles.codeBox}>{sample.text}</pre>
        </div>

        {/* After naive 100-char chunking */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            After naive 100-char chunking ({chunkCount} chunks)
          </div>
          <div className={styles.chunksDisplay} data-testid="chunks-display">
            {sample.chunks.map((chunk, i) => (
              <span
                key={i}
                className={styles.chunk}
                style={{
                  borderColor: CHUNK_COLORS[i % CHUNK_COLORS.length],
                  background: `${CHUNK_COLORS[i % CHUNK_COLORS.length]}10`,
                }}
              >
                <span
                  className={styles.chunkLabel}
                  style={{ color: CHUNK_COLORS[i % CHUNK_COLORS.length] }}
                >
                  chunk {i + 1}
                </span>
                <code className={styles.chunkText}>{chunk}</code>
                {i < sample.chunks.length - 1 && (
                  <span className={styles.splitMarker} title="chunk boundary">
                    ✂
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Corruption callout */}
      <div className={styles.corruptionCallout} data-testid="corruption-callout">
        <span className={styles.corruptionIcon}>!</span>
        <div>
          <span className={styles.corruptionTitle}>What got corrupted</span>
          <p className={styles.corruptionText}>{sample.corruption}</p>
        </div>
      </div>
    </div>
  );
}
