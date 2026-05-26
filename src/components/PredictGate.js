import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PredictGate.tsx
import { useState, cloneElement, isValidElement } from 'react';
import styles from './PredictGate.module.css';
import { usePreferences } from '../lib/preferences';
export function PredictGate({ concept, question, hint, children }) {
    const { predictFirst } = usePreferences();
    if (!predictFirst) {
        const passThroughChildren = isValidElement(children)
            ? cloneElement(children, { 'data-locked': 'false' })
            : children;
        return _jsx("div", { className: styles.gate, "data-concept": concept, children: passThroughChildren });
    }
    return _jsx(PredictGateActive, { concept: concept, question: question, hint: hint, children: children });
}
function PredictGateActive({ concept, question, hint, children }) {
    const [prediction, setPrediction] = useState('');
    const [submitted, setSubmitted] = useState(false);
    function submit() {
        if (prediction.trim().length === 0)
            return;
        setSubmitted(true);
    }
    const lockedChildren = isValidElement(children)
        ? cloneElement(children, { 'data-locked': String(!submitted) })
        : children;
    return (_jsxs("div", { className: styles.gate, "data-concept": concept, children: [!submitted && (_jsxs("div", { className: styles.predictPanel, children: [_jsx("h4", { children: "Predict first" }), _jsx("p", { className: styles.question, children: question }), hint && _jsxs("p", { className: styles.hint, children: ["Hint: ", hint] }), _jsx("textarea", { value: prediction, onChange: e => setPrediction(e.target.value), placeholder: "It's OK to be wrong — making the guess is the point.", rows: 3 }), _jsx("button", { type: "button", onClick: submit, children: "Unlock sim" })] })), submitted && (_jsxs("div", { className: styles.predictionShown, children: [_jsx("strong", { children: "Your prediction:" }), " ", prediction] })), _jsx("div", { className: submitted ? styles.unlocked : styles.locked, children: lockedChildren })] }));
}
