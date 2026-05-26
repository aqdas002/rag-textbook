import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const SIZE_MIN = 32;
const SIZE_MAX = 4096;
const SWEET_LOW = 200;
const SWEET_HIGH = 800;

function quality(size: number): number {
  const l = Math.log2(size);
  // Peak around log2(512) = 9
  return Math.max(0, 1 - 0.08 * Math.pow(l - 9, 2));
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function ChunkSizeSweetSpot() {
  const [selectedSize, setSelectedSize] = useState(512);
  const svgRef = useRef<SVGSVGElement>(null);

  const qualityAtSelected = parseFloat(quality(selectedSize).toFixed(3));
  const inSweetSpot = selectedSize >= SWEET_LOW && selectedSize <= SWEET_HIGH;

  useEffect(() => {
    reportState('ChunkSizeSweetSpot', { selectedSize, qualityAtSelected, inSweetSpot });
  }, [selectedSize, qualityAtSelected, inSweetSpot]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const marginLeft = 52;
    const marginRight = 20;
    const marginTop = 24;
    const marginBottom = 40;
    const width = 680;
    const height = 260;
    const innerW = width - marginLeft - marginRight;
    const innerH = height - marginTop - marginBottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const x = d3.scaleLog().base(2).domain([SIZE_MIN, SIZE_MAX]).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0]);

    const g = svg.append('g').attr('transform', `translate(${marginLeft},${marginTop})`);

    // Zone: too small (red)
    g.append('rect')
      .attr('x', x(SIZE_MIN))
      .attr('y', 0)
      .attr('width', x(SWEET_LOW) - x(SIZE_MIN))
      .attr('height', innerH)
      .attr('fill', '#fef2f2')
      .attr('stroke', 'none');

    // Zone: sweet spot (green)
    g.append('rect')
      .attr('x', x(SWEET_LOW))
      .attr('y', 0)
      .attr('width', x(SWEET_HIGH) - x(SWEET_LOW))
      .attr('height', innerH)
      .attr('fill', '#f0fdf4')
      .attr('stroke', 'none');

    // Zone: too large (amber)
    g.append('rect')
      .attr('x', x(SWEET_HIGH))
      .attr('y', 0)
      .attr('width', x(SIZE_MAX) - x(SWEET_HIGH))
      .attr('height', innerH)
      .attr('fill', '#fffbeb')
      .attr('stroke', 'none');

    // Zone labels
    g.append('text')
      .attr('x', (x(SIZE_MIN) + x(SWEET_LOW)) / 2)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#dc2626')
      .text('too small —');
    g.append('text')
      .attr('x', (x(SIZE_MIN) + x(SWEET_LOW)) / 2)
      .attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#dc2626')
      .text('facts fragment');

    g.append('text')
      .attr('x', (x(SWEET_LOW) + x(SWEET_HIGH)) / 2)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#15803d')
      .attr('font-weight', '600')
      .text('sweet spot');

    g.append('text')
      .attr('x', (x(SWEET_HIGH) + x(SIZE_MAX)) / 2)
      .attr('y', 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#d97706')
      .text('too large —');
    g.append('text')
      .attr('x', (x(SWEET_HIGH) + x(SIZE_MAX)) / 2)
      .attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('fill', '#d97706')
      .text('context dilutes');

    // Grid lines (horizontal)
    g.append('g')
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-innerW)
          .tickFormat(() => ''),
      )
      .call(gg => gg.select('.domain').remove())
      .call(gg => gg.selectAll('line').attr('stroke', '#e5e7eb').attr('stroke-width', 1));

    // Curve data
    const sizes = d3.range(SIZE_MIN, SIZE_MAX + 1, 4);
    const lineGen = d3
      .line<number>()
      .x(s => x(s))
      .y(s => y(quality(s)))
      .curve(d3.curveCatmullRom);

    g.append('path')
      .datum(sizes)
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2.5)
      .attr('d', lineGen);

    // Marker for selected size
    const mx = x(selectedSize);
    const my = y(quality(selectedSize));

    g.append('line')
      .attr('x1', mx)
      .attr('x2', mx)
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#374151')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,3');

    g.append('circle')
      .attr('cx', mx)
      .attr('cy', my)
      .attr('r', 5)
      .attr('fill', inSweetSpot ? '#22c55e' : '#ef4444')
      .attr('stroke', 'white')
      .attr('stroke-width', 1.5);

    // Axes
    const xAxis = d3
      .axisBottom(x)
      .tickValues([32, 64, 128, 256, 512, 1024, 2048, 4096])
      .tickFormat(d => String(d));

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .call(gg => gg.select('.domain').attr('stroke', '#d1d5db'))
      .call(gg => gg.selectAll('line').attr('stroke', '#d1d5db'))
      .call(gg => gg.selectAll('text').attr('font-size', 10).attr('fill', '#6b7280'));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.1f')))
      .call(gg => gg.select('.domain').attr('stroke', '#d1d5db'))
      .call(gg => gg.selectAll('line').attr('stroke', '#d1d5db'))
      .call(gg => gg.selectAll('text').attr('font-size', 10).attr('fill', '#6b7280'));

    // Axis labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 34)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#6b7280')
      .text('Chunk size (chars, log scale)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#6b7280')
      .text('Retrieval quality');
  }, [selectedSize, inSweetSpot]);

  // Slider range is log-mapped: we convert slider position to log-scaled size
  const logMin = Math.log2(SIZE_MIN);
  const logMax = Math.log2(SIZE_MAX);

  function sliderToSize(v: number) {
    return Math.round(Math.pow(2, logMin + (v / 100) * (logMax - logMin)));
  }
  function sizeToSlider(s: number) {
    return ((Math.log2(s) - logMin) / (logMax - logMin)) * 100;
  }

  return (
    <div className={styles.sim} data-testid="chunk-size-sweet-spot">
      <svg ref={svgRef} className={styles.svg} />
      <div className={styles.controls}>
        <label className={styles.sliderLabel}>
          Chunk size:
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={sizeToSlider(selectedSize)}
            onChange={e => setSelectedSize(clamp(sliderToSize(Number(e.target.value)), SIZE_MIN, SIZE_MAX))}
            aria-label="Chunk size"
            className={styles.slider}
          />
          <strong>{selectedSize}</strong> chars
        </label>
        <span
          className={styles.statusBadge}
          style={{
            background: inSweetSpot ? '#dcfce7' : '#fee2e2',
            color: inSweetSpot ? '#15803d' : '#b91c1c',
          }}
        >
          quality {qualityAtSelected.toFixed(2)} &nbsp;·&nbsp;{' '}
          {inSweetSpot ? 'in sweet spot ✓' : 'outside sweet spot ✗'}
        </span>
      </div>
    </div>
  );
}
