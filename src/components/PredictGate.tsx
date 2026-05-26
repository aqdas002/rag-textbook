// src/components/PredictGate.tsx
import { useState, ReactNode, cloneElement, isValidElement } from 'react';
import styles from './PredictGate.module.css';
import { usePreferences } from '../lib/preferences';

interface Props {
  concept: string;
  question: string;
  hint?: string;
  children: ReactNode;
}

export function PredictGate({ concept, question, hint, children }: Props) {
  const { predictFirst } = usePreferences();

  if (!predictFirst) {
    // Pass-through: render children with data-locked='false'
    const passThroughChildren = isValidElement(children)
      ? cloneElement(children as React.ReactElement, { 'data-locked': 'false' })
      : children;
    return (
      <div className={styles.gate} data-concept={concept}>
        {passThroughChildren}
      </div>
    );
  }

  // Existing predict-first behavior below
  return <PredictGateActive concept={concept} question={question} hint={hint}>{children}</PredictGateActive>;
}

function PredictGateActive({ concept, question, hint, children }: Props) {
  const [prediction, setPrediction] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function submit() {
    if (prediction.trim().length === 0) return;
    setSubmitted(true);
  }

  const lockedChildren = isValidElement(children)
    ? cloneElement(children as React.ReactElement, { 'data-locked': String(!submitted) })
    : children;

  return (
    <div className={styles.gate} data-concept={concept}>
      {!submitted && (
        <div className={styles.predictPanel}>
          <h4>Predict first</h4>
          <p className={styles.question}>{question}</p>
          {hint && <p className={styles.hint}>Hint: {hint}</p>}
          <textarea
            value={prediction}
            onChange={e => setPrediction(e.target.value)}
            placeholder="It's OK to be wrong — making the guess is the point."
            rows={3}
          />
          <button type="button" onClick={submit}>Unlock sim</button>
        </div>
      )}
      {submitted && (
        <div className={styles.predictionShown}>
          <strong>Your prediction:</strong> {prediction}
        </div>
      )}
      <div className={submitted ? styles.unlocked : styles.locked}>
        {lockedChildren}
      </div>
    </div>
  );
}
