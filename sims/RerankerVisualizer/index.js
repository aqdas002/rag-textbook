import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';
const QUERY = "How do I revoke a user's access?";
const CORPUS = [
    { text: 'To remove permissions, navigate to Settings → Users and click Revoke.', relevance: 1.0 },
    { text: 'Access tokens are issued by the auth server and stored in cookies.', relevance: 0.1 },
    { text: 'Revoking access requires admin privileges on the team workspace.', relevance: 0.9 },
    { text: 'User authentication uses OAuth 2.0 with PKCE for security.', relevance: 0.1 },
    { text: 'The Users panel shows all members with their roles and last login.', relevance: 0.3 },
    { text: 'To delete a user account permanently, contact support.', relevance: 0.2 },
    { text: 'API access keys can be rotated from the developer settings page.', relevance: 0.2 },
    { text: 'Granting access to new users is done from the same Settings → Users page.', relevance: 0.4 },
    { text: 'Lost access usually means a session expired; sign in again.', relevance: 0.1 },
    { text: 'Audit logs record every permission change with timestamp and actor.', relevance: 0.3 },
];
const STOPWORDS = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'do', 'does', 'did', 'have', 'has', 'had', 'i', 'me', 'my', 'we', 'our', 'to',
    'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'of', 'with', 'from',
    'how', 's', 'it', 'its', 'this', 'that', 'not', 'all', 'can',
]);
/** Tokenise a string into lowercase content words (stopwords filtered). */
function tokenise(text) {
    const toks = text.toLowerCase().match(/\w+/g) ?? [];
    return toks.filter(t => !STOPWORDS.has(t));
}
/** Toy bag-of-words cosine similarity. */
function bowCosine(a, b) {
    const tokA = tokenise(a);
    const tokB = tokenise(b);
    if (tokA.length === 0 || tokB.length === 0)
        return 0;
    const freqA = new Map();
    const freqB = new Map();
    for (const t of tokA)
        freqA.set(t, (freqA.get(t) ?? 0) + 1);
    for (const t of tokB)
        freqB.set(t, (freqB.get(t) ?? 0) + 1);
    let dot = 0;
    for (const [term, fa] of freqA) {
        dot += fa * (freqB.get(term) ?? 0);
    }
    const magA = Math.sqrt([...freqA.values()].reduce((s, v) => s + v * v, 0));
    const magB = Math.sqrt([...freqB.values()].reduce((s, v) => s + v * v, 0));
    return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
}
/** Cross-encoder score: 0.4 * bow_cosine + 0.6 * relevance */
function crossScore(doc, query) {
    return 0.4 * bowCosine(doc.text, query) + 0.6 * doc.relevance;
}
function rankArrow(oldRank, newRank) {
    if (newRank < oldRank)
        return `↑ was #${oldRank}`;
    if (newRank > oldRank)
        return `↓ was #${oldRank}`;
    return `→ was #${oldRank}`;
}
export function RerankerVisualizer({ initialK = 5 }) {
    const [k, setK] = useState(initialK);
    const { biEncoderTop, reranked, promotedToTop3 } = useMemo(() => {
        // Stage 1: bi-encoder — sort all 10 docs by bow cosine
        const biScored = CORPUS.map((doc, idx) => ({
            idx,
            text: doc.text,
            score: bowCosine(doc.text, QUERY),
            rank: 0,
        }));
        biScored.sort((a, b) => b.score - a.score);
        biScored.forEach((d, i) => { d.rank = i + 1; });
        // Stage 2: cross-encoder — take top-K from bi-encoder and re-score
        const topK = biScored.slice(0, k);
        const crossScored = topK.map(d => ({
            text: d.text,
            oldRank: d.rank,
            score: crossScore(CORPUS[d.idx], QUERY),
            newRank: 0,
        }));
        crossScored.sort((a, b) => b.score - a.score);
        crossScored.forEach((d, i) => { d.newRank = i + 1; });
        // Count docs promoted into top-3: newRank <= 3 but oldRank > 3
        const promotedToTop3 = crossScored.filter(d => d.newRank <= 3 && d.oldRank > 3).length;
        return {
            biEncoderTop: biScored.map(d => ({ text: d.text, score: d.score, rank: d.rank })),
            reranked: crossScored,
            promotedToTop3,
        };
    }, [k]);
    useEffect(() => {
        reportState('RerankerVisualizer', {
            k,
            query: QUERY,
            biEncoderTop,
            reranked,
            promotedToTop3,
        });
    }, [k, biEncoderTop, reranked, promotedToTop3]);
    return (_jsxs("div", { className: styles.sim, children: [_jsxs("p", { children: [_jsx("strong", { children: "Query:" }), " ", QUERY] }), _jsxs("label", { className: styles.sliderLabel, children: [_jsxs("span", { children: ["Top-K sent to reranker:\u00A0", _jsx("strong", { children: k })] }), _jsx("input", { type: "range", min: 1, max: 10, step: 1, value: k, "aria-label": "Top-K for reranking", onChange: e => setK(Number(e.target.value)) })] }), _jsxs("div", { className: styles.columns, children: [_jsxs("div", { className: styles.panel, children: [_jsx("h4", { className: styles.panelTitle, children: "Stage 1 \u2014 Bi-encoder (bag-of-words cosine)" }), biEncoderTop.map((doc, i) => (_jsxs("div", { "data-testid": `bi-row-${i}`, className: `${styles.docCard} ${i < k ? styles.inTopK : ''}`, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", doc.rank] }), _jsx("span", { className: styles.docText, children: doc.text }), _jsx("span", { className: styles.scoreChip, children: doc.score.toFixed(3) })] }, i))), _jsxs("p", { className: styles.hint, children: ["Top ", k, " (shaded) sent to reranker"] })] }), _jsxs("div", { className: styles.panel, children: [_jsx("h4", { className: styles.panelTitle, children: "Stage 2 \u2014 Cross-encoder reranked" }), reranked.map((doc, i) => (_jsxs("div", { "data-testid": `rerank-row-${i}`, className: styles.docCard, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", doc.newRank] }), _jsx("span", { className: styles.docText, children: doc.text }), _jsx("span", { className: styles.scoreChip, children: doc.score.toFixed(3) }), _jsx("span", { className: doc.newRank < doc.oldRank ? styles.up : doc.newRank > doc.oldRank ? styles.down : styles.same, children: rankArrow(doc.oldRank, doc.newRank) })] }, i)))] })] }), _jsxs("div", { className: styles.statsPanel, children: [_jsxs("strong", { children: ["Reranker promoted ", promotedToTop3, " doc", promotedToTop3 !== 1 ? 's' : '', " into the top-3"] }), promotedToTop3 > 0 && (_jsxs("span", { className: styles.promotedNote, children: [' ', "\u2014 docs relevant but not keyword-rich get rescued by cross-encoder scoring"] }))] })] }));
}
