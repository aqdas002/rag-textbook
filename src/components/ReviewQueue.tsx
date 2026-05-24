import { useMemo } from 'react';
import { getDueCards } from '../lib/srs';
import { RecallPrompt } from './RecallPrompt';
import styles from './ReviewQueue.module.css';

export function ReviewQueue() {
  const due = useMemo(() => getDueCards(), []);
  if (due.length === 0) {
    return <p className={styles.empty}>No reviews due. Come back later.</p>;
  }
  const first = due[0]!;
  return (
    <div className={styles.queue}>
      <h3>{due.length} review{due.length === 1 ? '' : 's'} due</h3>
      <RecallPrompt concept={first.concept} question={first.prompt} />
    </div>
  );
}
