import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';

// ─── Stage definitions ────────────────────────────────────────────────────────

interface Stage {
  id: string;
  label: string;
  latencyMs: number;
  costPerQuery: number;
  alwaysOn: boolean;
  isCache: boolean;
}

const STAGES: Stage[] = [
  {
    id: 'query_embedding',
    label: 'Query embedding (encoder API)',
    latencyMs: 40,
    costPerQuery: 0.00002,
    alwaysOn: true,
    isCache: false,
  },
  {
    id: 'bm25',
    label: 'BM25 retrieval',
    latencyMs: 30,
    costPerQuery: 0.00001,
    alwaysOn: false,
    isCache: false,
  },
  {
    id: 'dense',
    label: 'Dense vector search (top-30)',
    latencyMs: 60,
    costPerQuery: 0.00001,
    alwaysOn: false,
    isCache: false,
  },
  {
    id: 'rrf',
    label: 'RRF merge',
    latencyMs: 5,
    costPerQuery: 0,
    alwaysOn: false,
    isCache: false,
  },
  {
    id: 'rerank',
    label: 'Cross-encoder rerank (top-20 → top-5)',
    latencyMs: 120,
    costPerQuery: 0.002,
    alwaysOn: false,
    isCache: false,
  },
  {
    id: 'agent',
    label: 'Agent loop (3 average steps)',
    latencyMs: 4500,
    costPerQuery: 0.015,
    alwaysOn: false,
    isCache: false,
  },
  {
    id: 'llm',
    label: 'LLM answer generation',
    latencyMs: 800,
    costPerQuery: 0.004,
    alwaysOn: true,
    isCache: false,
  },
  {
    id: 'cache',
    label: 'Query-result cache hit? (skips everything above)',
    latencyMs: 5,
    costPerQuery: 0,
    alwaysOn: false,
    isCache: true,
  },
];

const CACHE_LOOKUP_LATENCY = 5;
const CACHE_LOOKUP_COST = 0;

// ─── Preset configs ───────────────────────────────────────────────────────────

type EnabledMap = Record<string, boolean>;

function minimalRagPreset(): { enabled: EnabledMap; cacheHitRate: number } {
  return {
    enabled: {
      query_embedding: true,
      bm25: false,
      dense: true,
      rrf: false,
      rerank: false,
      agent: false,
      llm: true,
      cache: false,
    },
    cacheHitRate: 0,
  };
}

function productionDefaultPreset(): { enabled: EnabledMap; cacheHitRate: number } {
  return {
    enabled: {
      query_embedding: true,
      bm25: true,
      dense: true,
      rrf: true,
      rerank: true,
      agent: false,
      llm: true,
      cache: true,
    },
    cacheHitRate: 50,
  };
}

function agenticEverythingPreset(): { enabled: EnabledMap; cacheHitRate: number } {
  return {
    enabled: {
      query_embedding: true,
      bm25: true,
      dense: true,
      rrf: true,
      rerank: true,
      agent: true,
      llm: true,
      cache: true,
    },
    cacheHitRate: 0,
  };
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

function isRrfEffective(enabled: EnabledMap): boolean {
  return enabled['rrf'] && enabled['bm25'] && enabled['dense'];
}

function computeMetrics(
  enabled: EnabledMap,
  cacheHitRate: number,
): { p50LatencyMs: number; perQueryCostUSD: number } {
  const hitFrac = cacheHitRate / 100;

  // Non-cache stages (excluding cache stage itself)
  let fullLatency = 0;
  let fullCost = 0;

  for (const stage of STAGES) {
    if (stage.isCache) continue;
    if (!enabled[stage.id]) continue;
    if (stage.id === 'rrf' && !isRrfEffective(enabled)) continue;
    fullLatency += stage.latencyMs;
    fullCost += stage.costPerQuery;
  }

  let p50LatencyMs: number;
  let perQueryCostUSD: number;

  if (enabled['cache']) {
    p50LatencyMs =
      hitFrac * CACHE_LOOKUP_LATENCY + (1 - hitFrac) * fullLatency;
    perQueryCostUSD =
      hitFrac * CACHE_LOOKUP_COST + (1 - hitFrac) * fullCost;
  } else {
    p50LatencyMs = fullLatency;
    perQueryCostUSD = fullCost;
  }

  return { p50LatencyMs, perQueryCostUSD };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PipelineBudget() {
  const [enabled, setEnabled] = useState<EnabledMap>(() => {
    const m: EnabledMap = {};
    for (const s of STAGES) m[s.id] = s.alwaysOn;
    // Enable dense by default (minimal baseline)
    m['dense'] = true;
    return m;
  });
  const [cacheHitRate, setCacheHitRate] = useState(0);
  const [qps, setQps] = useState(10);

  const { p50LatencyMs, perQueryCostUSD } = useMemo(
    () => computeMetrics(enabled, cacheHitRate),
    [enabled, cacheHitRate],
  );

  const dailyCostUSD = perQueryCostUSD * qps * 86400;

  const latencyColor =
    p50LatencyMs < 1500
      ? styles.green
      : p50LatencyMs <= 3000
      ? styles.amber
      : styles.red;

  // ── Pipeline summary string ────────────────────────────────────────────────
  const pipelineSummary = useMemo(() => {
    const parts: string[] = [];
    if (enabled['bm25']) parts.push('BM25');
    if (enabled['dense']) parts.push('Dense');
    if (isRrfEffective(enabled)) parts.push('RRF');
    if (enabled['rerank']) parts.push('Rerank');
    if (enabled['agent']) parts.push('Agent');
    const base = parts.length ? parts.join(' + ') : 'Embedding + LLM only';
    const cacheNote = enabled['cache']
      ? `, ${cacheHitRate}% cache hit rate`
      : ', no cache';
    return base + cacheNote;
  }, [enabled, cacheHitRate]);

  // ── reportState ───────────────────────────────────────────────────────────
  const stagesEnabled = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const s of STAGES) {
      out[s.id] = s.id === 'rrf' ? isRrfEffective(enabled) : !!enabled[s.id];
    }
    return out;
  }, [enabled]);

  useEffect(() => {
    reportState('PipelineBudget', {
      stagesEnabled,
      p50LatencyMs,
      perQueryCostUSD,
      qps,
      dailyCostUSD,
      cacheHitRate: enabled['cache'] ? cacheHitRate : 0,
    });
  }, [stagesEnabled, p50LatencyMs, perQueryCostUSD, qps, dailyCostUSD, cacheHitRate, enabled]);

  // ── Toggle handler ────────────────────────────────────────────────────────
  function toggle(id: string) {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function applyPreset(preset: { enabled: EnabledMap; cacheHitRate: number }) {
    setEnabled(preset.enabled);
    setCacheHitRate(preset.cacheHitRate);
  }

  // ── RRF warning ───────────────────────────────────────────────────────────
  const rrfWarn = enabled['rrf'] && (!enabled['bm25'] || !enabled['dense']);

  return (
    <div className={styles.sim}>
      <h3 className={styles.title}>Pipeline Budget: Latency &amp; Cost Stack-Up</h3>

      <div className={styles.layout}>
        {/* ── Left pane: configurator ── */}
        <div className={styles.leftPane}>
          <h4 className={styles.paneTitle}>Pipeline Configurator</h4>

          <div className={styles.stageList}>
            {STAGES.map(stage => {
              const isOn = !!enabled[stage.id];
              const effectivelyOff =
                stage.id === 'rrf' && !isRrfEffective(enabled) && enabled['rrf'];

              return (
                <div
                  key={stage.id}
                  data-testid={`stage-row-${stage.id}`}
                  className={`${styles.stageRow} ${isOn ? styles.stageOn : styles.stageOff}`}
                >
                  <label className={styles.stageLabel}>
                    <input
                      type="checkbox"
                      checked={isOn}
                      disabled={stage.alwaysOn}
                      aria-label={stage.label}
                      onChange={() => toggle(stage.id)}
                    />
                    <span className={styles.stageName}>{stage.label}</span>
                  </label>

                  {stage.id === 'rrf' && rrfWarn && (
                    <span
                      className={styles.warnBadge}
                      title="RRF requires both BM25 and Dense to be enabled"
                      aria-label="RRF requires BM25 and Dense"
                    >
                      ⚠ needs BM25 + Dense
                    </span>
                  )}

                  <div className={styles.stageMeta}>
                    <span className={styles.metaChip}>{stage.latencyMs}ms</span>
                    <span className={styles.metaChip}>
                      ${stage.costPerQuery.toFixed(5)}/q
                    </span>
                    {effectivelyOff && (
                      <span className={styles.noopBadge}>no-op</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cache hit rate slider — appears when cache is on */}
          {enabled['cache'] && (
            <label className={styles.sliderLabel}>
              <span>
                Cache hit rate:&nbsp;<strong>{cacheHitRate}%</strong>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={cacheHitRate}
                aria-label="Cache hit rate"
                onChange={e => setCacheHitRate(Number(e.target.value))}
              />
            </label>
          )}
        </div>

        {/* ── Right pane: output ── */}
        <div className={styles.rightPane}>
          <h4 className={styles.paneTitle}>Output</h4>

          <div className={styles.bigNumbers}>
            <div className={styles.bigCard}>
              <div className={styles.bigLabel}>p50 Latency</div>
              <div className={`${styles.bigValue} ${latencyColor}`}>
                {Math.round(p50LatencyMs)}
                <span className={styles.bigUnit}>ms</span>
              </div>
              <div className={styles.bigHint}>
                {p50LatencyMs < 1500
                  ? 'Within SLO'
                  : p50LatencyMs <= 3000
                  ? 'Approaching limit'
                  : 'Exceeds SLO'}
              </div>
            </div>

            <div className={styles.bigCard}>
              <div className={styles.bigLabel}>Per-query cost</div>
              <div className={styles.bigValue}>
                ${perQueryCostUSD.toFixed(4)}
              </div>
            </div>

            <div className={styles.bigCard}>
              <div className={styles.bigLabel}>Est. daily cost</div>
              <div className={styles.bigValue}>
                ${dailyCostUSD < 1000
                  ? dailyCostUSD.toFixed(2)
                  : dailyCostUSD.toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}
              </div>
            </div>
          </div>

          {/* QPS slider */}
          <label className={styles.sliderLabel}>
            <span>
              QPS:&nbsp;<strong>{qps}</strong>
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={qps}
              aria-label="Queries per second"
              onChange={e => setQps(Number(e.target.value))}
            />
          </label>

          {/* Pipeline summary */}
          <div className={styles.summaryBox}>
            <strong className={styles.summaryLabel}>Pipeline:</strong>{' '}
            <span className={styles.summaryText}>{pipelineSummary}</span>
          </div>

          {/* Preset buttons */}
          <div className={styles.presetRow}>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() => applyPreset(minimalRagPreset())}
            >
              Minimal RAG
            </button>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() => applyPreset(productionDefaultPreset())}
            >
              Production default
            </button>
            <button
              type="button"
              className={styles.presetBtn}
              onClick={() => applyPreset(agenticEverythingPreset())}
            >
              Agentic + everything
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
