import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';
export const NODES = [
    // Companies
    { id: 'Meta', label: 'Meta', type: 'company', seedX: 0.38, seedY: 0.42 },
    { id: 'Instagram', label: 'Instagram', type: 'company', seedX: 0.18, seedY: 0.62 },
    { id: 'WhatsApp', label: 'WhatsApp', type: 'company', seedX: 0.18, seedY: 0.22 },
    { id: 'Anthropic', label: 'Anthropic', type: 'company', seedX: 0.72, seedY: 0.62 },
    { id: 'OpenAI', label: 'OpenAI', type: 'company', seedX: 0.72, seedY: 0.22 },
    // People
    { id: 'Mark_Zuckerberg', label: 'Mark Zuckerberg', type: 'person', seedX: 0.38, seedY: 0.72 },
    { id: 'Adam_Mosseri', label: 'Adam Mosseri', type: 'person', seedX: 0.08, seedY: 0.42 },
    { id: 'Dario_Amodei', label: 'Dario Amodei', type: 'person', seedX: 0.88, seedY: 0.42 },
    { id: 'Sam_Altman', label: 'Sam Altman', type: 'person', seedX: 0.62, seedY: 0.08 },
    // Events
    { id: 'Q3_2024_Earnings_Call', label: 'Q3 2024\nEarnings Call', type: 'event', seedX: 0.55, seedY: 0.82 },
    { id: 'Anthropic_Series_C', label: 'Anthropic\nSeries C', type: 'event', seedX: 0.88, seedY: 0.72 },
    // Products
    { id: 'Llama_3', label: 'Llama 3', type: 'product', seedX: 0.18, seedY: 0.08 },
    { id: 'Claude_4', label: 'Claude 4', type: 'product', seedX: 0.72, seedY: 0.88 },
    { id: 'GPT-5', label: 'GPT-5', type: 'product', seedX: 0.88, seedY: 0.08 },
];
export const EDGES = [
    { source: 'Meta', target: 'Instagram', label: 'acquired (2012, $1B)' },
    { source: 'Meta', target: 'WhatsApp', label: 'acquired (2014, $19B)' },
    { source: 'Mark_Zuckerberg', target: 'Meta', label: 'ceo_of' },
    { source: 'Adam_Mosseri', target: 'Instagram', label: 'head_of' },
    { source: 'Mark_Zuckerberg', target: 'Q3_2024_Earnings_Call', label: 'spoke_at' },
    { source: 'Q3_2024_Earnings_Call', target: 'Meta', label: 'about' },
    { source: 'Anthropic', target: 'Claude_4', label: 'released' },
    { source: 'Dario_Amodei', target: 'Anthropic', label: 'ceo_of' },
    { source: 'Anthropic', target: 'Anthropic_Series_C', label: 'raised_in' },
    { source: 'OpenAI', target: 'GPT-5', label: 'released' },
    { source: 'Sam_Altman', target: 'OpenAI', label: 'ceo_of' },
    { source: 'Meta', target: 'Llama_3', label: 'released' },
];
const FACT_CHUNKS = [
    { nodeId: 'Meta', text: 'Meta is a social media company founded by Mark Zuckerberg.', keywords: ['meta', 'social', 'media', 'company', 'mark', 'zuckerberg'] },
    { nodeId: 'Instagram', text: 'Instagram was acquired by Meta in 2012 for $1 billion.', keywords: ['instagram', 'acquired', 'meta', '2012', 'billion'] },
    { nodeId: 'WhatsApp', text: 'WhatsApp was acquired by Meta in 2014 for $19 billion.', keywords: ['whatsapp', 'acquired', 'meta', '2014', 'billion'] },
    { nodeId: 'Mark_Zuckerberg', text: 'Mark Zuckerberg is the CEO of Meta.', keywords: ['mark', 'zuckerberg', 'ceo', 'meta'] },
    { nodeId: 'Adam_Mosseri', text: 'Adam Mosseri is the head of Instagram.', keywords: ['adam', 'mosseri', 'head', 'instagram'] },
    { nodeId: 'Anthropic', text: 'Anthropic is an AI safety company that makes Claude.', keywords: ['anthropic', 'ai', 'safety', 'claude'] },
    { nodeId: 'Dario_Amodei', text: 'Dario Amodei is the CEO of Anthropic.', keywords: ['dario', 'amodei', 'ceo', 'anthropic'] },
    { nodeId: 'OpenAI', text: 'OpenAI is an AI research company known for GPT models.', keywords: ['openai', 'ai', 'research', 'gpt'] },
    { nodeId: 'Sam_Altman', text: 'Sam Altman is the CEO of OpenAI.', keywords: ['sam', 'altman', 'ceo', 'openai'] },
    { nodeId: 'Q3_2024_Earnings_Call', text: 'At the Q3 2024 Earnings Call, Mark Zuckerberg said AI capital expenditure will exceed $40B this year.', keywords: ['q3', '2024', 'earnings', 'call', 'mark', 'zuckerberg', 'ai', 'capital', 'expenditure', '40b'] },
    { nodeId: 'Anthropic_Series_C', text: 'Anthropic raised $4B from Amazon in the Anthropic Series C round in Sep 2024.', keywords: ['anthropic', 'series', 'c', 'raised', '4b', 'amazon', '2024'] },
    { nodeId: 'Llama_3', text: 'Meta released Llama 3, an open-source large language model.', keywords: ['meta', 'released', 'llama', '3', 'open', 'source', 'language', 'model'] },
    { nodeId: 'Claude_4', text: 'Anthropic released Claude 4, its most capable AI assistant.', keywords: ['anthropic', 'released', 'claude', '4', 'ai', 'assistant'] },
    { nodeId: 'GPT-5', text: 'OpenAI released GPT-5, a new flagship large language model.', keywords: ['openai', 'released', 'gpt', '5', 'language', 'model'] },
];
export const QUERIES = [
    {
        text: 'Who is the CEO of Meta?',
        hops: 1,
        vanillaAnswered: true,
        graphAnswered: true,
        graphPath: [
            { nodeId: 'Meta' },
            { nodeId: 'Mark_Zuckerberg', edgeLabel: 'ceo_of (reverse)' },
        ],
        answer: 'Mark Zuckerberg — directly answered by one chunk AND confirmed by graph.',
        queryKeywords: ['who', 'ceo', 'meta'],
    },
    {
        text: 'Who runs the company that owns Instagram?',
        hops: 2,
        vanillaAnswered: false,
        graphAnswered: true,
        graphPath: [
            { nodeId: 'Instagram' },
            { nodeId: 'Meta', edgeLabel: 'acquired (reverse → owner)' },
            { nodeId: 'Mark_Zuckerberg', edgeLabel: 'ceo_of (reverse)' },
        ],
        answer: 'Mark Zuckerberg — CEO of Meta, which acquired Instagram.',
        queryKeywords: ['who', 'runs', 'company', 'owns', 'instagram'],
    },
    {
        text: 'What did the leader of the company that acquired Instagram in 2012 say at their most recent earnings call?',
        hops: 3,
        vanillaAnswered: false,
        graphAnswered: true,
        graphPath: [
            { nodeId: 'Instagram' },
            { nodeId: 'Meta', edgeLabel: 'acquired (2012, $1B)' },
            { nodeId: 'Mark_Zuckerberg', edgeLabel: 'ceo_of (reverse)' },
            { nodeId: 'Q3_2024_Earnings_Call', edgeLabel: 'spoke_at' },
        ],
        answer: '"AI capital expenditure will exceed $40B this year." — Mark Zuckerberg at Q3 2024 Earnings Call.',
        queryKeywords: ['leader', 'company', 'acquired', 'instagram', '2012', 'earnings', 'call'],
    },
];
// ---------------------------------------------------------------------------
// Toy cosine similarity for vanilla RAG ranking
// ---------------------------------------------------------------------------
function toyCosineSimilarity(queryKeywords, chunk) {
    const qSet = new Set(queryKeywords.map(k => k.toLowerCase()));
    const matches = chunk.keywords.filter(k => qSet.has(k)).length;
    if (matches === 0)
        return 0;
    return matches / Math.sqrt(qSet.size * chunk.keywords.length);
}
function rankChunksForQuery(queryKeywords) {
    return [...FACT_CHUNKS]
        .map(chunk => ({ chunk, score: toyCosineSimilarity(queryKeywords, chunk) }))
        .sort((a, b) => b.score - a.score)
        .map(({ chunk }) => chunk);
}
// ---------------------------------------------------------------------------
// Node type colors
// ---------------------------------------------------------------------------
const NODE_COLORS = {
    company: '#3b82f6', // blue
    person: '#22c55e', // green
    event: '#f97316', // orange
    product: '#a855f7', // purple
};
const HIGHLIGHT_COLOR = '#eab308'; // yellow
export function MultiHopRetrieval({ width = 520, height = 420, initialQueryIndex = 0 }) {
    const [activeQueryIndex, setActiveQueryIndex] = useState(initialQueryIndex);
    const svgRef = useRef(null);
    const activeQuery = QUERIES[activeQueryIndex];
    const vanillaChunks = rankChunksForQuery(activeQuery.queryKeywords).slice(0, 5);
    const activePathNodeIds = new Set(activeQuery.graphPath.map(s => s.nodeId));
    // Determine which edges are in the active path
    const activePathEdgeKeys = new Set();
    for (let i = 0; i < activeQuery.graphPath.length - 1; i++) {
        const from = activeQuery.graphPath[i].nodeId;
        const to = activeQuery.graphPath[i + 1].nodeId;
        // Match edge in either direction
        activePathEdgeKeys.add(`${from}->${to}`);
        activePathEdgeKeys.add(`${to}->${from}`);
    }
    useEffect(() => {
        reportState('MultiHopRetrieval', {
            activeQuery: activeQuery.text,
            hops: activeQuery.hops,
            vanillaTopChunks: vanillaChunks.map(c => c.nodeId),
            graphPath: activeQuery.graphPath.map(s => s.nodeId),
            vanillaAnswered: activeQuery.vanillaAnswered,
            graphAnswered: activeQuery.graphAnswered,
        });
    }, [activeQueryIndex]);
    // D3 force-directed graph with pre-seeded positions for stability
    useEffect(() => {
        if (!svgRef.current)
            return;
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        const W = width;
        const H = height;
        const pad = { top: 20, right: 20, bottom: 20, left: 20 };
        const innerW = W - pad.left - pad.right;
        const innerH = H - pad.top - pad.bottom;
        const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);
        // Arrow marker defs
        const defs = svg.append('defs');
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#94a3b8');
        defs.append('marker')
            .attr('id', 'arrowhead-active')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', HIGHLIGHT_COLOR);
        // Build simulation nodes with pre-seeded positions
        const simNodes = NODES.map(n => ({
            ...n,
            x: n.seedX * innerW,
            y: n.seedY * innerH,
            fx: n.seedX * innerW, // fix positions so layout is deterministic
            fy: n.seedY * innerH,
        }));
        const nodeById = new Map(simNodes.map(n => [n.id, n]));
        // Draw edges
        const edgeGroup = g.append('g').attr('class', 'edges');
        EDGES.forEach(edge => {
            const src = nodeById.get(edge.source);
            const tgt = nodeById.get(edge.target);
            if (!src || !tgt)
                return;
            const isActive = activePathEdgeKeys.has(`${edge.source}->${edge.target}`) ||
                activePathEdgeKeys.has(`${edge.target}->${edge.source}`);
            edgeGroup.append('line')
                .attr('x1', src.x)
                .attr('y1', src.y)
                .attr('x2', tgt.x)
                .attr('y2', tgt.y)
                .attr('stroke', isActive ? HIGHLIGHT_COLOR : '#cbd5e1')
                .attr('stroke-width', isActive ? 2.5 : 1.2)
                .attr('marker-end', isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)');
            // Edge label — only show for active path edges to avoid clutter
            if (isActive) {
                const mx = (src.x + tgt.x) / 2;
                const my = (src.y + tgt.y) / 2;
                edgeGroup.append('text')
                    .attr('x', mx)
                    .attr('y', my - 4)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 8)
                    .attr('fill', '#92400e')
                    .attr('font-weight', '600')
                    .text(edge.label);
            }
        });
        // Draw nodes (circles)
        simNodes.forEach(node => {
            const isActive = activePathNodeIds.has(node.id);
            const color = NODE_COLORS[node.type];
            const nodeG = g.append('g')
                .attr('transform', `translate(${node.x},${node.y})`)
                .attr('data-testid', `graph-node-${node.id}`);
            nodeG.append('circle')
                .attr('r', 14)
                .attr('fill', color)
                .attr('fill-opacity', isActive ? 1 : 0.55)
                .attr('stroke', isActive ? HIGHLIGHT_COLOR : '#e2e8f0')
                .attr('stroke-width', isActive ? 3 : 1.5);
            // Label lines (handle newline in label)
            const lines = node.label.split('\n');
            if (lines.length === 1) {
                nodeG.append('text')
                    .attr('y', 22)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 8)
                    .attr('fill', '#1e293b')
                    .attr('font-weight', isActive ? '700' : '400')
                    .text(node.label);
            }
            else {
                lines.forEach((line, i) => {
                    nodeG.append('text')
                        .attr('y', 20 + i * 10)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', 7)
                        .attr('fill', '#1e293b')
                        .attr('font-weight', isActive ? '700' : '400')
                        .text(line);
                });
            }
        });
    }, [activeQueryIndex, width, height]);
    return (_jsxs("div", { className: styles.sim, children: [_jsx("h3", { className: styles.title, children: "Multi-Hop Retrieval: Vanilla RAG vs GraphRAG" }), _jsxs("div", { className: styles.queryRow, children: [_jsx("label", { htmlFor: "query-select", className: styles.queryLabel, children: _jsx("strong", { children: "Query:" }) }), _jsx("select", { id: "query-select", value: activeQueryIndex, onChange: e => setActiveQueryIndex(Number(e.target.value)), className: styles.querySelect, "aria-label": "Select query", children: QUERIES.map((q, i) => (_jsxs("option", { value: i, children: [i === 0 ? '(1-hop) ' : i === 1 ? '(2-hop) ' : '(3-hop) ', q.text] }, i))) })] }), _jsxs("div", { className: styles.mainLayout, children: [_jsxs("div", { className: styles.graphPanel, children: [_jsx("h4", { className: styles.panelTitle, children: "Knowledge Graph" }), _jsx("div", { className: styles.legend, children: Object.entries(NODE_COLORS).map(([type, color]) => (_jsxs("span", { className: styles.legendItem, children: [_jsx("svg", { width: 10, height: 10, children: _jsx("circle", { cx: 5, cy: 5, r: 4, fill: color }) }), type] }, type))) }), _jsxs("div", { className: styles.svgWrapper, children: [_jsx("svg", { ref: svgRef, width: width, height: height, viewBox: `0 0 ${width} ${height}`, className: styles.svg }), _jsx("svg", { width: width, height: height, viewBox: `0 0 ${width} ${height}`, className: styles.svgOverlay, "aria-hidden": "true", children: NODES.map(node => {
                                            const pad = { top: 20, right: 20, bottom: 20, left: 20 };
                                            const innerW = width - pad.left - pad.right;
                                            const innerH = height - pad.top - pad.bottom;
                                            const cx = node.seedX * innerW + pad.left;
                                            const cy = node.seedY * innerH + pad.top;
                                            return (_jsx("circle", { "data-testid": `graph-node-${node.id}`, cx: cx, cy: cy, r: 16, fill: "transparent" }, node.id));
                                        }) })] })] }), _jsxs("div", { className: styles.retrievalPanel, children: [_jsxs("div", { className: styles.retrievalColumn, children: [_jsxs("h4", { className: styles.panelTitle, children: ["Vanilla RAG", _jsx("span", { className: `${styles.badge} ${activeQuery.vanillaAnswered ? styles.badgeGreen : styles.badgeRed}`, children: activeQuery.vanillaAnswered ? 'Can answer' : 'Cannot answer' })] }), _jsx("p", { className: styles.colSubtitle, children: "Top-5 chunks by cosine similarity" }), vanillaChunks.map((chunk, i) => (_jsxs("div", { "data-testid": `vanilla-chunk-${i}`, className: `${styles.chunkCard} ${activePathNodeIds.has(chunk.nodeId) ? styles.chunkRelevant : ''}`, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", i + 1] }), _jsx("span", { className: styles.chunkText, children: chunk.text })] }, chunk.nodeId))), !activeQuery.vanillaAnswered && (_jsx("p", { className: styles.failNote, children: "These chunks each contain one isolated fact. No single chunk chains them together." }))] }), _jsxs("div", { className: styles.retrievalColumn, children: [_jsxs("h4", { className: styles.panelTitle, children: ["GraphRAG", _jsx("span", { className: `${styles.badge} ${styles.badgeGreen}`, children: "Can answer" })] }), _jsxs("p", { className: styles.colSubtitle, children: ["Traversal path (", activeQuery.hops, " hop", activeQuery.hops !== 1 ? 's' : '', ")"] }), _jsx("ol", { className: styles.pathList, children: activeQuery.graphPath.map((step, i) => {
                                            const node = NODES.find(n => n.id === step.nodeId);
                                            return (_jsxs("li", { className: styles.pathStep, "data-testid": `path-step-${i}`, children: [_jsx("span", { className: styles.pathNodeBadge, style: { background: NODE_COLORS[node.type] }, children: node.label.replace('\n', ' ') }), step.edgeLabel && (_jsxs("span", { className: styles.pathEdge, children: ["\u2190 ", step.edgeLabel] }))] }, step.nodeId));
                                        }) }), _jsxs("div", { className: styles.answerBox, children: [_jsx("strong", { children: "Answer: " }), activeQuery.answer] })] })] })] }), _jsx("div", { className: styles.summaryPanel, children: activeQuery.hops === 1
                    ? 'Single-hop: Vanilla retrieved 5 chunks with the direct answer in the top result. GraphRAG confirms via one edge traversal. Both approaches work.'
                    : activeQuery.hops === 2
                        ? 'Two-hop: Vanilla retrieved 5 isolated facts — none combines Instagram ownership with Meta\'s CEO. GraphRAG assembled the answer chain in 2 hops.'
                        : 'Three-hop: Vanilla retrieved 5 isolated facts; the answer requires combining 3 of them in a specific order. GraphRAG returned that order as a single chain.' })] }));
}
