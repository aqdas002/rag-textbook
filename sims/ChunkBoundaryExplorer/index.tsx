import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SAMPLE_TEXT =
  'Retrieval-Augmented Generation pairs a language model with a search step. ' +
  'Instead of asking the model to remember everything, you let it look things up at answer time. ' +
  'The lookup happens against chunks: small pieces carved out of your source documents. ' +
  'How you carve those chunks determines what the model can and cannot find.';

interface Props {
  initialChunkSize?: number;
  textLength?: number;
  textOverride?: string;
}

export function ChunkBoundaryExplorer({
  initialChunkSize = 128,
  textLength,
  textOverride,
}: Props) {
  const [chunkSize, setChunkSize] = useState(initialChunkSize);
  const text = textOverride ?? SAMPLE_TEXT;
  const length = textLength ?? text.length;
  const chunkCount = Math.ceil(length / chunkSize);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    reportState('ChunkBoundaryExplorer', { chunkSize, chunkCount, textLength: length });
  }, [chunkSize, chunkCount, length]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const charsPerLine = 80;
    const lineHeight = 20;
    const lines = Math.ceil(length / charsPerLine);
    const height = lines * lineHeight + 10;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    for (let i = 0; i < chunkCount; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, length);
      const startLine = Math.floor(start / charsPerLine);
      const endLine = Math.floor((end - 1) / charsPerLine);
      for (let line = startLine; line <= endLine; line++) {
        const x1 = (line === startLine ? start % charsPerLine : 0) * (width / charsPerLine);
        const x2 =
          (line === endLine ? ((end - 1) % charsPerLine) + 1 : charsPerLine) *
          (width / charsPerLine);
        svg
          .append('rect')
          .attr('x', x1)
          .attr('y', line * lineHeight + 2)
          .attr('width', x2 - x1)
          .attr('height', lineHeight - 4)
          .attr('fill', colorScale(String(i)))
          .attr('opacity', 0.35);
      }
    }

    for (let line = 0; line < lines; line++) {
      svg
        .append('text')
        .attr('x', 4)
        .attr('y', line * lineHeight + 15)
        .attr('font-family', 'monospace')
        .attr('font-size', 13)
        .text(text.slice(line * charsPerLine, (line + 1) * charsPerLine));
    }
  }, [chunkSize, chunkCount, length, text]);

  return (
    <div className={styles.sim}>
      <label className={styles.control}>
        Chunk size: <strong>{chunkSize}</strong> chars
        <input
          type="range"
          min={32}
          max={512}
          step={16}
          value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))}
        />
      </label>
      <p className={styles.stats}>
        <strong>{chunkCount}</strong> chunks from a {length}-char document
      </p>
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}
