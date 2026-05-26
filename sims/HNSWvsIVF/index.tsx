import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const HNSW_STATS = {
  buildTime: 'Slow (O(n log n))',
  queryLatency: '1–5 ms',
  recall: '0.96',
  bestFor: '<10M vectors, low-latency queries',
};

const IVF_STATS = {
  buildTime: 'Fast',
  queryLatency: '5–30 ms (linear in nprobe)',
  recall: '0.92',
  bestFor: '>10M vectors, batch-ish workloads',
};

function drawHNSW(container: SVGGElement) {
  const g = d3.select(container);
  // Three layers of nodes
  const layers = [
    [{ x: 100, y: 20 }],
    [{ x: 50, y: 70 }, { x: 100, y: 70 }, { x: 160, y: 70 }],
    [{ x: 20, y: 130 }, { x: 60, y: 130 }, { x: 100, y: 130 }, { x: 140, y: 130 }, { x: 180, y: 130 }],
  ];
  const colors = ['#7c3aed', '#2563eb', '#0891b2'];

  // Edges within layers
  const edgesWithin: Array<[{x:number,y:number},{x:number,y:number}]> = [
    [layers[1][0], layers[1][1]], [layers[1][1], layers[1][2]],
    [layers[2][0], layers[2][1]], [layers[2][1], layers[2][2]], [layers[2][2], layers[2][3]], [layers[2][3], layers[2][4]],
    [layers[2][0], layers[2][2]], [layers[2][1], layers[2][3]],
  ];

  // Edges between layers
  const edgesBetween: Array<[{x:number,y:number},{x:number,y:number}]> = [
    [layers[0][0], layers[1][0]], [layers[0][0], layers[1][1]], [layers[0][0], layers[1][2]],
    [layers[1][0], layers[2][0]], [layers[1][0], layers[2][1]],
    [layers[1][1], layers[2][2]],
    [layers[1][2], layers[2][3]], [layers[1][2], layers[2][4]],
  ];

  edgesBetween.forEach(([a, b]) => {
    g.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y)
      .attr('stroke', '#d1d5db').attr('stroke-width', 1).attr('stroke-dasharray', '3,2');
  });

  edgesWithin.forEach(([a, b]) => {
    g.append('line').attr('x1', a.x).attr('y1', a.y).attr('x2', b.x).attr('y2', b.y)
      .attr('stroke', '#9ca3af').attr('stroke-width', 1.5);
  });

  layers.forEach((layer, li) => {
    layer.forEach(node => {
      g.append('circle').attr('cx', node.x).attr('cy', node.y).attr('r', li === 0 ? 7 : li === 1 ? 6 : 5)
        .attr('fill', colors[li]).attr('stroke', 'white').attr('stroke-width', 1.5);
    });
  });

  // Layer labels
  ['L2 (top)', 'L1', 'L0 (base)'].forEach((label, i) => {
    g.append('text').attr('x', 200).attr('y', [20, 70, 130][i] + 4)
      .attr('font-size', 9).attr('fill', colors[i]).attr('font-weight', '600').text(label);
  });
}

function drawIVF(container: SVGGElement) {
  const g = d3.select(container);
  // 4 cluster centroids
  const centroids = [
    { x: 60, y: 50 }, { x: 150, y: 40 }, { x: 50, y: 120 }, { x: 155, y: 115 },
  ];
  const clusterColors = ['#7c3aed', '#2563eb', '#059669', '#d97706'];
  // vectors per cluster (offsets from centroid)
  const offsets = [
    [[-15, -15], [10, -18], [-18, 8], [12, 12], [-5, 20]],
    [[15, -12], [-12, -10], [18, 8], [-8, 14], [10, -20]],
    [[-12, -12], [14, -8], [-16, 10], [10, 15], [-5, -18]],
    [[12, -14], [-14, -10], [16, 8], [-10, 12], [8, -18]],
  ];

  // Cluster boundary circles
  centroids.forEach((c, ci) => {
    g.append('circle').attr('cx', c.x).attr('cy', c.y).attr('r', 32)
      .attr('fill', clusterColors[ci]).attr('fill-opacity', 0.07)
      .attr('stroke', clusterColors[ci]).attr('stroke-opacity', 0.3).attr('stroke-width', 1);
  });

  // Vectors (small dots)
  centroids.forEach((c, ci) => {
    offsets[ci].forEach(([dx, dy]) => {
      g.append('circle').attr('cx', c.x + dx).attr('cy', c.y + dy).attr('r', 3)
        .attr('fill', clusterColors[ci]).attr('opacity', 0.7);
    });
  });

  // Centroid markers (larger)
  centroids.forEach((c, ci) => {
    g.append('circle').attr('cx', c.x).attr('cy', c.y).attr('r', 6)
      .attr('fill', clusterColors[ci]).attr('stroke', 'white').attr('stroke-width', 2);
    g.append('text').attr('x', c.x).attr('y', c.y + 4).attr('text-anchor', 'middle')
      .attr('font-size', 8).attr('fill', 'white').attr('font-weight', 'bold').text('C');
  });
}

export function HNSWvsIVF() {
  const hnswRef = useRef<SVGGElement>(null);
  const ivfRef = useRef<SVGGElement>(null);

  useEffect(() => {
    reportState('HNSWvsIVF', { rendered: true });
  }, []);

  useEffect(() => {
    if (hnswRef.current) drawHNSW(hnswRef.current);
  }, []);

  useEffect(() => {
    if (ivfRef.current) drawIVF(ivfRef.current);
  }, []);

  const StatRow = ({ label, hnsw, ivf }: { label: string; hnsw: string; ivf: string }) => (
    <tr>
      <td className={styles.statLabel}>{label}</td>
      <td className={styles.statVal}>{hnsw}</td>
      <td className={styles.statVal}>{ivf}</td>
    </tr>
  );

  return (
    <figure className={styles.figure} data-testid="hnsw-vs-ivf">
      <div className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelTitle} style={{ color: '#7c3aed' }}>HNSW</div>
          <svg viewBox="0 0 220 160" className={styles.diagram}>
            <g ref={hnswRef} />
          </svg>
          <p className={styles.panelDesc}>Hierarchical navigable small-world graph. Entry at top layer, greedy descent through layers.</p>
        </div>
        <div className={styles.panel}>
          <div className={styles.panelTitle} style={{ color: '#2563eb' }}>IVF</div>
          <svg viewBox="0 0 220 160" className={styles.diagram}>
            <g ref={ivfRef} />
          </svg>
          <p className={styles.panelDesc}>Inverted file index. Vectors assigned to nearest centroid; query searches nprobe closest cells.</p>
        </div>
      </div>

      <table className={styles.statsTable} data-testid="stats-table">
        <thead>
          <tr>
            <th />
            <th className={styles.th} style={{ color: '#7c3aed' }}>HNSW</th>
            <th className={styles.th} style={{ color: '#2563eb' }}>IVF</th>
          </tr>
        </thead>
        <tbody>
          <StatRow label="Build time" hnsw={HNSW_STATS.buildTime} ivf={IVF_STATS.buildTime} />
          <StatRow label="Query latency" hnsw={HNSW_STATS.queryLatency} ivf={IVF_STATS.queryLatency} />
          <StatRow label="Recall@10" hnsw={HNSW_STATS.recall} ivf={IVF_STATS.recall} />
          <StatRow label="Best for" hnsw={HNSW_STATS.bestFor} ivf={IVF_STATS.bestFor} />
        </tbody>
      </table>

      <figcaption className={styles.caption}>
        HNSW dominates for &lt;10M vectors where query latency matters. IVF scales better when the index must live on disk or exceed memory.
      </figcaption>
    </figure>
  );
}
