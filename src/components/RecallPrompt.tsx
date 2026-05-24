import { useState, useEffect } from 'react';
import { createCard, gradeCard } from '../lib/srs';
import { subscribeToPendingGrade, PendingGrade } from '../lib/stateFile';
import styles from './RecallPrompt.module.css';

interface Props {
  concept: string;
  question: string;
}

type Phase = 'answering' | 'awaitingGrade' | 'graded' | 'committed';

export function RecallPrompt({ concept, question }: Props) {
  const [phase, setPhase] = useState<Phase>('answering');
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState<PendingGrade | null>(null);

  useEffect(() => {
    if (phase !== 'awaitingGrade') return;
    return subscribeToPendingGrade(g => {
      if (g.concept !== concept) return;
      setGrade(g);
      setPhase('graded');
    });
  }, [phase, concept]);

  async function submit() {
    if (answer.trim().length === 0) return;
    await fetch('http://localhost:5174/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pendingAnswer: { concept, question, answer, ts: new Date().toISOString() },
      }),
    }).catch(() => {});
    setPhase('awaitingGrade');
  }

  function commitToSr() {
    if (!grade) return;
    createCard(concept, question);
    gradeCard(concept, grade.rating);
    fetch('http://localhost:5174/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingAnswer: null, pendingGrade: null }),
    }).catch(() => {});
    setPhase('committed');
  }

  return (
    <div className={styles.prompt} data-concept={concept}>
      <h4>Recall</h4>
      <p className={styles.question}>{question}</p>
      <textarea
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        rows={4}
        disabled={phase !== 'answering'}
        placeholder="Type your answer. Free-form. The act of generating is the point."
      />
      {phase === 'answering' && (
        <button type="button" onClick={submit} disabled={answer.trim().length === 0}>
          Submit
        </button>
      )}
      {phase === 'awaitingGrade' && (
        <p className={styles.instruction}>
          {`Run /quiz ${concept} in your Claude Code terminal to grade this answer.`}
        </p>
      )}
      {phase === 'graded' && grade && (
        <div className={styles.gradePanel}>
          <p>
            <strong>Claude's rating:</strong> {ratingName(grade.rating)} ({grade.rating}/4)
          </p>
          {grade.comment && <p className={styles.comment}>{grade.comment}</p>}
          <button type="button" onClick={commitToSr}>Commit to SR</button>
        </div>
      )}
      {phase === 'committed' && <p className={styles.committed}>✓ Added to spaced repetition queue.</p>}
    </div>
  );
}

function ratingName(r: 1 | 2 | 3 | 4): string {
  return ['', 'Again', 'Hard', 'Good', 'Easy'][r] ?? '';
}
