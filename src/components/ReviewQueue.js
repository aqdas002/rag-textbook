import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { getDueCards } from '../lib/srs';
import { RecallPrompt } from './RecallPrompt';
import styles from './ReviewQueue.module.css';
export function ReviewQueue() {
    const due = useMemo(() => getDueCards(), []);
    if (due.length === 0) {
        return _jsx("p", { className: styles.empty, children: "No reviews due. Come back later." });
    }
    const first = due[0];
    return (_jsxs("div", { className: styles.queue, children: [_jsxs("h3", { children: [due.length, " review", due.length === 1 ? '' : 's', " due"] }), _jsx(RecallPrompt, { concept: first.concept, question: first.prompt })] }));
}
