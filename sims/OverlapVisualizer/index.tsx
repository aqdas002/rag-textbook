// sims/OverlapVisualizer/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SAMPLE_TEXT =
  'The retriever pulls chunks based on similarity. If the answer to your question ' +
  'spans the boundary between two chunks, neither chunk alone contains it. Shared ' +
  'text between adjacent chunks lets boundary-crossing facts survive retrieval.';

interface Props {
  initialChunkSize?: number;
  initialOverlap?: number;
}

export function OverlapVisualizer({ initialChunkSize = 80, initialOverlap = 20 }: Props) {
  const [chunkSize, setChunkSize] = useState(initialChunkSize);
  const [overlap, setOverlap] = useState(initialOverlap);
  const svgRef = useRef<SVGSVGElement>(null);

  const clampedOverlap = Math.min(overlap, chunkSize - 1);

  useEffect(() => {
    reportState('OverlapVisualizer', {
      chunkSize,
      overlap: clampedOverlap,
      textLength: SAMPLE_TEXT.length,
    });
  }, [chunkSize, clampedOverlap]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const lineHeight = 22;
    const charsPerLine = 80;
    const lines = Math.ceil(SAMPLE_TEXT.length / charsPerLine);
    svg.attr('viewBox', `0 0 ${width} ${lines * lineHeight + 10}`);

    const stride = chunkSize - clampedOverlap;
    if (stride <= 0) return;
    let i = 0;
    let chunkIdx = 0;
    const colors = d3.schemeTableau10;

    while (i < SAMPLE_TEXT.length) {
      const start = i;
      const end = Math.min(i + chunkSize, SAMPLE_TEXT.length);
      const overlapStart = chunkIdx > 0 ? start : start;
      const overlapEnd = chunkIdx > 0 ? Math.min(start + clampedOverlap, end) : start;

      drawRange(svg, start, end, colors[chunkIdx % colors.length]!, 0.3, charsPerLine, lineHeight, width);
      if (chunkIdx > 0 && clampedOverlap > 0) {
        drawRange(svg, overlapStart, overlapEnd, '#ef4444', 0.5, charsPerLine, lineHeight, width);
      }

      i += stride;
      chunkIdx++;
    }

    for (let line = 0; line < lines; line++) {
      svg
        .append('text')
        .attr('x', 4)
        .attr('y', line * lineHeight + 15)
        .attr('font-family', 'monospace')
        .attr('font-size', 13)
        .text(SAMPLE_TEXT.slice(line * charsPerLine, (line + 1) * charsPerLine));
    }
  }, [chunkSize, clampedOverlap]);

  return (
    <div className={styles.sim}>
      <label>
        Chunk size: <strong>{chunkSize}</strong>
        <input type="range" min={32} max={300} step={8} value={chunkSize}
          onChange={e => setChunkSize(Number(e.target.value))} />
      </label>
      <label>
        Overlap: <strong>{clampedOverlap}</strong>
        <input type="range" min={0} max={chunkSize - 1} step={4} value={clampedOverlap}
          onChange={e => setOverlap(Number(e.target.value))} />
      </label>
      <p className={styles.legend}>
        <span className={styles.overlapSwatch} /> red = shared region (text repeated in adjacent chunks)
      </p>
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}

function drawRange(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  start: number, end: number, color: string, opacity: number,
  charsPerLine: number, lineHeight: number, width: number,
) {
  const startLine = Math.floor(start / charsPerLine);
  const endLine = Math.floor((end - 1) / charsPerLine);
  const charW = width / charsPerLine;
  for (let line = startLine; line <= endLine; line++) {
    const x1 = (line === startLine ? start % charsPerLine : 0) * charW;
    const x2 = (line === endLine ? ((end - 1) % charsPerLine) + 1 : charsPerLine) * charW;
    svg.append('rect')
      .attr('x', x1).attr('y', line * lineHeight + 2)
      .attr('width', x2 - x1).attr('height', lineHeight - 4)
      .attr('fill', color).attr('opacity', opacity);
  }
}
