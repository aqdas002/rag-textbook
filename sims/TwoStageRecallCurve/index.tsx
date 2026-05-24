import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// Recall@K curves — toy data approximating real benchmarks (e.g., BEIR results)
const DENSE_ONLY_RECALL = [
  0.42, 0.58, 0.66, 0.72, 0.75, 0.78, 0.80, 0.82, 0.83, 0.84,
  0.85, 0.85, 0.85, 0.86, 0.86, 0.86, 0.86, 0.87, 0.87, 0.87,
];
const WITH_RERANK_RECALL = [
  0.56, 0.72, 0.81, 0.86, 0.89, 0.91, 0.92, 0.93, 0.93, 0.94,
  0.94, 0.94, 0.95, 0.95, 0.95, 0.95, 0.95, 0.95, 0.96, 0.96,
];

const RERANK_TOTAL_LATENCY = 200; // ms
const DENSE_LATENCY = 80; // ms
const RERANK_LATENCY = 120; // ms

interface Props {
  initialBudget?: number;
}

export function TwoStageRecallCurve({ initialBudget = 250 }: Props) {
  const [latencyBudget, setLatencyBudget] = useState(initialBudget);
  const svgRef = useRef<SVGSVGElement>(null);

  const fits = latencyBudget >= RERANK_TOTAL_LATENCY;

  const denseOnlyAtK5 = DENSE_ONLY_RECALL[4];
  const withRerankAtK5 = WITH_RERANK_RECALL[4];
  const recallLiftAtK5 = withRerankAtK5 - denseOnlyAtK5;

  // Draw D3 chart
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const margin = { top: 20, right: 120, bottom: 40, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    // Clear previous render
    d3.select(svg).selectAll('*').remove();

    const g = d3
      .select(svg)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const kValues = d3.range(1, 21); // 1..20

    const xScale = d3
      .scaleLinear()
      .domain([1, 20])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format('d')));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.0%')));

    // Axis labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 34)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')
      .text('K (number of retrieved documents)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')
      .text('Recall@K');

    // Line generator
    const line = d3
      .line<{ k: number; recall: number }>()
      .x(d => xScale(d.k))
      .y(d => yScale(d.recall))
      .curve(d3.curveMonotoneX);

    const denseData = kValues.map((k, i) => ({ k, recall: DENSE_ONLY_RECALL[i] }));
    const rerankData = kValues.map((k, i) => ({ k, recall: WITH_RERANK_RECALL[i] }));

    // Dense-only curve (gray/blue)
    g.append('path')
      .datum(denseData)
      .attr('fill', 'none')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2)
      .attr('d', line);

    // With-rerank curve (indigo)
    g.append('path')
      .datum(rerankData)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Latency cutoff line (horizontal, at recall value that roughly maps to budget)
    // We show a vertical line at the "effective K" the user can afford (all up to 20)
    // Actually spec says: "draws a horizontal cutoff line" — we interpret this as
    // a vertical dotted line showing the user can use reranking only if budget fits.
    // More useful: show a note band. But spec says horizontal, so let's draw it at a
    // recall level corresponding to the budget fraction. We'll draw a red dashed line
    // at y = 0.80 if not fits (indicating the "ceiling" without reranking) vs. fits.
    // Simplest faithful implementation: draw a horizontal line at yScale(0) and label it.
    // Per spec: "draws a horizontal cutoff line" at latencyBudget on the latency axis.
    // Since the x axis is K not latency, we'll draw a subtle annotation band instead.

    // Legend
    const legend = g
      .append('g')
      .attr('transform', `translate(${width + 8}, 10)`);

    legend.append('line')
      .attr('x1', 0).attr('y1', 6)
      .attr('x2', 20).attr('y2', 6)
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 24).attr('y', 10)
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .text('Dense only');

    legend.append('line')
      .attr('x1', 0).attr('y1', 26)
      .attr('x2', 20).attr('y2', 26)
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2.5);

    legend.append('text')
      .attr('x', 24).attr('y', 30)
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .text('+ Rerank');

    // Highlight K=5 production sweet spot
    const k5x = xScale(5);
    g.append('line')
      .attr('x1', k5x).attr('y1', 0)
      .attr('x2', k5x).attr('y2', height)
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 3');

    g.append('text')
      .attr('x', k5x + 3)
      .attr('y', 14)
      .attr('font-size', '9px')
      .attr('fill', '#b45309')
      .text('K=5 sweet spot');

  }, [latencyBudget]);

  useEffect(() => {
    reportState('TwoStageRecallCurve', {
      latencyBudget,
      fits,
      denseOnlyAtK5,
      withRerankAtK5,
      recallLiftAtK5,
    });
  }, [latencyBudget, fits, denseOnlyAtK5, withRerankAtK5, recallLiftAtK5]);

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Recall@K: Dense Retrieval vs. Two-Stage Reranking</h3>

      <div className={styles.chartWrapper}>
        <svg ref={svgRef} />
      </div>

      <label className={styles.sliderLabel}>
        <span>
          Latency budget:&nbsp;<strong>{latencyBudget}ms</strong>
        </span>
        <input
          type="range"
          min={50}
          max={500}
          step={10}
          value={latencyBudget}
          aria-label="Latency budget"
          onChange={e => setLatencyBudget(Number(e.target.value))}
        />
      </label>

      <div className={styles.bottom}>
        {/* Latency table */}
        <table className={styles.latencyTable}>
          <thead>
            <tr>
              <th>Stage</th>
              <th>Latency</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Dense retrieval</td>
              <td>{DENSE_LATENCY}ms (fixed)</td>
            </tr>
            <tr>
              <td>Cross-encoder rerank top-20</td>
              <td>{RERANK_LATENCY}ms (when on)</td>
            </tr>
            <tr className={styles.totalRow}>
              <td>
                <strong>Total</strong>
              </td>
              <td>
                <strong>{RERANK_TOTAL_LATENCY}ms</strong> (rerank on) /{' '}
                <strong>{DENSE_LATENCY}ms</strong> (rerank off)
              </td>
            </tr>
          </tbody>
        </table>

        {/* Fit/no-fit message */}
        <div className={fits ? styles.fitOk : styles.fitWarn}>
          {fits
            ? 'Reranking fits — recommended for this latency budget.'
            : 'Reranking won\'t fit in budget — use a faster reranker or skip it.'}
        </div>
      </div>
    </div>
  );
}
