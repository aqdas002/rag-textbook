import { getDueCards } from '../lib/srs';
import styles from './Nav.module.css';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function Nav() {
  const dueCount = getDueCards().length;
  return (
    <nav className={styles.nav}>
      <span className={styles.brand}>RAG Textbook</span>
      <a href={`${BASE}/`} className={styles.link}>Chapters</a>
      <a href={`${BASE}/review`} className={styles.link}>Review</a>
      {dueCount > 0 && <span className={styles.badge}>{dueCount} due</span>}
    </nav>
  );
}
