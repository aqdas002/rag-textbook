import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';
const STAGES = [
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
function minimalRagPreset() {
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
function productionDefaultPreset() {
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
function agenticEverythingPreset() {
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
function isRrfEffective(enabled) {
    return enabled['rrf'] && enabled['bm25'] && enabled['dense'];
}
function computeMetrics(enabled, cacheHitRate) {
    const hitFrac = cacheHitRate / 100;
    // Non-cache stages (excluding cache stage itself)
    let fullLatency = 0;
    let fullCost = 0;
    for (const stage of STAGES) {
        if (stage.isCache)
            continue;
        if (!enabled[stage.id])
            continue;
        if (stage.id === 'rrf' && !isRrfEffective(enabled))
            continue;
        fullLatency += stage.latencyMs;
        fullCost += stage.costPerQuery;
    }
    let p50LatencyMs;
    let perQueryCostUSD;
    if (enabled['cache']) {
        p50LatencyMs =
            hitFrac * CACHE_LOOKUP_LATENCY + (1 - hitFrac) * fullLatency;
        perQueryCostUSD =
            hitFrac * CACHE_LOOKUP_COST + (1 - hitFrac) * fullCost;
    }
    else {
        p50LatencyMs = fullLatency;
        perQueryCostUSD = fullCost;
    }
    return { p50LatencyMs, perQueryCostUSD };
}
// ─── Component ────────────────────────────────────────────────────────────────
export function PipelineBudget() {
    const [enabled, setEnabled] = useState(() => {
        const m = {};
        for (const s of STAGES)
            m[s.id] = s.alwaysOn;
        // Enable dense by default (minimal baseline)
        m['dense'] = true;
        return m;
    });
    const [cacheHitRate, setCacheHitRate] = useState(0);
    const [qps, setQps] = useState(10);
    const { p50LatencyMs, perQueryCostUSD } = useMemo(() => computeMetrics(enabled, cacheHitRate), [enabled, cacheHitRate]);
    const dailyCostUSD = perQueryCostUSD * qps * 86400;
    const latencyColor = p50LatencyMs < 1500
        ? styles.green
        : p50LatencyMs <= 3000
            ? styles.amber
            : styles.red;
    // ── Pipeline summary string ────────────────────────────────────────────────
    const pipelineSummary = useMemo(() => {
        const parts = [];
        if (enabled['bm25'])
            parts.push('BM25');
        if (enabled['dense'])
            parts.push('Dense');
        if (isRrfEffective(enabled))
            parts.push('RRF');
        if (enabled['rerank'])
            parts.push('Rerank');
        if (enabled['agent'])
            parts.push('Agent');
        const base = parts.length ? parts.join(' + ') : 'Embedding + LLM only';
        const cacheNote = enabled['cache']
            ? `, ${cacheHitRate}% cache hit rate`
            : ', no cache';
        return base + cacheNote;
    }, [enabled, cacheHitRate]);
    // ── reportState ───────────────────────────────────────────────────────────
    const stagesEnabled = useMemo(() => {
        const out = {};
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
    function toggle(id) {
        setEnabled(prev => ({ ...prev, [id]: !prev[id] }));
    }
    function applyPreset(preset) {
        setEnabled(preset.enabled);
        setCacheHitRate(preset.cacheHitRate);
    }
    // ── RRF warning ───────────────────────────────────────────────────────────
    const rrfWarn = enabled['rrf'] && (!enabled['bm25'] || !enabled['dense']);
    return (_jsxs("div", { className: styles.sim, children: [_jsx("h3", { className: styles.title, children: "Pipeline Budget: Latency & Cost Stack-Up" }), _jsxs("div", { className: styles.layout, children: [_jsxs("div", { className: styles.leftPane, children: [_jsx("h4", { className: styles.paneTitle, children: "Pipeline Configurator" }), _jsx("div", { className: styles.stageList, children: STAGES.map(stage => {
                                    const isOn = !!enabled[stage.id];
                                    const effectivelyOff = stage.id === 'rrf' && !isRrfEffective(enabled) && enabled['rrf'];
                                    return (_jsxs("div", { "data-testid": `stage-row-${stage.id}`, className: `${styles.stageRow} ${isOn ? styles.stageOn : styles.stageOff}`, children: [_jsxs("label", { className: styles.stageLabel, children: [_jsx("input", { type: "checkbox", checked: isOn, disabled: stage.alwaysOn, "aria-label": stage.label, onChange: () => toggle(stage.id) }), _jsx("span", { className: styles.stageName, children: stage.label })] }), stage.id === 'rrf' && rrfWarn && (_jsx("span", { className: styles.warnBadge, title: "RRF requires both BM25 and Dense to be enabled", "aria-label": "RRF requires BM25 and Dense", children: "\u26A0 needs BM25 + Dense" })), _jsxs("div", { className: styles.stageMeta, children: [_jsxs("span", { className: styles.metaChip, children: [stage.latencyMs, "ms"] }), _jsxs("span", { className: styles.metaChip, children: ["$", stage.costPerQuery.toFixed(5), "/q"] }), effectivelyOff && (_jsx("span", { className: styles.noopBadge, children: "no-op" }))] })] }, stage.id));
                                }) }), enabled['cache'] && (_jsxs("label", { className: styles.sliderLabel, children: [_jsxs("span", { children: ["Cache hit rate:\u00A0", _jsxs("strong", { children: [cacheHitRate, "%"] })] }), _jsx("input", { type: "range", min: 0, max: 100, step: 5, value: cacheHitRate, "aria-label": "Cache hit rate", onChange: e => setCacheHitRate(Number(e.target.value)) })] }))] }), _jsxs("div", { className: styles.rightPane, children: [_jsx("h4", { className: styles.paneTitle, children: "Output" }), _jsxs("div", { className: styles.bigNumbers, children: [_jsxs("div", { className: styles.bigCard, children: [_jsx("div", { className: styles.bigLabel, children: "p50 Latency" }), _jsxs("div", { className: `${styles.bigValue} ${latencyColor}`, children: [Math.round(p50LatencyMs), _jsx("span", { className: styles.bigUnit, children: "ms" })] }), _jsx("div", { className: styles.bigHint, children: p50LatencyMs < 1500
                                                    ? 'Within SLO'
                                                    : p50LatencyMs <= 3000
                                                        ? 'Approaching limit'
                                                        : 'Exceeds SLO' })] }), _jsxs("div", { className: styles.bigCard, children: [_jsx("div", { className: styles.bigLabel, children: "Per-query cost" }), _jsxs("div", { className: styles.bigValue, children: ["$", perQueryCostUSD.toFixed(4)] })] }), _jsxs("div", { className: styles.bigCard, children: [_jsx("div", { className: styles.bigLabel, children: "Est. daily cost" }), _jsxs("div", { className: styles.bigValue, children: ["$", dailyCostUSD < 1000
                                                        ? dailyCostUSD.toFixed(2)
                                                        : dailyCostUSD.toLocaleString('en-US', {
                                                            maximumFractionDigits: 0,
                                                        })] })] })] }), _jsxs("label", { className: styles.sliderLabel, children: [_jsxs("span", { children: ["QPS:\u00A0", _jsx("strong", { children: qps })] }), _jsx("input", { type: "range", min: 1, max: 100, step: 1, value: qps, "aria-label": "Queries per second", onChange: e => setQps(Number(e.target.value)) })] }), _jsxs("div", { className: styles.summaryBox, children: [_jsx("strong", { className: styles.summaryLabel, children: "Pipeline:" }), ' ', _jsx("span", { className: styles.summaryText, children: pipelineSummary })] }), _jsxs("div", { className: styles.presetRow, children: [_jsx("button", { type: "button", className: styles.presetBtn, onClick: () => applyPreset(minimalRagPreset()), children: "Minimal RAG" }), _jsx("button", { type: "button", className: styles.presetBtn, onClick: () => applyPreset(productionDefaultPreset()), children: "Production default" }), _jsx("button", { type: "button", className: styles.presetBtn, onClick: () => applyPreset(agenticEverythingPreset()), children: "Agentic + everything" })] })] })] })] }));
}
