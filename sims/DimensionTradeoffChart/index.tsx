import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

const QUALITY_BY_DIM = [
  { dim: 256, quality: 0.78 },
  { dim: 512, quality: 0.88 },
  { dim: 768, quality: 0.93 },
  { dim: 1024, quality: 0.96 },
  { dim: 1536, quality: 0.98 },
  { dim: 2048, quality: 0.99 },
  { dim: 3072, quality: 1.00 },
] as const;

const MAX_DIM = 3072;
const W = 480;
const H = 180;
const PAD_L = 48;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;

function xPos(dim: number) {
  return PAD_L + ((dim - 256) / (MAX_DIM - 256)) * (W - PAD_L - PAD_R);
}
function yPos(quality: number) {
  return PAD_T + (1 - quality) * (H - PAD_T - PAD_B);
}

const POINTS = QUALITY_BY_DIM.map(d => ({ ...d, x: xPos(d.dim), y: yPos(d.quality) }));

const pathD = POINTS.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
const areaD =
  pathD +
  ` L ${POINTS[POINTS.length - 1].x.toFixed(1)} ${(H - PAD_B).toFixed(1)}` +
  ` L ${POINTS[0].x.toFixed(1)} ${(H - PAD_B).toFixed(1)} Z`;

export function DimensionTradeoffChart() {
  const [selectedIdx, setSelectedIdx] = useState(3); // 1024 default

  const selected = QUALITY_BY_DIM[selectedIdx];
  const storageReductionPct = Math.round((1 - selected.dim / MAX_DIM) * 100);
  const qualityAtSelected = selected.quality;

  useEffect(() => {
    reportState('DimensionTradeoffChart', {
      selectedDim: selected.dim,
      qualityAtSelected,
      storageReductionPct,
    });
  }, [selected.dim, qualityAtSelected, storageReductionPct]);

  const sx = xPos(selected.dim);
  const sy = yPos(selected.quality);

  return (
    <figure className={styles.figure} data-testid="dimension-tradeoff-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-label="Dimension vs quality curve">
        {/* Area fill */}
        <path d={areaD} fill="#7c3aed" fillOpacity={0.08} />
        {/* Curve */}
        <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinejoin="round" />

        {/* Y axis ticks */}
        {[0.8, 0.9, 1.0].map(q => {
          const y = yPos(q);
          return (
            <g key={q}>
              <line x1={PAD_L - 4} y1={y} x2={PAD_L} y2={y} stroke="#d1d5db" />
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#f3f4f6" />
              <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                {Math.round(q * 100)}%
              </text>
            </g>
          );
        })}

        {/* X axis */}
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="#d1d5db" />
        {POINTS.map(p => (
          <g key={p.dim}>
            <line x1={p.x} y1={H - PAD_B} x2={p.x} y2={H - PAD_B + 4} stroke="#d1d5db" />
            <text x={p.x} y={H - PAD_B + 14} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {p.dim}
            </text>
          </g>
        ))}
        <text x={(PAD_L + W - PAD_R) / 2} y={H - 2} textAnchor="middle" fontSize={9} fill="#9ca3af">
          dimensions
        </text>

        {/* Selected vertical line */}
        <line x1={sx} y1={PAD_T} x2={sx} y2={H - PAD_B} stroke="#7c3aed" strokeWidth={1} strokeDasharray="3 3" />

        {/* Selected dot */}
        <circle cx={sx} cy={sy} r={5} fill="#7c3aed" />

        {/* Clickable hit areas */}
        {POINTS.map((p, i) => (
          <rect
            key={p.dim}
            x={p.x - 18}
            y={PAD_T}
            width={36}
            height={H - PAD_T - PAD_B}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            aria-label={`Select ${p.dim} dimensions`}
            onClick={() => setSelectedIdx(i)}
          />
        ))}
      </svg>

      <div className={styles.readout}>
        <span className={styles.readoutMain}>
          Quality at <strong>{selected.dim.toLocaleString()}</strong> dim ={' '}
          <strong>{Math.round(qualityAtSelected * 100)}%</strong> of max
        </span>
        <span className={styles.readoutSub}>
          Storage vs 3072-dim:{' '}
          {storageReductionPct > 0 ? (
            <strong className={styles.saving}>{storageReductionPct}% smaller</strong>
          ) : (
            <strong>baseline</strong>
          )}
        </span>
      </div>

      <div className={styles.slider}>
        <label htmlFor="dim-slider" className={styles.sliderLabel}>
          Click the chart or drag:
        </label>
        <input
          id="dim-slider"
          type="range"
          min={0}
          max={QUALITY_BY_DIM.length - 1}
          step={1}
          value={selectedIdx}
          aria-label="Select dimension"
          onChange={e => setSelectedIdx(Number(e.target.value))}
          className={styles.sliderInput}
        />
        <span className={styles.sliderTicks}>
          {QUALITY_BY_DIM.map((d, i) => (
            <button
              key={d.dim}
              type="button"
              className={`${styles.tick} ${i === selectedIdx ? styles.tickActive : ''}`}
              onClick={() => setSelectedIdx(i)}
            >
              {d.dim}
            </button>
          ))}
        </span>
      </div>

      <figcaption className={styles.caption}>
        Quality rises steeply to ~1024 dimensions then plateaus. Matryoshka models let you truncate
        to 256–512 dim and recover most of that plateau at a fraction of the storage cost.
      </figcaption>
    </figure>
  );
}
