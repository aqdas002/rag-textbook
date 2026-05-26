import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

function precisionAtK(k: number) { return Math.max(0.1, 1.0 - 0.04 * k); }
function recallAtK(k: number) { return Math.min(1.0, 0.15 * Math.log2(k + 1) + 0.1); }

function findCrossover(): number {
  for (let k = 1; k <= 19; k++) {
    if (precisionAtK(k) >= recallAtK(k) && precisionAtK(k + 1) < recallAtK(k + 1)) return k;
  }
  return 6;
}

const CROSSOVER = findCrossover();

export function KvsPrecisionRecall() {
  const [selectedK, setSelectedK] = useState(5);
  const svgRef = useRef<SVGSVGElement>(null);

  const precision = precisionAtK(selectedK);
  const recall = recallAtK(selectedK);

  useEffect(() => {
    reportState('KvsPrecisionRecall', {
      selectedK,
      precision: parseFloat(precision.toFixed(3)),
      recall: parseFloat(recall.toFixed(3)),
      crossoverPoint: CROSSOVER,
    });
  }, [selectedK, precision, recall]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 44 };
    const width = 540;
    const height = 220;
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([1, 20]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    // Grid lines
    g.append('g').selectAll('line').data(y.ticks(5)).join('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d))
      .attr('stroke', '#f3f4f6').attr('stroke-width', 1);

    // Axes
    g.append('g').attr('transform', `translate(0,${innerH})`).call(d3.axisBottom(x).ticks(10))
      .call(ag => ag.select('.domain').attr('stroke', '#d1d5db'))
      .call(ag => ag.selectAll('text').attr('font-size', 11).attr('fill', '#6b7280'));

    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.1f')))
      .call(ag => ag.select('.domain').attr('stroke', '#d1d5db'))
      .call(ag => ag.selectAll('text').attr('font-size', 11).attr('fill', '#6b7280'));

    // X label
    g.append('text').attr('x', innerW / 2).attr('y', innerH + 34)
      .attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#6b7280').text('K (documents retrieved)');

    // Lines
    const ks = d3.range(1, 21);
    const precLine = d3.line<number>().x(k => x(k)).y(k => y(precisionAtK(k))).curve(d3.curveMonotoneX);
    const recLine = d3.line<number>().x(k => x(k)).y(k => y(recallAtK(k))).curve(d3.curveMonotoneX);

    g.append('path').datum(ks).attr('d', precLine).attr('fill', 'none')
      .attr('stroke', '#7c3aed').attr('stroke-width', 2);
    g.append('path').datum(ks).attr('d', recLine).attr('fill', 'none')
      .attr('stroke', '#059669').attr('stroke-width', 2);

    // Crossover marker
    g.append('line')
      .attr('x1', x(CROSSOVER)).attr('x2', x(CROSSOVER))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#d97706').attr('stroke-width', 1).attr('stroke-dasharray', '4,3');
    g.append('text').attr('x', x(CROSSOVER) + 3).attr('y', 12)
      .attr('font-size', 10).attr('fill', '#d97706').text(`crossover K≈${CROSSOVER}`);

    // Selected K vertical line
    g.append('line')
      .attr('x1', x(selectedK)).attr('x2', x(selectedK))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#374151').attr('stroke-width', 1.5).attr('stroke-dasharray', '3,2');

    // Dots at selected K
    g.append('circle').attr('cx', x(selectedK)).attr('cy', y(precisionAtK(selectedK)))
      .attr('r', 5).attr('fill', '#7c3aed');
    g.append('circle').attr('cx', x(selectedK)).attr('cy', y(recallAtK(selectedK)))
      .attr('r', 5).attr('fill', '#059669');

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerW - 100}, 4)`);
    legend.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 5).attr('y2', 5)
      .attr('stroke', '#7c3aed').attr('stroke-width', 2);
    legend.append('text').attr('x', 18).attr('y', 9).attr('font-size', 10).attr('fill', '#374151').text('Precision');
    legend.append('line').attr('x1', 0).attr('x2', 14).attr('y1', 20).attr('y2', 20)
      .attr('stroke', '#059669').attr('stroke-width', 2);
    legend.append('text').attr('x', 18).attr('y', 24).attr('font-size', 10).attr('fill', '#374151').text('Recall');
  }, [selectedK]);

  return (
    <figure className={styles.figure} data-testid="kvs-precision-recall">
      <svg ref={svgRef} className={styles.svg} />
      <div className={styles.controls}>
        <label className={styles.label} htmlFor="k-slider">
          K = <strong>{selectedK}</strong>
        </label>
        <input
          id="k-slider"
          type="range"
          min={1}
          max={20}
          value={selectedK}
          onChange={e => setSelectedK(Number(e.target.value))}
          className={styles.slider}
          data-testid="k-slider"
        />
        <span className={styles.stats}>
          Precision: <strong>{precision.toFixed(2)}</strong> &nbsp;·&nbsp; Recall: <strong>{recall.toFixed(2)}</strong>
        </span>
      </div>
      <figcaption className={styles.caption}>
        Precision falls as K grows; recall climbs. Curves cross around K={CROSSOVER}. The right K depends on whether you have a reranker downstream.
      </figcaption>
    </figure>
  );
}
