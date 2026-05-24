import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';
const CORPUS = [
    { id: 0, text: 'Error code E_AUTH_4096 indicates an expired session token. Retry after re-authentication.' },
    { id: 1, text: 'When users cannot sign in, the most common cause is a session that has timed out due to inactivity.' },
    { id: 2, text: 'Product SKU XR-7700-B is the 16GB enterprise variant of the laptop series.' },
    { id: 3, text: 'The premium model with sixteen gigabytes of memory is intended for business customers.' },
    { id: 4, text: 'To rotate an API key, navigate to Developer Settings and click Regenerate.' },
    { id: 5, text: 'Issuing a fresh authentication credential is done through the developer portal.' },
    { id: 6, text: 'Customer onboarding flows should request the minimum data needed to provision the account.' },
    { id: 7, text: 'Tiered pricing applies above 10,000 monthly active users.' },
    { id: 8, text: 'Refunds are processed within 5 business days of the request.' },
    // doc9 deliberately uses synonyms ("Funds" / "returned" / "payment") instead of query terms
    // ("money" / "back") so BM25 scores 0 while dense synonym expansion finds it.
    { id: 9, text: 'Funds will be returned to your original payment method within a week of cancellation.' },
    { id: 10, text: 'The CHANGELOG.md file lists all releases by version number.' },
    { id: 11, text: 'Release notes are maintained in source control alongside the code.' },
];
const QUERIES = [
    // Q1+Q2: BM25 wins — rare identifier tokens (E_AUTH_4096, XR-7700-B) appear only in the correct doc.
    { text: 'What does E_AUTH_4096 mean?', correctDocId: 0, favored: 'bm25' },
    { text: 'Tell me about SKU XR-7700-B', correctDocId: 2, favored: 'bm25' },
    // Q3+Q4: Dense wins — query uses different vocabulary; synonym expansion bridges the gap.
    // BM25 scores 0 on the correct doc (no shared tokens); dense finds it via synonym expansion.
    { text: 'How do I get my money back?', correctDocId: 9, favored: 'dense' },
    { text: 'How do I get a brand-new login key?', correctDocId: 5, favored: 'dense' },
    // Q5: Both methods find the right doc — control case.
    { text: 'How do I rotate an API key?', correctDocId: 4, favored: 'either' },
];
// ---------------------------------------------------------------------------
// Dense synonym expansion (query-side only)
// Simulates the paraphrase bridging that real dense embeddings perform.
// ---------------------------------------------------------------------------
const DENSE_SYNONYMS = new Map([
    ['money', ['funds', 'refund', 'payment', 'reimbursement', 'cost']],
    ['back', ['return', 'returned', 'refunded', 'reimburse']],
    ['get', ['obtain', 'receive', 'retrieve']],
    ['brand', ['fresh']],
    ['new', ['fresh', 'regenerate']],
    ['rotate', ['regenerate', 'renew', 'refresh', 'replace']],
    ['login', ['authentication', 'credential', 'auth', 'sign']],
]);
// ---------------------------------------------------------------------------
// BM25 implementation (k1=1.5, b=0.75)
// ---------------------------------------------------------------------------
/** Tokenise for BM25: lowercase, strip punctuation, no stopword removal. */
function tokeniseBM25(text) {
    return text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
}
function buildBM25Index(corpus) {
    const N = corpus.length;
    const tf = new Map();
    const df = new Map();
    const docLengths = [];
    for (const doc of corpus) {
        const tokens = tokeniseBM25(doc.text);
        docLengths.push(tokens.length);
        const termFreqs = new Map();
        for (const t of tokens) {
            termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1);
        }
        tf.set(doc.id, termFreqs);
        for (const t of termFreqs.keys()) {
            df.set(t, (df.get(t) ?? 0) + 1);
        }
    }
    const avgdl = docLengths.reduce((a, b) => a + b, 0) / N;
    return { tf, df, docLengths, avgdl, N };
}
function bm25Score(docId, queryTokens, index, k1 = 1.5, b = 0.75) {
    const { tf, df, docLengths, avgdl, N } = index;
    const docTF = tf.get(docId) ?? new Map();
    const dl = docLengths[docId];
    let score = 0;
    for (const term of queryTokens) {
        const termTF = docTF.get(term) ?? 0;
        if (termTF === 0)
            continue;
        const termDF = df.get(term) ?? 0;
        const idf = Math.log((N - termDF + 0.5) / (termDF + 0.5) + 1);
        const numerator = termTF * (k1 + 1);
        const denominator = termTF + k1 * (1 - b + b * (dl / avgdl));
        score += idf * (numerator / denominator);
    }
    return score;
}
// ---------------------------------------------------------------------------
// Dense (bag-of-words cosine + stopword removal + synonym expansion)
// ---------------------------------------------------------------------------
const STOPWORDS = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did',
    'how', 'what', 'why', 'when', 'of', 'to', 'in', 'on', 'for', 'and',
    'or', 'my', 'your', 'me', 'you', 'i',
]);
function tokeniseDense(text) {
    const toks = text.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
    return toks.filter(t => !STOPWORDS.has(t));
}
/** Expand query tokens with synonyms to simulate embedding paraphrase bridging. */
function expandQueryTokens(tokens) {
    const expanded = new Set(tokens);
    for (const t of tokens) {
        for (const syn of DENSE_SYNONYMS.get(t) ?? []) {
            expanded.add(syn);
        }
    }
    return [...expanded];
}
function bowCosineExpanded(queryText, docText) {
    const qExpanded = expandQueryTokens(tokeniseDense(queryText));
    const dTokens = tokeniseDense(docText);
    if (qExpanded.length === 0 || dTokens.length === 0)
        return 0;
    const freqQ = new Map();
    const freqD = new Map();
    for (const t of qExpanded)
        freqQ.set(t, (freqQ.get(t) ?? 0) + 1);
    for (const t of dTokens)
        freqD.set(t, (freqD.get(t) ?? 0) + 1);
    let dot = 0;
    for (const [term, fq] of freqQ) {
        dot += fq * (freqD.get(term) ?? 0);
    }
    const magQ = Math.sqrt([...freqQ.values()].reduce((s, v) => s + v * v, 0));
    const magD = Math.sqrt([...freqD.values()].reduce((s, v) => s + v * v, 0));
    return magQ > 0 && magD > 0 ? dot / (magQ * magD) : 0;
}
function reciprocalRankFusion(bm25Ranked, denseRanked, k = 60) {
    const scores = new Map();
    // Only include BM25 docs with score > 0 (zero-score docs have no retrieval signal).
    const bm25Positive = bm25Ranked.filter(d => d.score > 0);
    const bm25ForRRF = bm25Positive.map((d, i) => ({ ...d, rank: i + 1 }));
    for (const doc of bm25ForRRF) {
        scores.set(doc.docId, (scores.get(doc.docId) ?? 0) + 1 / (k + doc.rank));
    }
    for (const doc of denseRanked) {
        scores.set(doc.docId, (scores.get(doc.docId) ?? 0) + 1 / (k + doc.rank));
    }
    const sorted = [...scores.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([docId, score], i) => ({ docId, score, rank: i + 1 }));
    return sorted;
}
// ---------------------------------------------------------------------------
// Compute rankings for a given query
// ---------------------------------------------------------------------------
const BM25_INDEX = buildBM25Index(CORPUS);
function computeRankings(queryText) {
    const bm25QueryTokens = tokeniseBM25(queryText);
    const bm25Scored = CORPUS.map(doc => ({
        docId: doc.id,
        score: bm25Score(doc.id, bm25QueryTokens, BM25_INDEX),
    }));
    bm25Scored.sort((a, b) => b.score - a.score);
    const bm25Top = bm25Scored.map((d, i) => ({ ...d, rank: i + 1 }));
    const denseScored = CORPUS.map(doc => ({
        docId: doc.id,
        score: bowCosineExpanded(queryText, doc.text),
    }));
    denseScored.sort((a, b) => b.score - a.score);
    const denseTop = denseScored.map((d, i) => ({ ...d, rank: i + 1 }));
    const hybridTop = reciprocalRankFusion(bm25Top, denseTop);
    return { bm25Top, denseTop, hybridTop };
}
// ---------------------------------------------------------------------------
// Cross-query summary (computed once at module load)
// ---------------------------------------------------------------------------
function computeCrossQueryStats() {
    let bm25Wins = 0;
    let denseWins = 0;
    let hybridWins = 0;
    for (const q of QUERIES) {
        const { bm25Top, denseTop, hybridTop } = computeRankings(q.text);
        if (bm25Top[0].docId === q.correctDocId)
            bm25Wins++;
        if (denseTop[0].docId === q.correctDocId)
            denseWins++;
        if (hybridTop[0].docId === q.correctDocId)
            hybridWins++;
    }
    return { bm25Wins, denseWins, hybridWins };
}
function determineWinner(bm25Top, denseTop, hybridTop, correctDocId) {
    const bm25Rank = bm25Top.find(d => d.docId === correctDocId)?.rank ?? 999;
    const denseRank = denseTop.find(d => d.docId === correctDocId)?.rank ?? 999;
    const hybridRank = hybridTop.find(d => d.docId === correctDocId)?.rank ?? 999;
    const minRank = Math.min(bm25Rank, denseRank, hybridRank);
    const winners = [];
    if (bm25Rank === minRank)
        winners.push('BM25');
    if (denseRank === minRank)
        winners.push('Dense');
    if (hybridRank === minRank)
        winners.push('Hybrid');
    if (winners.length > 1)
        return 'Tie';
    return winners[0] ?? 'Hybrid';
}
const CROSS_QUERY_STATS = computeCrossQueryStats();
const TOP_N = 5;
export function BM25vsDenseComparison({ initialQueryIndex = 0 }) {
    const [activeQueryIndex, setActiveQueryIndex] = useState(initialQueryIndex);
    const activeQuery = QUERIES[activeQueryIndex];
    const { bm25Top, denseTop, hybridTop, winner } = useMemo(() => {
        const { bm25Top, denseTop, hybridTop } = computeRankings(activeQuery.text);
        const winner = determineWinner(bm25Top, denseTop, hybridTop, activeQuery.correctDocId);
        return {
            bm25Top: bm25Top.slice(0, TOP_N),
            denseTop: denseTop.slice(0, TOP_N),
            hybridTop: hybridTop.slice(0, TOP_N),
            winner,
        };
    }, [activeQueryIndex]);
    useEffect(() => {
        reportState('BM25vsDenseComparison', {
            activeQuery: activeQuery.text,
            bm25Top,
            denseTop,
            hybridTop,
            winnerThisQuery: winner,
            hybridWinsAcrossAllQueries: CROSS_QUERY_STATS.hybridWins,
        });
    }, [activeQueryIndex, bm25Top, denseTop, hybridTop, winner, activeQuery.text]);
    return (_jsxs("div", { className: styles.sim, children: [_jsxs("div", { className: styles.queryRow, children: [_jsx("label", { htmlFor: "query-select", className: styles.queryLabel, children: _jsx("strong", { children: "Query:" }) }), _jsx("select", { id: "query-select", value: activeQueryIndex, onChange: e => setActiveQueryIndex(Number(e.target.value)), className: styles.querySelect, children: QUERIES.map((q, i) => (_jsx("option", { value: i, children: q.text }, i))) })] }), _jsxs("div", { className: styles.columns, children: [_jsxs("div", { className: styles.panel, children: [_jsx("h4", { className: styles.panelTitle, children: "BM25 (lexical)" }), bm25Top.map((doc, i) => {
                                const isCorrect = doc.docId === activeQuery.correctDocId;
                                return (_jsxs("div", { "data-testid": `bm25-row-${i}`, className: `${styles.docCard} ${isCorrect ? styles.correctDoc : ''}`, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", doc.rank] }), _jsxs("span", { className: styles.docText, children: [isCorrect && _jsx("span", { className: styles.checkMark, children: "\u2713" }), CORPUS[doc.docId].text] }), _jsx("span", { className: styles.scoreChip, children: doc.score.toFixed(3) })] }, doc.docId));
                            })] }), _jsxs("div", { className: styles.panel, children: [_jsx("h4", { className: styles.panelTitle, children: "Dense (semantic)" }), denseTop.map((doc, i) => {
                                const isCorrect = doc.docId === activeQuery.correctDocId;
                                return (_jsxs("div", { "data-testid": `dense-row-${i}`, className: `${styles.docCard} ${isCorrect ? styles.correctDoc : ''}`, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", doc.rank] }), _jsxs("span", { className: styles.docText, children: [isCorrect && _jsx("span", { className: styles.checkMark, children: "\u2713" }), CORPUS[doc.docId].text] }), _jsx("span", { className: styles.scoreChip, children: doc.score.toFixed(4) })] }, doc.docId));
                            })] }), _jsxs("div", { className: styles.panel, children: [_jsx("h4", { className: styles.panelTitle, children: "Hybrid \u2014 RRF" }), hybridTop.map((doc, i) => {
                                const isCorrect = doc.docId === activeQuery.correctDocId;
                                return (_jsxs("div", { "data-testid": `hybrid-row-${i}`, className: `${styles.docCard} ${isCorrect ? styles.correctDoc : ''}`, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", doc.rank] }), _jsxs("span", { className: styles.docText, children: [isCorrect && _jsx("span", { className: styles.checkMark, children: "\u2713" }), CORPUS[doc.docId].text] }), _jsx("span", { className: styles.scoreChip, children: doc.score.toFixed(4) })] }, doc.docId));
                            })] })] }), _jsxs("div", { className: styles.winnerRow, children: [_jsxs("span", { className: `${styles.winnerBadge} ${styles[`winner${winner}`]}`, "data-testid": "winner-badge", children: [winner, " wins"] }), _jsxs("span", { className: styles.winnerNote, children: ["\u00A0\u2014 correct doc (#", activeQuery.correctDocId, ") ranked highest by ", winner] })] }), _jsxs("div", { className: styles.summaryPanel, children: [_jsx("strong", { children: "Across all 5 queries:" }), ' ', "Hybrid found the right answer in", ' ', _jsxs("strong", { children: [CROSS_QUERY_STATS.hybridWins, " of 5"] }), " queries;", ' ', "BM25 alone in ", _jsx("strong", { children: CROSS_QUERY_STATS.bm25Wins }), ";", ' ', "Dense alone in ", _jsx("strong", { children: CROSS_QUERY_STATS.denseWins }), "."] })] }));
}
