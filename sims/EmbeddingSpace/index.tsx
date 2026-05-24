import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

export const WORDS: Array<{ word: string; x: number; y: number; cluster: string }> = [
  // royalty cluster (top-left)
  { word: 'king',     x: 0.12, y: 0.88, cluster: 'royalty' },
  { word: 'queen',    x: 0.17, y: 0.83, cluster: 'royalty' },
  { word: 'prince',   x: 0.10, y: 0.80, cluster: 'royalty' },
  { word: 'crown',    x: 0.20, y: 0.90, cluster: 'royalty' },
  { word: 'throne',   x: 0.14, y: 0.75, cluster: 'royalty' },
  { word: 'royalty',  x: 0.22, y: 0.85, cluster: 'royalty' },

  // animals cluster (top-right)
  { word: 'cat',      x: 0.78, y: 0.88, cluster: 'animals' },
  { word: 'dog',      x: 0.83, y: 0.82, cluster: 'animals' },
  { word: 'lion',     x: 0.75, y: 0.80, cluster: 'animals' },
  { word: 'wolf',     x: 0.88, y: 0.87, cluster: 'animals' },
  { word: 'bear',     x: 0.80, y: 0.75, cluster: 'animals' },
  { word: 'fox',      x: 0.85, y: 0.78, cluster: 'animals' },

  // food cluster (bottom-left)
  { word: 'pizza',    x: 0.12, y: 0.15, cluster: 'food' },
  { word: 'burger',   x: 0.18, y: 0.10, cluster: 'food' },
  { word: 'pasta',    x: 0.10, y: 0.22, cluster: 'food' },
  { word: 'sushi',    x: 0.22, y: 0.18, cluster: 'food' },
  { word: 'salad',    x: 0.15, y: 0.28, cluster: 'food' },
  { word: 'bread',    x: 0.08, y: 0.12, cluster: 'food' },

  // programming cluster (bottom-right)
  { word: 'python',   x: 0.78, y: 0.18, cluster: 'programming' },
  { word: 'function', x: 0.83, y: 0.12, cluster: 'programming' },
  { word: 'array',    x: 0.75, y: 0.22, cluster: 'programming' },
  { word: 'class',    x: 0.88, y: 0.20, cluster: 'programming' },
  { word: 'loop',     x: 0.80, y: 0.28, cluster: 'programming' },
  { word: 'variable', x: 0.85, y: 0.10, cluster: 'programming' },

  // music cluster (center-left)
  { word: 'piano',    x: 0.30, y: 0.52, cluster: 'music' },
  { word: 'guitar',   x: 0.35, y: 0.48, cluster: 'music' },
  { word: 'melody',   x: 0.28, y: 0.45, cluster: 'music' },
  { word: 'rhythm',   x: 0.38, y: 0.55, cluster: 'music' },
  { word: 'chord',    x: 0.32, y: 0.42, cluster: 'music' },
  { word: 'tempo',    x: 0.25, y: 0.58, cluster: 'music' },
];

const CLUSTER_COLORS: Record<string, string> = {
  royalty:     '#8b5cf6',
  animals:     '#10b981',
  food:        '#f59e0b',
  programming: '#3b82f6',
  music:       '#ef4444',
};

function euclidean(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function similarity(dist: number): number {
  return 1 / (1 + dist);
}

interface Props {
  width?: number;
  height?: number;
}

export function EmbeddingSpace({ width = 700, height = 500 }: Props) {
  const [clickedWord, setClickedWord] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const neighbors = clickedWord
    ? WORDS
        .filter(w => w.word !== clickedWord)
        .map(w => ({
          word: w.word,
          cluster: w.cluster,
          distance: euclidean(w, WORDS.find(v => v.word === clickedWord)!),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
        .map(w => ({ word: w.word, score: similarity(w.distance), cluster: w.cluster }))
    : [];

  const clickedCluster = clickedWord ? WORDS.find(w => w.word === clickedWord)?.cluster : null;
  const clusterPurity = neighbors.length > 0
    ? neighbors.filter(n => n.cluster === clickedCluster).length / neighbors.length
    : 0;

  useEffect(() => {
    reportState('EmbeddingSpace', {
      clickedWord,
      nearestNeighbors: neighbors.map(n => ({ word: n.word, score: n.score })),
      clusterPurity,
    });
  }, [clickedWord]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const pad = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    const neighborWords = new Set(neighbors.map(n => n.word));

    // Draw edges from clicked word to its neighbors
    if (clickedWord) {
      const cw = WORDS.find(w => w.word === clickedWord)!;
      neighbors.forEach(n => {
        const nw = WORDS.find(w => w.word === n.word)!;
        g.append('line')
          .attr('x1', xScale(cw.x))
          .attr('y1', yScale(cw.y))
          .attr('x2', xScale(nw.x))
          .attr('y2', yScale(nw.y))
          .attr('stroke', '#94a3b8')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4 2');
      });
    }

    // Draw dots and labels
    WORDS.forEach(wordData => {
      const cx = xScale(wordData.x);
      const cy = yScale(wordData.y);
      const isClicked = wordData.word === clickedWord;
      const isNeighbor = neighborWords.has(wordData.word);
      const color = CLUSTER_COLORS[wordData.cluster] ?? '#6b7280';
      const r = isClicked ? 10 : 6;
      const opacity = clickedWord && !isClicked && !isNeighbor ? 0.35 : 1;

      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', r)
        .attr('fill', color)
        .attr('opacity', opacity)
        .attr('stroke', isClicked ? '#1e293b' : 'none')
        .attr('stroke-width', isClicked ? 2 : 0)
        .attr('cursor', 'pointer')
        .on('click', () => setClickedWord(wordData.word === clickedWord ? null : wordData.word));

      // Similarity score label for neighbors
      if (isNeighbor) {
        const n = neighbors.find(nb => nb.word === wordData.word)!;
        g.append('text')
          .attr('x', cx + 8)
          .attr('y', cy - 10)
          .attr('font-size', 10)
          .attr('fill', '#374151')
          .text(n.score.toFixed(2));
      }

      g.append('text')
        .attr('x', cx + 8)
        .attr('y', cy + 4)
        .attr('font-size', 12)
        .attr('font-weight', isClicked ? 'bold' : 'normal')
        .attr('fill', '#1e293b')
        .attr('opacity', opacity)
        .attr('pointer-events', 'none')
        .text(wordData.word);
    });
  }, [clickedWord, width, height]);

  // Overlay transparent click targets on top of SVG for testability
  // (data-testid on SVG circle elements may not be queried by jsdom straightforwardly;
  //  we also add them as invisible <rect> overlay buttons)
  const pad = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Embedding Space</h3>
      <p className={styles.instructions}>
        Click any word to see its nearest neighbors in the vector space.
      </p>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(CLUSTER_COLORS).map(([cluster, color]) => (
          <span key={cluster} className={styles.legendItem}>
            <svg width="12" height="12">
              <circle cx="6" cy="6" r="5" fill={color} />
            </svg>
            {cluster}
          </span>
        ))}
      </div>

      <div className={styles.svgWrapper}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svg}
        />
        {/* Transparent click-target rects overlaid for each word dot — stable testid targets */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svgOverlay}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {WORDS.map(wordData => {
            const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerW]);
            const yScale = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);
            const cx = xScale(wordData.x) + pad.left;
            const cy = yScale(wordData.y) + pad.top;
            return (
              <circle
                key={wordData.word}
                data-testid={`word-dot-${wordData.word}`}
                cx={cx}
                cy={cy}
                r={12}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  setClickedWord(wordData.word === clickedWord ? null : wordData.word)
                }
              />
            );
          })}
        </svg>
      </div>

      {/* Info panel */}
      {clickedWord && (
        <div className={styles.panel}>
          <strong>{clickedWord}</strong> — top 5 nearest neighbors
          <ul className={styles.neighborList}>
            {neighbors.map(n => (
              <li key={n.word}>
                <span
                  className={styles.neighborDot}
                  style={{ background: CLUSTER_COLORS[n.cluster] ?? '#6b7280' }}
                />
                <span className={styles.neighborWord}>{n.word}</span>
                <span className={styles.neighborScore}>{n.score.toFixed(3)}</span>
              </li>
            ))}
          </ul>
          <p className={styles.purity}>
            Cluster purity: <strong>{(clusterPurity * 100).toFixed(0)}%</strong>
            {' '}({neighbors.filter(n => n.cluster === clickedCluster).length} of 5 neighbors
            are in the <em>{clickedCluster}</em> cluster)
          </p>
        </div>
      )}
    </div>
  );
}
