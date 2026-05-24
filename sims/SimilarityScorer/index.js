import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { reportState } from '../../src/lib/reportState';
import { WORDS } from '../EmbeddingSpace';
import styles from './index.module.css';
// Center coordinates around (0,0) so cosine similarity can go negative when
// phrases point to opposite quadrants of the embedding space.
const VOCAB = new Map(WORDS.map(w => [w.word, { x: w.x - 0.5, y: w.y - 0.5 }]));
function tokenize(s) {
    return s.toLowerCase().match(/[a-z]+/g) ?? [];
}
function embed(phrase) {
    const tokens = tokenize(phrase);
    const recognized = tokens.filter(t => VOCAB.has(t));
    if (recognized.length === 0)
        return { vec: null, recognized: [] };
    const sum = recognized.reduce((acc, w) => {
        const v = VOCAB.get(w);
        return [acc[0] + v.x, acc[1] + v.y];
    }, [0, 0]);
    return { vec: [sum[0] / recognized.length, sum[1] / recognized.length], recognized };
}
function cosine(a, b) {
    const dot = a[0] * b[0] + a[1] * b[1];
    const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
    const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
    if (magA === 0 || magB === 0)
        return 0;
    return dot / (magA * magB);
}
export function SimilarityScorer({ initialA = 'the king and queen wear the crown', initialB = 'royalty rules the throne', }) {
    const [phraseA, setPhraseA] = useState(initialA);
    const [phraseB, setPhraseB] = useState(initialB);
    const a = useMemo(() => embed(phraseA), [phraseA]);
    const b = useMemo(() => embed(phraseB), [phraseB]);
    const similarity = a.vec && b.vec ? cosine(a.vec, b.vec) : 0;
    const displayBar = Math.max(0, Math.min(1, similarity));
    const barColor = similarity > 0.7 ? '#10b981' : similarity > 0.3 ? '#f59e0b' : '#ef4444';
    useEffect(() => {
        reportState('SimilarityScorer', {
            phraseA,
            phraseB,
            similarity,
            recognizedA: a.recognized,
            recognizedB: b.recognized,
        });
    }, [phraseA, phraseB, similarity, a.recognized, b.recognized]);
    return (_jsxs("div", { className: styles.sim, children: [_jsxs("label", { className: styles.field, children: [_jsx("span", { className: styles.label, children: "Phrase A" }), _jsx("textarea", { value: phraseA, onChange: e => setPhraseA(e.target.value), rows: 2 }), _jsxs("span", { className: styles.tokens, children: ["recognized: ", a.recognized.length ? a.recognized.join(', ') : '(none)'] })] }), _jsxs("label", { className: styles.field, children: [_jsx("span", { className: styles.label, children: "Phrase B" }), _jsx("textarea", { value: phraseB, onChange: e => setPhraseB(e.target.value), rows: 2 }), _jsxs("span", { className: styles.tokens, children: ["recognized: ", b.recognized.length ? b.recognized.join(', ') : '(none)'] })] }), _jsxs("div", { className: styles.scoreRow, children: [_jsx("span", { className: styles.scoreLabel, children: "Cosine similarity:" }), _jsx("strong", { className: styles.scoreValue, children: similarity.toFixed(2) })] }), _jsx("div", { className: styles.barTrack, children: _jsx("div", { className: styles.barFill, style: { width: `${displayBar * 100}%`, background: barColor } }) }), _jsxs("p", { className: styles.note, children: ["Vocab is the 30 words from the embedding space. Tokens not in vocab are ignored \u2014 that's why ", _jsx("em", { children: "\"the king sleeps\"" }), " and ", _jsx("em", { children: "\"the king reigns\"" }), "score the same. Synonym swaps that stay in the same cluster keep similarity high; jumping clusters tanks it."] })] }));
}
