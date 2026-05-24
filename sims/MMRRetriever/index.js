import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { reportState } from '../../src/lib/reportState';
import styles from './index.module.css';
const CORPUS = [
    'Paris is the capital of France.',
    'The Eiffel Tower stands 330 meters tall and opened in 1889.',
    'France is famous for cheese, wine, and croissants.',
    'The Louvre in Paris is the most visited museum in the world.',
    'Tokyo is the largest metropolitan area in the world.',
    'Sushi originated as a method of preserving fish in fermented rice.',
    'Python is a high-level programming language created by Guido van Rossum.',
    'JavaScript runs in every web browser and was created in 1995.',
];
const QUERY = 'Tell me about Paris.';
const K = 3;
/** Tokenise a string into lowercase words. */
function tokenise(text) {
    return text.toLowerCase().match(/\w+/g) ?? [];
}
/** Toy bag-of-words cosine similarity. */
function cosineSim(a, b) {
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
/**
 * MMR selection:
 * score_i = λ * sim(d_i, q) - (1-λ) * max_{d_j ∈ selected} sim(d_i, d_j)
 * Greedily pick the doc maximising this score each round.
 */
function mmrSelect(corpus, query, k, lambda) {
    const queryScores = corpus.map(doc => cosineSim(doc, query));
    const selected = [];
    const remaining = corpus.map((_, idx) => idx);
    for (let round = 0; round < k && remaining.length > 0; round++) {
        let bestIdx = -1;
        let bestScore = -Infinity;
        for (const idx of remaining) {
            const relevance = queryScores[idx];
            const redundancy = selected.length === 0
                ? 0
                : Math.max(...selected.map(selIdx => cosineSim(corpus[idx], corpus[selIdx])));
            const mmrScore = lambda * relevance - (1 - lambda) * redundancy;
            if (mmrScore > bestScore) {
                bestScore = mmrScore;
                bestIdx = idx;
            }
        }
        if (bestIdx === -1)
            break;
        selected.push(bestIdx);
        remaining.splice(remaining.indexOf(bestIdx), 1);
    }
    return selected.map(idx => ({ doc: corpus[idx], score: queryScores[idx] }));
}
/** Vanilla top-K by relevance only. */
function vanillaTopK(corpus, query, k) {
    const scored = corpus.map(doc => ({ doc, score: cosineSim(doc, query) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
}
export function MMRRetriever({ initialLambda = 0.5 }) {
    const [lambda, setLambda] = useState(initialLambda);
    const { mmrSelected, vanillaResults, divergenceCount } = useMemo(() => {
        const mmrSelected = mmrSelect(CORPUS, QUERY, K, lambda);
        const vanillaResults = vanillaTopK(CORPUS, QUERY, K);
        const vanillaDocs = new Set(vanillaResults.map(d => d.doc));
        const divergenceCount = mmrSelected.filter(d => !vanillaDocs.has(d.doc)).length;
        return { mmrSelected, vanillaResults, divergenceCount };
    }, [lambda]);
    useEffect(() => {
        reportState('MMRRetriever', {
            lambda,
            query: QUERY,
            mmrSelected,
            vanillaTopK: vanillaResults,
            divergenceCount,
        });
    }, [lambda, mmrSelected, vanillaResults, divergenceCount]);
    return (_jsxs("div", { className: styles.sim, children: [_jsxs("p", { children: [_jsx("strong", { children: "Query:" }), " ", QUERY] }), _jsxs("label", { className: styles.sliderLabel, children: [_jsxs("span", { children: ["Lambda (\u03BB):\u00A0", _jsx("strong", { children: lambda.toFixed(2) })] }), _jsx("input", { type: "range", min: 0, max: 1, step: 0.05, value: lambda, "aria-label": "Lambda diversity weight", onChange: e => setLambda(Number(e.target.value)) })] }), _jsx("p", { className: styles.hint, children: "\u03BB = 1 \u2192 pure relevance \u00A0|\u00A0 \u03BB = 0 \u2192 pure diversity" }), _jsxs("div", { className: styles.columns, children: [_jsxs("div", { className: styles.panel, children: [_jsxs("h4", { className: styles.panelTitle, children: ["MMR Selected (\u03BB = ", lambda.toFixed(2), ")"] }), mmrSelected.map((item, i) => (_jsxs("div", { "data-testid": `mmr-card-${i}`, className: styles.docCard, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", i + 1] }), _jsx("span", { className: styles.docText, children: item.doc }), _jsx("span", { className: styles.scoreChip, children: item.score.toFixed(3) })] }, i)))] }), _jsxs("div", { className: styles.panel, children: [_jsx("h4", { className: styles.panelTitle, children: "Vanilla Top-3 (relevance only)" }), vanillaResults.map((item, i) => (_jsxs("div", { "data-testid": `vanilla-card-${i}`, className: styles.docCard, children: [_jsxs("span", { className: styles.rankBadge, children: ["#", i + 1] }), _jsx("span", { className: styles.docText, children: item.doc }), _jsx("span", { className: styles.scoreChip, children: item.score.toFixed(3) })] }, i)))] })] }), _jsxs("p", { className: styles.divergenceNote, children: ["MMR picked ", _jsx("strong", { children: divergenceCount }), " doc", divergenceCount !== 1 ? 's' : '', " that pure relevance didn't."] })] }));
}
