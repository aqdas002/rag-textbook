import { getDueCards } from '../lib/srs';
import { usePreferences, setPreference } from '../lib/preferences';
import styles from './Nav.module.css';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function Nav() {
  const dueCount = getDueCards().length;
  const { predictFirst } = usePreferences();
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>RAG Textbook</span>
      <a href={`${BASE}/`} className={styles.link}>Chapters</a>
      <a href={`${BASE}/review`} className={styles.link}>Review</a>
      <button
        type="button"
        className={predictFirst ? styles.toggleActive : styles.toggle}
        onClick={() => setPreference('predictFirst', !predictFirst)}
        aria-pressed={predictFirst}
        data-testid="predict-first-toggle"
      >
        Predict-first: {predictFirst ? 'On' : 'Off'}
      </button>
      {dueCount > 0 && <span className={styles.badge}>{dueCount} due</span>}
    </nav>
  );
}
