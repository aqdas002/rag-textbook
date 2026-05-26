import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const VENDORS = [
  { name: 'Anthropic Contextual Retrieval', range: [100, 400], color: '#7c3aed' },
  { name: 'OpenAI cookbook examples', range: [500, 800], color: '#2563eb' },
  { name: 'Pinecone defaults', range: [512, 512], color: '#0891b2' },
  { name: 'LlamaIndex defaults', range: [1024, 1024], color: '#059669' },
  { name: 'LangChain RecursiveCharacterTextSplitter', range: [1000, 1000], color: '#d97706' },
] as const;

export function VendorDefaultsChart() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    reportState('VendorDefaultsChart', { vendorCount: VENDORS.length });
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const marginLeft = 220;
    const marginRight = 40;
    const marginTop = 20;
    const marginBottom = 40;
    const rowHeight = 36;
    const width = 700;
    const height = VENDORS.length * rowHeight + marginTop + marginBottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const xMax = 1200;
    const x = d3.scaleLinear().domain([0, xMax]).range([marginLeft, width - marginRight]);

    // X axis
    const xAxis = d3.axisBottom(x).ticks(7).tickFormat(d => `${d}`);
    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#d1d5db'))
      .call(g => g.selectAll('line').attr('stroke', '#d1d5db'))
      .call(g =>
        g
          .selectAll('text')
          .attr('font-size', 11)
          .attr('fill', '#6b7280'),
      );

    // X axis label
    svg
      .append('text')
      .attr('x', (marginLeft + width - marginRight) / 2)
      .attr('y', height - 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('fill', '#6b7280')
      .text('Chunk size (tokens)');

    // Grid lines
    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(7)
          .tickSize(-(height - marginTop - marginBottom))
          .tickFormat(() => ''),
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line').attr('stroke', '#f3f4f6').attr('stroke-width', 1));

    VENDORS.forEach((vendor, i) => {
      const y = marginTop + i * rowHeight + rowHeight / 2;
      const [lo, hi] = vendor.range;
      const barY = y - 10;
      const barH = 20;
      const isPoint = lo === hi;

      if (isPoint) {
        // Single tick (diamond)
        svg
          .append('rect')
          .attr('x', x(lo) - 6)
          .attr('y', barY + 4)
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('fill', vendor.color)
          .attr('opacity', 0.9);
        svg
          .append('text')
          .attr('x', x(lo))
          .attr('y', barY - 2)
          .attr('text-anchor', 'middle')
          .attr('font-size', 10)
          .attr('fill', vendor.color)
          .text(`${lo}`);
      } else {
        // Range bar
        svg
          .append('rect')
          .attr('x', x(lo))
          .attr('y', barY)
          .attr('width', x(hi) - x(lo))
          .attr('height', barH)
          .attr('rx', 4)
          .attr('fill', vendor.color)
          .attr('opacity', 0.75);
        svg
          .append('text')
          .attr('x', x(lo) - 4)
          .attr('y', barY + barH / 2 + 4)
          .attr('text-anchor', 'end')
          .attr('font-size', 10)
          .attr('fill', vendor.color)
          .text(`${lo}`);
        svg
          .append('text')
          .attr('x', x(hi) + 4)
          .attr('y', barY + barH / 2 + 4)
          .attr('text-anchor', 'start')
          .attr('font-size', 10)
          .attr('fill', vendor.color)
          .text(`${hi}`);
      }

      // Vendor label
      svg
        .append('text')
        .attr('x', marginLeft - 8)
        .attr('y', y + 4)
        .attr('text-anchor', 'end')
        .attr('font-size', 12)
        .attr('fill', '#374151')
        .text(vendor.name);
    });
  }, []);

  return (
    <figure className={styles.figure} data-testid="vendor-defaults-chart">
      <svg ref={svgRef} className={styles.svg} />
      <figcaption className={styles.caption}>
        There is no consensus. Real production systems span 10x in their defaults. The right answer
        is corpus-specific.
      </figcaption>
    </figure>
  );
}
