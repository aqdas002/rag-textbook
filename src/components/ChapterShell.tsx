import { ReactNode } from 'react';
import { Nav } from './Nav';
import styles from './ChapterShell.module.css';

interface Props {
  title: string;
  children: ReactNode;
}

export function ChapterShell({ title, children }: Props) {
  return (
    <div className={styles.shell}>
      <Nav />
      <main className={styles.main}>
        <h1>{title}</h1>
        {children}
      </main>
    </div>
  );
}
