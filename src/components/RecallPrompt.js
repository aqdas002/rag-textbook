import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createCard, gradeCard } from '../lib/srs';
import { subscribeToPendingGrade } from '../lib/stateFile';
import styles from './RecallPrompt.module.css';
export function RecallPrompt({ concept, question }) {
    const [phase, setPhase] = useState('answering');
    const [answer, setAnswer] = useState('');
    const [grade, setGrade] = useState(null);
    useEffect(() => {
        if (phase !== 'awaitingGrade')
            return;
        return subscribeToPendingGrade(g => {
            if (g.concept !== concept)
                return;
            setGrade(g);
            setPhase('graded');
        });
    }, [phase, concept]);
    async function submit() {
        if (answer.trim().length === 0)
            return;
        await fetch('http://localhost:5174/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pendingAnswers: {
                    [concept]: { concept, question, answer, ts: new Date().toISOString() },
                },
            }),
        }).catch(() => { });
        setPhase('awaitingGrade');
    }
    function commitToSr() {
        if (!grade)
            return;
        createCard(concept, question);
        gradeCard(concept, grade.rating);
        fetch('http://localhost:5174/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pendingAnswers: { [concept]: null },
                pendingGrades: { [concept]: null },
            }),
        }).catch(() => { });
        setPhase('committed');
    }
    return (_jsxs("div", { className: styles.prompt, "data-concept": concept, children: [_jsx("h4", { children: "Recall" }), _jsx("p", { className: styles.question, children: question }), _jsx("textarea", { value: answer, onChange: e => setAnswer(e.target.value), rows: 4, disabled: phase !== 'answering', placeholder: "Type your answer. Free-form. The act of generating is the point." }), phase === 'answering' && (_jsx("button", { type: "button", onClick: submit, disabled: answer.trim().length === 0, children: "Submit" })), phase === 'awaitingGrade' && (_jsx("p", { className: styles.instruction, children: `Run /quiz ${concept} in your Claude Code terminal to grade this answer.` })), phase === 'graded' && grade && (_jsxs("div", { className: styles.gradePanel, children: [_jsxs("p", { children: [_jsx("strong", { children: "Claude's rating:" }), " ", ratingName(grade.rating), " (", grade.rating, "/4)"] }), grade.comment && _jsx("p", { className: styles.comment, children: grade.comment }), _jsx("button", { type: "button", onClick: commitToSr, children: "Commit to SR" })] })), phase === 'committed' && _jsx("p", { className: styles.committed, children: "\u2713 Added to spaced repetition queue." })] }));
}
function ratingName(r) {
    return ['', 'Again', 'Hard', 'Good', 'Easy'][r] ?? '';
}
