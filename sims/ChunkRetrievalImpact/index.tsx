import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const CORPUS =
  'Paris is the capital of France. ' +
  'The Eiffel Tower opened in 1889. ' +
  'French is spoken by 300 million people worldwide. ' +
  'Croissants are a viennoiserie pastry. ' +
  'The Louvre houses the Mona Lisa.';

const QUERY = 'What is the capital of France?';
const RELEVANT_TEXT = 'capital of France';
const K = 2;

interface Props {
  initialChunkSize?: number;
}

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

// Toy "similarity": fraction of query-keywords present in the chunk.
function score(chunk: string, query: string): number {
  const keywords = query.toLowerCase().match(/\w+/g) ?? [];
  const lowered = chunk.toLowerCase();
  const hits = keywords.filter(k => lowered.includes(k)).length;
  return hits / keywords.length;
}

export function ChunkRetrievalImpact({ initialChunkSize = 64 }: Props) {
  const [chunkSize, setChunkSize] = useState(initialChunkSize);

  const { topK, precisionAtK } = useMemo(() => {
    const chunks = chunkText(CORPUS, chunkSize);
    const scored = chunks.map((c, i) => ({ idx: i, text: c, sim: score(c, QUERY) }));
    scored.sort((a, b) => b.sim - a.sim);
    const top = scored.slice(0, K);
    const relevant = top.filter(c => c.text.toLowerCase().includes(RELEVANT_TEXT.toLowerCase()));
    return { topK: top, precisionAtK: relevant.length / K };
  }, [chunkSize]);

  useEffect(() => {
    reportState('ChunkRetrievalImpact', {
      chunkSize,
      query: QUERY,
      topKChunks: topK.map(c => c.text),
      precisionAtK,
    });
  }, [chunkSize, topK, precisionAtK]);

  return (
    <div className={styles.sim}>
      <p>
        <strong>Query:</strong> {QUERY}
      </p>
      <label>
        Chunk size: <strong>{chunkSize}</strong>
        <input type="range" min={20} max={300} step={4} value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))} />
      </label>
      <p>
        <strong>Precision@{K}:</strong>{' '}
        <span className={precisionAtK === 1 ? styles.good : styles.bad}>
          {(precisionAtK * 100).toFixed(0)}%
        </span>
      </p>
      <div className={styles.topK}>
        <h4>Top {K} retrieved chunks:</h4>
        {topK.map((c, i) => (
          <div key={i} className={styles.chunk}>
            <span className={styles.score}>{c.sim.toFixed(2)}</span> "{c.text}"
          </div>
        ))}
      </div>
    </div>
  );
}
