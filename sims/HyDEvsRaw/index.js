import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';
// ---------------------------------------------------------------------------
// Pre-loaded queries (hardcoded per pedagogical spec)
// ---------------------------------------------------------------------------
const QUERIES = [
    // ─── Query 0: HyDE big win ─────────────────────────────────────────────────
    {
        text: 'Why is my Postgres query slow on a large join?',
        hypotheticalAnswer: 'Postgres queries on large joins are often slow because the optimizer falls back to a sequential scan when there\'s no index on the join column. Run EXPLAIN ANALYZE to see the query plan — a \'Seq Scan\' node on a joined table is the smoking gun. Add a B-tree index on the join column to let the planner switch to an index scan.',
        corpus: [
            {
                id: 0,
                text: 'Sequential scans on joined tables in PostgreSQL indicate a missing B-tree index. Use EXPLAIN ANALYZE to verify — look for a Seq Scan node. Adding an index on the join column lets the planner choose an index scan instead.',
            },
            {
                id: 1,
                text: 'Postgres performance can degrade on large joins if statistics are stale. Run ANALYZE on the tables involved to update planner statistics.',
            },
            {
                id: 2,
                text: 'Slow queries are often caused by missing indexes, inefficient joins, or poor query structure. Profile with a monitoring tool before optimizing.',
            },
        ],
        correctChunkId: 0,
        rawCorrectRank: 3,
        hydeCorrectRank: 1,
        pedagogicalNote: 'The query uses conversational vocabulary (slow, large join) while the correct doc uses technical answer-style vocabulary (sequential scan, B-tree index, EXPLAIN ANALYZE). HyDE bridges that gap by generating answer-style text first.',
    },
    // ─── Query 1: HyDE modest win ──────────────────────────────────────────────
    {
        text: 'How do I reset my password?',
        hypotheticalAnswer: "To reset your password, navigate to the login page and click 'Forgot password.' Enter your email address; a password reset link will be sent. Click the link in the email and enter your new password. The link expires after 24 hours.",
        corpus: [
            {
                id: 0,
                text: "To reset your password, go to the login page, click 'Forgot password,' enter your email, and follow the link sent to your inbox.",
            },
            {
                id: 1,
                text: 'Password policies require at least 8 characters including one uppercase letter and one number.',
            },
            {
                id: 2,
                text: 'Account security settings let you enable two-factor authentication and manage your password preferences.',
            },
        ],
        correctChunkId: 0,
        rawCorrectRank: 2,
        hydeCorrectRank: 1,
        pedagogicalNote: 'For common how-to questions, HyDE provides a modest improvement — the query and the answer share vocabulary, so raw retrieval already works reasonably well.',
    },
    // ─── Query 2: HyDE no benefit ──────────────────────────────────────────────
    {
        text: 'What is the warranty period for SKU XR-7700-B?',
        hypotheticalAnswer: 'The warranty period for SKU XR-7700-B is 24 months from the date of purchase. The warranty covers manufacturing defects but excludes accidental damage or normal wear.',
        corpus: [
            {
                id: 0,
                text: 'SKU XR-7700-B carries a 24-month warranty from the date of purchase, covering manufacturing defects.',
            },
            {
                id: 1,
                text: 'Warranty claims must be submitted via the support portal with proof of purchase within the warranty period.',
            },
            {
                id: 2,
                text: 'Extended warranties are available for purchase within 30 days of the original product registration.',
            },
        ],
        correctChunkId: 0,
        rawCorrectRank: 1,
        hydeCorrectRank: 1,
        pedagogicalNote: 'The exact SKU identifier (XR-7700-B) already dominates the similarity score for both raw and HyDE retrieval. HyDE provides no quality lift here, but still costs an extra LLM call and adds latency.',
    },
];
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HYDE_ADDED_LATENCY_MS = 400;
const HYDE_ADDED_COST_USD = 0.001;
const TOP_N = 3;
// ---------------------------------------------------------------------------
// Retrieval quality label helper
// ---------------------------------------------------------------------------
function rankLabel(rank) {
    if (rank === 1)
        return 'Rank 1 — correct answer at top';
    if (rank === 2)
        return 'Rank 2 — correct answer one step below top';
    return `Rank ${rank} — correct answer buried`;
}
function rankColor(rank) {
    if (rank === 1)
        return '#059669';
    if (rank === 2)
        return '#d97706';
    return '#dc2626';
}
// ---------------------------------------------------------------------------
// Chunk ordering helpers
// Reorder corpus so that hardcoded ranks produce a stable top-3 display.
// Raw: correctChunkId appears at rawCorrectRank position.
// HyDE: correctChunkId appears at hydeCorrectRank position.
// ---------------------------------------------------------------------------
function buildRankedList(corpus, correctChunkId, correctRank) {
    const others = corpus.filter(c => c.id !== correctChunkId);
    const correct = corpus.find(c => c.id === correctChunkId);
    // Insert correct chunk at the desired rank (1-indexed)
    const result = [...others];
    result.splice(correctRank - 1, 0, correct);
    return result.slice(0, TOP_N);
}
export function HyDEvsRaw({ initialQueryIndex = 0 }) {
    const [activeQueryIndex, setActiveQueryIndex] = useState(initialQueryIndex);
    const activeQuery = QUERIES[activeQueryIndex];
    const { rawCorrectRank, hydeCorrectRank } = activeQuery;
    const qualityLift = rawCorrectRank - hydeCorrectRank;
    const rawRanked = buildRankedList(activeQuery.corpus, activeQuery.correctChunkId, rawCorrectRank);
    const hydeRanked = buildRankedList(activeQuery.corpus, activeQuery.correctChunkId, hydeCorrectRank);
    useEffect(() => {
        reportState('HyDEvsRaw', {
            activeQuery: activeQuery.text,
            rawCorrectRank,
            hydeCorrectRank,
            qualityLift,
            hyDeAddedLatencyMs: HYDE_ADDED_LATENCY_MS,
            hyDeAddedCostUSD: HYDE_ADDED_COST_USD,
        });
    }, [activeQueryIndex, activeQuery.text, rawCorrectRank, hydeCorrectRank, qualityLift]);
    return (_jsxs("div", { className: styles.sim, children: [_jsxs("div", { className: styles.queryRow, children: [_jsx("label", { htmlFor: "hyde-query-select", className: styles.queryLabel, children: _jsx("strong", { children: "Query:" }) }), _jsx("select", { id: "hyde-query-select", value: activeQueryIndex, onChange: e => setActiveQueryIndex(Number(e.target.value)), className: styles.querySelect, "aria-label": "Select query", children: QUERIES.map((q, i) => (_jsx("option", { value: i, children: q.text }, i))) })] }), _jsxs("div", { className: styles.columns, children: [_jsxs("div", { className: styles.panel, "data-testid": "raw-panel", children: [_jsx("h4", { className: styles.panelTitle, children: "Raw Query Retrieval" }), _jsxs("div", { className: styles.queryBox, children: [_jsx("span", { className: styles.queryBoxLabel, children: "Query:" }), _jsx("p", { className: styles.queryBoxText, children: activeQuery.text })] }), _jsx("p", { className: styles.retrievalSubtitle, children: "Top-3 retrieved chunks" }), rawRanked.map((chunk, i) => {
                                const isCorrect = chunk.id === activeQuery.correctChunkId;
                                return (_jsxs("div", { "data-testid": `raw-chunk-${i}`, className: `${styles.chunkCard} ${isCorrect ? styles.correctChunk : ''}`, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", i + 1] }), _jsxs("span", { className: styles.chunkText, children: [isCorrect && _jsx("span", { className: styles.checkMark, children: "\u2713" }), chunk.text] })] }, chunk.id));
                            }), _jsxs("div", { className: styles.qualityIndicator, children: [_jsx("span", { className: styles.qualityDot, style: { background: rankColor(rawCorrectRank) } }), _jsx("span", { className: styles.qualityLabel, style: { color: rankColor(rawCorrectRank) }, children: rankLabel(rawCorrectRank) })] })] }), _jsxs("div", { className: styles.panel, "data-testid": "hyde-panel", children: [_jsx("h4", { className: styles.panelTitle, children: "HyDE Retrieval" }), _jsxs("div", { className: styles.queryBox, children: [_jsx("span", { className: styles.queryBoxLabel, children: "Query:" }), _jsx("p", { className: styles.queryBoxText, children: activeQuery.text })] }), _jsxs("div", { className: styles.hypotheticalBox, children: [_jsx("span", { className: styles.hypotheticalLabel, children: "Hypothetical answer generated by LLM:" }), _jsx("p", { className: styles.hypotheticalText, children: activeQuery.hypotheticalAnswer })] }), _jsx("p", { className: styles.retrievalSubtitle, children: "Top-3 retrieved chunks (embedded from hypothetical answer)" }), hydeRanked.map((chunk, i) => {
                                const isCorrect = chunk.id === activeQuery.correctChunkId;
                                return (_jsxs("div", { "data-testid": `hyde-chunk-${i}`, className: `${styles.chunkCard} ${isCorrect ? styles.correctChunk : ''}`, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", i + 1] }), _jsxs("span", { className: styles.chunkText, children: [isCorrect && _jsx("span", { className: styles.checkMark, children: "\u2713" }), chunk.text] })] }, chunk.id));
                            }), _jsxs("div", { className: styles.qualityIndicator, children: [_jsx("span", { className: styles.qualityDot, style: { background: rankColor(hydeCorrectRank) } }), _jsx("span", { className: styles.qualityLabel, style: { color: rankColor(hydeCorrectRank) }, children: rankLabel(hydeCorrectRank) })] }), hydeCorrectRank < rawCorrectRank && (_jsxs("div", { className: styles.annotation, children: ["\u2191 correct answer at rank ", hydeCorrectRank, " (was rank ", rawCorrectRank, " in raw)"] })), hydeCorrectRank === rawCorrectRank && (_jsx("div", { className: styles.annotationNeutral, children: "same rank as raw retrieval \u2014 HyDE adds cost without quality benefit" }))] })] }), _jsxs("div", { className: styles.liftPanel, children: [qualityLift > 0 ? (_jsxs("span", { className: styles.liftPositive, children: ["Quality lift: HyDE moved the correct answer from rank ", rawCorrectRank, " to rank", ' ', hydeCorrectRank, " \u2191"] })) : qualityLift < 0 ? (_jsxs("span", { className: styles.liftNegative, children: ["Quality regression: HyDE moved the correct answer from rank ", rawCorrectRank, " to rank", ' ', hydeCorrectRank, " \u2193"] })) : (_jsxs("span", { className: styles.liftNeutral, children: ["No quality lift: correct answer at rank ", rawCorrectRank, " in both approaches."] })), _jsxs("span", { className: styles.liftCost, children: [' ', "HyDE adds ", _jsxs("strong", { children: ["+", HYDE_ADDED_LATENCY_MS, "ms latency"] }), " and", ' ', _jsxs("strong", { children: ["+$", HYDE_ADDED_COST_USD.toFixed(3), " cost"] }), " (extra LLM call)."] })] }), _jsxs("div", { className: styles.explainerPanel, children: [_jsx("strong", { children: "How HyDE works:" }), " When the query and answer use different vocabulary, HyDE shifts the embedding closer to the answer's natural language. Instead of embedding the question, it embeds a hypothetical answer \u2014 documents matching that answer-style text are usually the real answer.", activeQuery.pedagogicalNote && (_jsxs("span", { className: styles.pedagogicalNote, children: [" ", activeQuery.pedagogicalNote] }))] })] }));
}
