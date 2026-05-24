// src/Chapter.tsx
import { Suspense, lazy } from 'react';
import { ChapterShell } from './components';

const Content = lazy(() => import('../content/chapters/01-chunking.mdx'));

export function Chapter() {
  return (
    <ChapterShell title="Chunking">
      <Suspense fallback={<p>Loading…</p>}>
        <Content />
      </Suspense>
    </ChapterShell>
  );
}
