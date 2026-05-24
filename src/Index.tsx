import { ChapterShell } from './components';
import { chapters } from './lib/chapters';
import styles from './Index.module.css';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function Index() {
  return (
    <ChapterShell title="RAG Textbook">
      <p className={styles.intro}>
        An interactive textbook for learning Retrieval-Augmented Generation. Each
        chapter mixes prose, prediction-first sims, and recall prompts. Use{' '}
        <code>claude</code> in this directory's terminal as your Socratic tutor.
      </p>
      <ol className={styles.list}>
        {chapters.map(c => (
          <li key={c.id} className={styles.item}>
            <a href={`${BASE}/chapters/${c.id}`} className={styles.link}>
              <span className={styles.order}>{String(c.order).padStart(2, '0')}</span>
              <span className={styles.title}>{c.title}</span>
            </a>
            <p className={styles.blurb}>{c.blurb}</p>
          </li>
        ))}
      </ol>
    </ChapterShell>
  );
}
